<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Club extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'email', 'phone', 'address', 'city', 'currency',
        'timezone', 'logo_path', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot(['status', 'is_default', 'joined_at'])->withTimestamps();
    }

    public function activeUsers(): BelongsToMany
    {
        return $this->users()->wherePivot('status', 'active');
    }

    public function primaryAdmin(): BelongsToMany
    {
        return $this->users()
            ->wherePivot('is_default', true)
            ->whereHas('roles', fn ($query) => $query->where('name', 'admin'));
    }

    public function settings(): HasOne
    {
        return $this->hasOne(ClubSetting::class);
    }

    public function disciplines(): HasMany
    {
        return $this->hasMany(Discipline::class);
    }

    public function athletes(): HasMany
    {
        return $this->hasMany(Athlete::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function monthlyCharges(): HasMany
    {
        return $this->hasMany(MonthlyCharge::class);
    }

    public function paymentMethods(): HasMany
    {
        return $this->hasMany(ClubPaymentMethod::class);
    }

    public function locations(): HasMany
    {
        return $this->hasMany(ClubLocation::class);
    }
}
