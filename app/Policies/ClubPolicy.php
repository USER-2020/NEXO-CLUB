<?php

namespace App\Policies;

use App\Models\Club;
use App\Models\User;

class ClubPolicy
{
    public function viewAny(User $user): bool
    {
        // La pantalla debe poder mostrar el estado "sin clubes". La consulta
        // del controlador sigue limitando los resultados a los clubes del usuario.
        return true;
    }

    public function view(User $user, Club $club): bool
    {
        return $user->activeClubs()->whereKey($club->getKey())->exists();
    }

    public function create(User $user): bool
    {
        return $user->hasRole('superadmin');
    }

    public function update(User $user, Club $club): bool
    {
        return $user->activeClubs()->whereKey($club->getKey())->exists() && $user->hasAnyRole(['admin', 'superadmin']);
    }

    public function manageMembers(User $user, Club $club): bool
    {
        return $user->activeClubs()->whereKey($club->getKey())->exists()
            && $user->hasAnyRole(['admin', 'superadmin']);
    }

    public function delete(User $user, Club $club): bool
    {
        return $user->hasRole('superadmin');
    }
}
