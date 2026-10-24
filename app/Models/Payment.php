<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = ['club_id', 'monthly_charge_id', 'amount', 'paid_at', 'method', 'reference'];

    protected function casts(): array
    {
        return ['paid_at' => 'datetime'];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function monthlyCharge(): BelongsTo
    {
        return $this->belongsTo(MonthlyCharge::class);
    }
}
