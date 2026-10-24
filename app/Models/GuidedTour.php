<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuidedTour extends Model
{
    protected $fillable = ['user_id', 'tour_key', 'completed', 'completed_at'];

    protected function casts(): array
    {
        return ['completed' => 'boolean', 'completed_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
