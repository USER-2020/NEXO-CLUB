<?php

namespace App\Services;

use App\Models\Club;
use App\Models\Payment;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;

class ClubFinancialActivity
{
    public function forYear(Club $club, CarbonInterface $date): array
    {
        $yearStart = $date->copy()->startOfYear();
        $months = collect(range(0, 11))->map(fn (int $index) => $yearStart->copy()->addMonths($index));
        $payments = $this->monthlyTotals(Payment::where('club_id', $club->id), 'paid_at', $months->all());
        $outstanding = $this->monthlyTotals(
            $club->monthlyCharges()->getQuery()->whereIn('status', ['pending', 'overdue']),
            'due_date',
            $months->all(),
        );

        return $months->map(fn (CarbonInterface $month, int $index) => [
            'month' => $month->locale('es')->translatedFormat('M'),
            'label' => $month->translatedFormat('F'),
            'paid' => (int) $payments->{"month_{$index}"},
            'outstanding' => (int) $outstanding->{"month_{$index}"},
        ])->all();
    }

    private function monthlyTotals(Builder $query, string $column, array $months): object
    {
        $nextYear = $months[0]->copy()->addYear();
        $format = $column === 'due_date' ? 'Y-m-d' : 'Y-m-d H:i:s';
        $query->where($column, '>=', $months[0]->format($format))->where($column, '<', $nextYear->format($format));

        foreach ($months as $index => $start) {
            $end = $months[$index + 1] ?? $nextYear;
            $query->selectRaw("COALESCE(SUM(CASE WHEN {$column} >= ? AND {$column} < ? THEN amount ELSE 0 END), 0) AS month_{$index}", [
                $start->format($format), $end->format($format),
            ]);
        }

        return $query->toBase()->first();
    }
}
