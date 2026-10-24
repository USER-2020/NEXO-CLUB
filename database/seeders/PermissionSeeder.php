<?php

namespace Database\Seeders;

use App\Models\Club;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'dashboard.view',
            'clubs.view',
            'clubs.create',
            'clubs.update',
            'clubs.delete',
            'athletes.view',
            'athletes.create',
            'athletes.update',
            'athletes.delete',
            'athletes.portal.view',
            'athletes.portal.update',
            'disciplines.view',
            'disciplines.create',
            'disciplines.update',
            'disciplines.delete',
            'enrollments.view',
            'enrollments.create',
            'enrollments.update',
            'enrollments.delete',
            'billing.view',
            'billing.manage',
            'payment_methods.view',
            'payment_methods.manage',
            'enrollments.own.view',
            'billing.own.view',
            'team.view',
            'team.manage',
            'audit_logs.view',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $rolePermissions = [
            'superadmin' => $permissions,
            'admin' => [
                'dashboard.view', 'clubs.view', 'clubs.update',
                'athletes.view', 'athletes.create', 'athletes.update', 'athletes.delete',
                'disciplines.view', 'disciplines.create', 'disciplines.update', 'disciplines.delete',
                'enrollments.view', 'enrollments.create', 'enrollments.update', 'enrollments.delete',
                'billing.view', 'billing.manage', 'payment_methods.view', 'payment_methods.manage',
                'team.view', 'team.manage',
            ],
            'contador' => [
                'dashboard.view', 'clubs.view', 'athletes.view', 'disciplines.view',
                'enrollments.view', 'billing.view', 'billing.manage', 'payment_methods.view',
            ],
            'usuario' => [
                'dashboard.view', 'clubs.view', 'athletes.view', 'disciplines.view',
                'enrollments.view', 'billing.view',
            ],
            'deportista' => [
                'dashboard.view', 'athletes.portal.view', 'athletes.portal.update',
                'enrollments.own.view', 'billing.own.view',
            ],
        ];

        $registrar = app(PermissionRegistrar::class);

        // El superadmin es global en producción; los demás roles pertenecen a cada club.
        $registrar->setPermissionsTeamId(null);
        $globalSuperadmin = Role::firstOrCreate([
            'name' => 'superadmin',
            'guard_name' => 'web',
            'team_id' => null,
        ]);
        $globalSuperadmin->syncPermissions($rolePermissions['superadmin']);

        foreach (Club::query()->pluck('id') as $clubId) {
            $registrar->setPermissionsTeamId($clubId);

            foreach (array_keys($rolePermissions) as $roleName) {
                if ($roleName === 'superadmin') {
                    continue;
                }

                $role = Role::firstOrCreate([
                    'name' => $roleName,
                    'guard_name' => 'web',
                    'team_id' => $clubId,
                ]);
                $role->syncPermissions($rolePermissions[$roleName]);
            }
        }

        $registrar->setPermissionsTeamId(null);
        $this->command?->info('Permisos y roles sincronizados correctamente.');
    }
}
