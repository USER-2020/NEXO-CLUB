<?php

namespace Database\Seeders;

use App\Models\Club;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class SuperadminUserSeeder extends Seeder
{
    public function run(): void
    {
        $name = env('SUPERADMIN_NAME');
        $email = env('SUPERADMIN_EMAIL');
        $password = env('SUPERADMIN_PASSWORD');

        if (blank($name) || blank($email) || blank($password)) {
            throw new \RuntimeException(
                'Faltan SUPERADMIN_NAME, SUPERADMIN_EMAIL o SUPERADMIN_PASSWORD en el archivo .env.'
            );
        }

        $club = app()->environment('production')
            ? null
            : Club::where('slug', 'nexo-club-demo')->firstOrFail();

        app(PermissionRegistrar::class)->setPermissionsTeamId($club?->id);
        $superadminRole = Role::firstOrCreate([
            'name' => 'superadmin',
            'guard_name' => 'web',
            'team_id' => $club?->id,
        ]);
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => $password,
                'email_verified_at' => now(),
            ],
        );

        if ($club) {
            $user->clubs()->syncWithoutDetaching([$club->id => ['status' => 'active', 'is_default' => false, 'joined_at' => now()]]);
            $user->clubs()->updateExistingPivot($club->id, ['is_default' => false]);
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($club?->id);
        $user->syncRoles([$superadminRole]);
    }
}
