<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MonthlyCharge extends Model
{
    use HasFactory;

    protected $fillable = ['club_id', 'enrollment_id', 'period', 'period_end', 'due_date', 'amount', 'status', 'paid_at'];

    protected function casts(): array
    {
        return ['period' => 'date', 'period_end' => 'date', 'due_date' => 'date', 'paid_at' => 'datetime'];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function paymentSubmission(): HasOne
    {
        return $this->hasOne(PaymentSubmission::class)->latestOfMany();
    }

    public function paymentSubmissions(): HasMany
    {
        return $this->hasMany(PaymentSubmission::class);
    }
}
