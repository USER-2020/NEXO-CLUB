<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class ClubPaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'club_id', 'type', 'label', 'provider', 'account_type', 'account_number',
        'account_holder', 'holder_document', 'key_type', 'notes', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'account_number' => 'encrypted',
            'account_holder' => 'encrypted',
            'holder_document' => 'encrypted',
        ];
    }

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }
}
