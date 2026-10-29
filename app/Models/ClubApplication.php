<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClubApplication extends Model
{
    protected $fillable = [
        'user_id', 'club_name', 'club_email', 'club_phone', 'club_address',
        'club_city', 'club_timezone', 'status', 'reviewed_by', 'reviewed_at',
        'rejection_reason', 'approved_club_id',
    ];

    protected function casts(): array
    {
        return ['reviewed_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function approvedClub(): BelongsTo
    {
        return $this->belongsTo(Club::class, 'approved_club_id');
    }
}
