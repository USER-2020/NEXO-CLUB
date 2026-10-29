<?php

namespace App\Console\Commands;

use App\Models\Enrollment;
use App\Models\MonthlyCharge;
use App\Services\BillingPeriodService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateMonthlyCharges extends Command
{
    protected $signature = 'billing:generate-monthly-charges {--date= : Fecha de ejecución en formato Y-m-d}';

    protected $description = 'Genera mensualidades y suspende inscripciones vencidas';

    public function handle(): int
    {
        $today = $this->option('date') ? Carbon::parse($this->option('date'))->startOfDay() : Carbon::today();
        $created = 0;
        $overdue = 0;

        Enrollment::query()
            ->where('status', 'active')
            ->whereDate('start_date', '<=', $today)
            ->where(function ($query) use ($today) {
                $query->whereNull('end_date')->orWhereDate('end_date', '>=', $today);
            })
            ->chunkById(100, function ($enrollments) use ($today, &$created, &$overdue): void {
                foreach ($enrollments as $enrollment) {
                    $latest = $enrollment->charges()->latest('period')->first();
                    if ($latest && $latest->status !== 'paid' && $latest->due_date->lt($today)) {
                        $latest->update(['status' => 'overdue']);
                        if ($enrollment->status !== 'suspended') {
                            $enrollment->update(['status' => 'suspended', 'suspended_at' => $today, 'suspension_reason' => 'Recaudo vencido']);
                            $overdue++;
                        }
                        continue;
                    }
                    $period = $latest?->period_end?->copy()->addDay() ?? Carbon::parse($enrollment->start_date);
                    if ($period->gt($today)) {
                        continue;
                    }
                    $periodEnd = app(BillingPeriodService::class)->end($period, $enrollment->billing_frequency ?? 'monthly');
                    $dueDate = $period->copy();
                    $charge = MonthlyCharge::firstOrCreate(
                        ['enrollment_id' => $enrollment->id, 'period' => $period->toDateString()],
                        ['club_id' => $enrollment->club_id, 'period_end' => $periodEnd->toDateString(), 'due_date' => $dueDate->toDateString(), 'amount' => $enrollment->monthly_amount, 'status' => $dueDate->lt($today) ? 'overdue' : 'pending'],
                    );

                    if ($charge->wasRecentlyCreated) {
                        $created++;
                    }

                    if ($charge->status !== 'paid' && $dueDate->lt($today)) {
                        $charge->update(['status' => 'overdue']);
                        if ($enrollment->status !== 'suspended') {
                            $enrollment->update(['status' => 'suspended', 'suspended_at' => $today, 'suspension_reason' => 'Mensualidad vencida']);
                            $overdue++;
                        }
                    }
                }
            });

        $this->info("Mensualidades creadas: {$created}. Inscripciones suspendidas: {$overdue}.");

        return self::SUCCESS;
    }
}
