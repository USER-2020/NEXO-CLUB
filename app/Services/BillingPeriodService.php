<?php

namespace App\Services;

use Carbon\Carbon;

class BillingPeriodService
{
    public const FREQUENCIES = ['monthly', 'biweekly', 'quarterly', 'semiannual', 'annual'];

    public function end(Carbon $start, string $frequency): Carbon
    {
        return match ($frequency) {
            'biweekly' => $start->copy()->addDays(14),
            'quarterly' => $start->copy()->addMonthsNoOverflow(3)->subDay(),
            'semiannual' => $start->copy()->addMonthsNoOverflow(6)->subDay(),
            'annual' => $start->copy()->addYearNoOverflow()->subDay(),
            default => $start->copy()->addMonthNoOverflow()->subDay(),
        };
    }

    /**
     * Returns the first day of the period that follows the period anchored at
     * the given date. This is also the next charge date after a payment.
     */
    public function nextStart(Carbon $anchor, string $frequency): Carbon
    {
        return $this->end($anchor, $frequency)->addDay();
    }

    public function label(string $frequency): string
    {
        return match ($frequency) {
            'biweekly' => 'Quincenal',
            'quarterly' => 'Trimestral',
            'semiannual' => 'Semestral',
            'annual' => 'Anual',
            default => 'Mensual',
        };
    }
}
