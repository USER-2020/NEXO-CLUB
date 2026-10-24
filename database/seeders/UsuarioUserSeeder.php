<?php

namespace Database\Seeders;

use App\Models\Club;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class UsuarioUserSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $club = Club::where('slug', 'nexo-club-demo')->firstOrFail();
        app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
        Role::firstOrCreate(['name' => 'usuario', 'guard_name' => 'web', 'team_id' => $club->id]);
        $user = User::updateOrCreate(
            ['email' => 'usuario@nexo.club'],
            ['name' => 'Usuario de Pruebas', 'password' => 'NexoUsuario2026!', 'email_verified_at' => now()],
        );

        $user->clubs()->syncWithoutDetaching([$club->id => ['status' => 'active', 'is_default' => true, 'joined_at' => now()]]);
        app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
        $user->syncRoles(['usuario']);
    }
}
