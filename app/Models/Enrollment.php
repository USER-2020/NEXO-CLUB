<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'club_id', 'athlete_id', 'discipline_id', 'start_date', 'end_date',
        'monthly_amount', 'billing_frequency', 'due_day', 'status', 'suspended_at', 'suspension_reason',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'suspended_at' => 'datetime',
            'monthly_amount' => 'integer',
            'due_day' => 'integer',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function athlete(): BelongsTo
    {
        return $this->belongsTo(Athlete::class);
    }

    public function discipline(): BelongsTo
    {
        return $this->belongsTo(Discipline::class);
    }

    public function charges(): HasMany
    {
        return $this->hasMany(MonthlyCharge::class);
    }
}
