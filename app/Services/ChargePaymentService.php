<?php

namespace App\Services;

use App\Models\MonthlyCharge;
use Illuminate\Support\Facades\DB;

class ChargePaymentService
{
    public const METHODS = ['cash', 'transfer', 'card'];

    public function __construct(private BillingPeriodService $periods) {}

    public function register(MonthlyCharge $charge, string $method, ?string $reference = null): bool
    {
        return DB::transaction(function () use ($charge, $method, $reference): bool {
            $charge = MonthlyCharge::query()
                ->where('club_id', $charge->club_id)
                ->lockForUpdate()
                ->findOrFail($charge->id);
            abort_if($charge->status === 'paid', 422, 'Esta mensualidad ya está pagada.');

            $enrollment = $charge->enrollment()->where('club_id', $charge->club_id)->lockForUpdate()->firstOrFail();
            $paidAt = now();
            $activation = [];

            // El primer pago define el inicio del ciclo de facturación.
            if ($enrollment->status === 'pending' && ! $charge->payment()->exists()) {
                $period = $paidAt->copy()->startOfDay();
                $charge->fill([
                    'period' => $period->toDateString(),
                    'period_end' => $this->periods->end($period, $enrollment->billing_frequency ?? 'monthly')->toDateString(),
                    'due_date' => $period->toDateString(),
                ]);
                $activation['start_date'] = $period->toDateString();
            }

            $charge->payment()->create([
                'club_id' => $charge->club_id,
                'amount' => $charge->amount,
                'paid_at' => $paidAt,
                'method' => $method,
                'reference' => $reference,
            ]);
            $charge->update(['status' => 'paid', 'paid_at' => $paidAt]);

            $activate = in_array($enrollment->status, ['pending', 'suspended'], true);
            if ($activate) {
                $enrollment->update([...$activation, 'status' => 'active', 'suspended_at' => null, 'suspension_reason' => null, 'suspension_notified_at' => null]);
            }

            return $activate;
        });
    }
}
