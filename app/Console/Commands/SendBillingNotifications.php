<?php

namespace App\Console\Commands;

use App\Mail\EnrollmentSuspendedMail;
use App\Mail\OutstandingChargesReportMail;
use App\Mail\PaymentReminderMail;
use App\Models\Club;
use App\Models\Enrollment;
use App\Models\MonthlyCharge;
use App\Services\OutstandingChargesSpreadsheet;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\PermissionRegistrar;

class SendBillingNotifications extends Command
{
    protected $signature = 'billing:send-notifications {--date= : Fecha de ejecución en formato Y-m-d}';

    protected $description = 'Envía recordatorios de mensualidades y reportes diarios a los administradores';

    public function handle(): int
    {
        if (! config('nexo.notifications.enabled')) {
            $this->info('Notificaciones desactivadas. No se enviaron correos.');

            return self::SUCCESS;
        }
        $today = $this->option('date') ? Carbon::parse($this->option('date'))->startOfDay() : Carbon::today();
        $tomorrow = $today->copy()->addDay();
        $recipients = ['athletes' => [], 'admins' => []];
        MonthlyCharge::query()
            ->with(['enrollment.athlete', 'enrollment.discipline', 'club'])
            ->where('status', 'pending')
            ->whereDate('due_date', $tomorrow)
            ->whereHas('enrollment', fn ($query) => $query->where('status', 'active'))
            ->get()
            ->each(function (MonthlyCharge $charge) use (&$recipients): void {
                $this->sendToAthlete($charge, 'reminder', $recipients['athletes']);
            });
        MonthlyCharge::query()
            ->with(['enrollment.athlete', 'enrollment.discipline', 'club'])
            ->whereIn('status', ['pending', 'overdue'])
            ->whereDate('due_date', $today)
            ->whereHas('enrollment', fn ($query) => $query->where('status', 'active'))
            ->get()
            ->each(function (MonthlyCharge $charge) use (&$recipients): void {
                $this->sendToAthlete($charge, 'due', $recipients['athletes']);
            });
        Club::query()
            ->with(['monthlyCharges.enrollment.athlete', 'monthlyCharges.enrollment.discipline'])
            ->whereHas('monthlyCharges', fn ($query) => $query->whereIn('status', ['pending', 'overdue'])->whereHas('enrollment', fn ($query) => $query->where('status', 'active')))
            ->get()
            ->each(function (Club $club) use (&$recipients): void {
                $this->sendAdminReport($club, $recipients['admins']);
            });
        $this->sendSuspensionNotifications($today, $recipients);
        $this->line('Fecha procesada: '.$today->toDateString().' (America/Bogota)');
        $this->info('Destinatarios deportistas: '.count(array_unique($recipients['athletes'])));
        $this->line($this->formatRecipients($recipients['athletes']));
        $this->info('Destinatarios administradores: '.count(array_unique($recipients['admins'])));
        $this->line($this->formatRecipients($recipients['admins']));
        $this->info('Notificaciones de mensualidades procesadas.');

        return self::SUCCESS;
    }

    private function sendToAthlete(MonthlyCharge $charge, string $kind, array &$recipients): void
    {
        if ($email = $charge->enrollment->athlete->email) {
            Mail::to($email)->send(new PaymentReminderMail($charge, $kind));
            $recipients[] = $email;
        }
    }

    private function sendAdminReport(Club $club, array &$recipients): void
    {
        $charges = $club->monthlyCharges
            ->whereIn('status', ['pending', 'overdue'])
            ->filter(fn (MonthlyCharge $charge) => $charge->enrollment->status === 'active');
        $emails = $this->adminEmails($club);
        if ($charges->isEmpty() || $emails === []) {
            return;
        }

        $rows = $charges->map(function (MonthlyCharge $charge): array {
            $athlete = $charge->enrollment->athlete;

            return [
                'athlete' => trim($athlete->first_name.' '.$athlete->last_name),
                'discipline' => $charge->enrollment->discipline->name,
                'period' => $charge->period,
                'due_date' => $charge->due_date,
                'amount' => (int) $charge->amount,
                'status' => $charge->status === 'overdue' ? 'Vencido' : 'Pendiente',
                'whatsapp_url' => $this->whatsappUrl($athlete->phone),
            ];
        })->values()->all();

        $xlsx = app(OutstandingChargesSpreadsheet::class)->build($rows);
        foreach ($emails as $email) {
            Mail::to($email)->send(new OutstandingChargesReportMail($club, $rows, $xlsx));
            $recipients[] = $email;
        }
    }

    private function whatsappUrl(?string $phone): ?string
    {
        $phone = trim($phone ?? '');
        if (! preg_match('/^\+?[\d\s().-]+$/D', $phone)) {
            return null;
        }

        $number = preg_replace('/\D/', '', $phone);
        if (str_starts_with($number, '00')) {
            $number = substr($number, 2);
        } elseif (! str_starts_with($phone, '+') && preg_match('/^(?:3\d{9}|60[1-8]\d{7})$/D', $number)) {
            $number = '57'.$number;
        }

        if (! preg_match('/^[1-9]\d{7,14}$/D', $number) || (str_starts_with($number, '57') && strlen($number) !== 12)) {
            return null;
        }

        return 'https://wa.me/'.$number;
    }

    private function sendSuspensionNotifications(Carbon $today, array &$recipients): void
    {
        Enrollment::query()
            ->with(['athlete', 'discipline', 'club', 'charges' => fn ($query) => $query->whereIn('status', ['pending', 'overdue'])->latest('due_date')])
            ->where('status', 'suspended')
            ->whereNotNull('suspended_at')
            ->whereNull('suspension_notified_at')
            ->whereDate('suspended_at', '<=', $today->copy()->subDays(5))
            ->get()
            ->each(function (Enrollment $enrollment) use (&$recipients): void {
                $charge = $enrollment->charges->first();
                if ($enrollment->athlete?->email) {
                    Mail::to($enrollment->athlete->email)->send(new EnrollmentSuspendedMail($enrollment, $charge));
                    $recipients['athletes'][] = $enrollment->athlete->email;
                }

                foreach ($this->adminEmails($enrollment->club) as $email) {
                    Mail::to($email)->send(new EnrollmentSuspendedMail($enrollment, $charge, true));
                    $recipients['admins'][] = $email;
                }

                $enrollment->update(['suspension_notified_at' => now()]);
            });
    }

    private function adminEmails(Club $club): array
    {
        $permissions = app(PermissionRegistrar::class);
        $previousTeam = $permissions->getPermissionsTeamId();
        $permissions->setPermissionsTeamId($club->id);

        try {
            return $club->activeUsers()
                ->whereHas('roles', fn ($query) => $query->where('name', 'admin'))
                ->pluck('email')
                ->filter()
                ->all();
        } finally {
            $permissions->setPermissionsTeamId($previousTeam);
        }
    }

    private function formatRecipients(array $recipients): string
    {
        $unique = array_values(array_unique($recipients));

        return $unique ? 'Correos: '.implode(', ', $unique) : 'Correos: ninguno';
    }
}
