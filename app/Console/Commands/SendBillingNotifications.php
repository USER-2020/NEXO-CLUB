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
        MonthlyCharge::query()->with(['enrollment.athlete', 'enrollment.discipline', 'club'])->where('status', 'pending')->whereDate('due_date', $tomorrow)->get()->each(fn (MonthlyCharge $charge) => $this->sendToAthlete($charge, 'reminder'));
        MonthlyCharge::query()->with(['enrollment.athlete', 'enrollment.discipline', 'club'])->whereIn('status', ['pending', 'overdue'])->whereDate('due_date', $today)->get()->each(fn (MonthlyCharge $charge) => $this->sendToAthlete($charge, 'due'));
        Club::query()->with(['activeUsers', 'monthlyCharges.enrollment.athlete', 'monthlyCharges.enrollment.discipline'])->whereHas('monthlyCharges', fn ($query) => $query->whereIn('status', ['pending', 'overdue']))->get()->each(fn (Club $club) => $this->sendAdminReport($club));
        $this->info('Notificaciones de mensualidades procesadas.');
        return self::SUCCESS;
    }

    private function sendToAthlete(MonthlyCharge $charge, string $kind): void
    {
        if ($email = $charge->enrollment->athlete->email) Mail::to($email)->send(new PaymentReminderMail($charge, $kind));
    }

    private function sendAdminReport(Club $club): void
    {
        $charges = $club->monthlyCharges->whereIn('status', ['pending', 'overdue']);
        if ($charges->isEmpty()) return;
        $stream = fopen('php://temp', 'r+');
        fputcsv($stream, ['Deportista', 'Disciplina', 'Periodo', 'Vencimiento', 'Valor', 'Estado']);
        foreach ($charges as $charge) fputcsv($stream, [$charge->enrollment->athlete->first_name.' '.$charge->enrollment->athlete->last_name, $charge->enrollment->discipline->name, $charge->period->toDateString(), $charge->due_date->toDateString(), $charge->amount, $charge->status]);
        rewind($stream); $csv = stream_get_contents($stream); fclose($stream);
        foreach ($club->activeUsers->filter(fn ($user) => $user->hasRole('admin'))->pluck('email')->filter() as $email) Mail::to($email)->send(new OutstandingChargesReportMail($club, $csv));
    }
}
