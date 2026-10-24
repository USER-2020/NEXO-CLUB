<?php

namespace Database\Seeders;

use App\Models\Club;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class ClubMembersSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $club = Club::where('slug', 'nexo-club-demo')->firstOrFail();
        app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);

        $this->createMember($club, 'entrenador@nexo.club', 'Entrenador Demo', 'admin', 'NexoEntrenador2026!');
        $this->createMember($club, 'finanzas@nexo.club', 'Contador Demo', 'contador', 'NexoFinanzas2026!');
        $this->createMember($club, 'familia@nexo.club', 'Usuario Demo', 'usuario', 'NexoFamilia2026!');
    }

    private function createMember(Club $club, string $email, string $name, string $roleName, string $password): void
    {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web', 'team_id' => $club->id]);
        $user = User::updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => $password, 'email_verified_at' => now()],
        );

        $user->clubs()->syncWithoutDetaching([$club->id => [
            'status' => 'active',
            'is_default' => false,
            'joined_at' => now(),
        ]]);

        app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
        $user->syncRoles([$roleName]);
    }
}
