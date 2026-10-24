<?php

namespace App\Policies;

use App\Models\Discipline;
use App\Models\User;

class DisciplinePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->activeClubs()->exists();
    }

    public function view(User $user, Discipline $discipline): bool
    {
        return $user->activeClubs()->whereKey($discipline->club_id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['superadmin', 'admin']);
    }

    public function update(User $user, Discipline $discipline): bool
    {
        return $this->view($user, $discipline) && $this->create($user);
    }

    public function delete(User $user, Discipline $discipline): bool
    {
        return $this->update($user, $discipline);
    }
}
