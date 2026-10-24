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
        $club = app()->environment('production')
            ? null
            : Club::where('slug', 'nexo-club-demo')->firstOrFail();

        app(PermissionRegistrar::class)->setPermissionsTeamId($club?->id);
        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web', 'team_id' => $club?->id]);
        $user = User::updateOrCreate(
            ['email' => env('SUPERADMIN_EMAIL', 'superadmin@nexo.club')],
            [
                'name' => env('SUPERADMIN_NAME', 'Superadmin NEXO CLUB'),
                'password' => env('SUPERADMIN_PASSWORD', 'NexoSuper2026!'),
                'email_verified_at' => now(),
            ],
        );

        if ($club) {
            $user->clubs()->syncWithoutDetaching([$club->id => ['status' => 'active', 'is_default' => false, 'joined_at' => now()]]);
            $user->clubs()->updateExistingPivot($club->id, ['is_default' => false]);
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($club?->id);
        $user->syncRoles(['superadmin']);
    }
}
