<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class PlatformAccess
{
    public function isSuperadmin(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('model_has_roles.model_id', $user->getKey())
            ->where('model_has_roles.model_type', $user->getMorphClass())
            ->where('roles.name', 'superadmin')
            ->where('roles.guard_name', 'web')
            ->exists();
    }
}
