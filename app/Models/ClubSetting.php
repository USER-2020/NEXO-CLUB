<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClubSetting extends Model
{
    protected $fillable = ['club_id', 'enrollment_fee_amount', 'monthly_due_day', 'mid_month_policy', 'payment_instructions', 'reminder_days'];

    protected function casts(): array
    {
        return ['reminder_days' => 'array'];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }
}
