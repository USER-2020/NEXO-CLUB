<?php

namespace App\Console\Commands;

use App\Mail\OutstandingChargesReportMail;
use App\Mail\PaymentReminderMail;
use App\Models\Club;
use App\Models\MonthlyCharge;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

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
        MonthlyCharge::query()
            ->with(['enrollment.athlete', 'enrollment.discipline', 'club'])
            ->where('status', 'pending')
            ->whereDate('due_date', $tomorrow)
            ->whereHas('enrollment', fn ($query) => $query->where('status', 'active'))
            ->get()
            ->each(fn (MonthlyCharge $charge) => $this->sendToAthlete($charge, 'reminder'));
        MonthlyCharge::query()
            ->with(['enrollment.athlete', 'enrollment.discipline', 'club'])
            ->whereIn('status', ['pending', 'overdue'])
            ->whereDate('due_date', $today)
            ->whereHas('enrollment', fn ($query) => $query->where('status', 'active'))
            ->get()
            ->each(fn (MonthlyCharge $charge) => $this->sendToAthlete($charge, 'due'));
        Club::query()
            ->with(['activeUsers', 'monthlyCharges.enrollment.athlete', 'monthlyCharges.enrollment.discipline'])
            ->whereHas('monthlyCharges', fn ($query) => $query->whereIn('status', ['pending', 'overdue'])->whereHas('enrollment', fn ($query) => $query->where('status', 'active')))
            ->get()
            ->each(fn (Club $club) => $this->sendAdminReport($club));
        $this->info('Notificaciones de mensualidades procesadas.');

        return self::SUCCESS;
    }

    private function sendToAthlete(MonthlyCharge $charge, string $kind): void
    {
        if ($email = $charge->enrollment->athlete->email) {
            Mail::to($email)->send(new PaymentReminderMail($charge, $kind));
        }
    }

    private function sendAdminReport(Club $club): void
    {
        $charges = $club->monthlyCharges
            ->whereIn('status', ['pending', 'overdue'])
            ->filter(fn (MonthlyCharge $charge) => $charge->enrollment->status === 'active');
        if ($charges->isEmpty()) {
            return;
        }
        $excel = $this->buildExcel($charges);
        foreach ($club->activeUsers->filter(fn ($user) => $user->hasRole('admin'))->pluck('email')->filter() as $email) {
            Mail::to($email)->send(new OutstandingChargesReportMail($club, $excel));
        }
    }

    private function buildExcel($charges): string
    {
        $headers = ['Deportista', 'Disciplina', 'Periodo', 'Vencimiento', 'Valor', 'Estado'];
        $rows = [$headers];

        foreach ($charges as $charge) {
            $rows[] = [
                $charge->enrollment->athlete->first_name.' '.$charge->enrollment->athlete->last_name,
                $charge->enrollment->discipline->name,
                $charge->period->toDateString(),
                $charge->due_date->toDateString(),
                $charge->amount,
                $charge->status === 'overdue' ? 'Vencido' : 'Pendiente',
            ];
        }

        $xmlRows = collect($rows)->map(function (array $row): string {
            $cells = collect($row)->map(function ($value, int $columnIndex): string {
                $type = is_numeric($value) && $columnIndex === 4 ? 'Number' : 'String';
                $escaped = htmlspecialchars((string) $value, ENT_XML1 | ENT_QUOTES, 'UTF-8');

                return "<Cell><Data ss:Type=\"{$type}\">{$escaped}</Data></Cell>";
            })->implode('');

            return "<Row>{$cells}</Row>";
        })->implode('');

        return '<?xml version="1.0" encoding="UTF-8"?>'
            .'<?mso-application progid="Excel.Sheet"?>'
            .'<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'
            .'<Worksheet ss:Name="Cobros pendientes"><Table>'.$xmlRows.'</Table></Worksheet>'
            .'</Workbook>';
    }
}
