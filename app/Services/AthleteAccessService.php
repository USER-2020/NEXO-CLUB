<?php

namespace App\Services;

use App\Models\Athlete;
use Carbon\Carbon;

class AthleteAccessService
{
    public function hasCurrentSubscription(?Athlete $athlete, ?Carbon $today = null): bool
    {
        if (! $athlete) {
            return false;
        }

        $today ??= Carbon::today();

        return $athlete->status === 'active'
            && $athlete->enrollments()
                ->where('status', 'active')
                ->whereDate('start_date', '<=', $today)
                ->where(function ($query) use ($today): void {
                    $query->whereNull('end_date')->orWhereDate('end_date', '>=', $today);
                })
                ->whereHas('charges', function ($query) use ($today): void {
                    $query->where('status', 'paid')->where(function ($query) use ($today): void {
                        $query->whereDate('period_end', '>=', $today)
                            ->orWhere(function ($query) use ($today): void {
                                $query->whereNull('period_end')->whereDate('period', '>=', $today->copy()->startOfMonth());
                            });
                    });
                })
                ->exists();
    }
}
