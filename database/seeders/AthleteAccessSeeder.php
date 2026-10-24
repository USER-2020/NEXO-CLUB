<?php

namespace Database\Seeders;

use App\Models\Athlete;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class AthleteAccessSeeder extends Seeder
{
    public function run(): void
    {
        if (! Schema::hasColumn('athletes', 'user_id')) {
            throw new \RuntimeException(
                'La columna athletes.user_id no existe. Ejecuta primero: php artisan migrate --force'
            );
        }

        $created = 0;
        $linked = 0;
        $withoutEmail = 0;
        $conflicts = 0;

        Athlete::query()
            ->with(['club', 'user'])
            ->whereNull('user_id')
            ->orderBy('id')
            ->each(function (Athlete $athlete) use (&$created, &$linked, &$withoutEmail, &$conflicts): void {
                $club = $athlete->club;
                app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);

                if (blank($athlete->email)) {
                    $withoutEmail++;
                    $this->command?->warn("{$athlete->id}: {$athlete->first_name} {$athlete->last_name} no tiene correo; no se creó acceso.");
                    return;
                }

                $user = User::where('email', $athlete->email)->first();
                if ($user && ($user->athlete || $user->hasAnyRole(['superadmin', 'admin', 'contador']))) {
                    $conflicts++;
                    $this->command?->warn("{$athlete->id}: {$athlete->email} ya pertenece a otra cuenta o rol; se omitió.");
                    return;
                }

                $temporaryPassword = Str::password(12);
                if (! $user) {
                    $user = User::create([
                        'name' => trim($athlete->first_name.' '.$athlete->last_name),
                        'email' => $athlete->email,
                        'password' => $temporaryPassword,
                    ]);
                    $user->forceFill(['email_verified_at' => now()])->save();
                    $created++;
                } else {
                    $user->forceFill(['password' => $temporaryPassword, 'email_verified_at' => $user->email_verified_at ?? now()])->save();
                    $linked++;
                }

                $club->users()->syncWithoutDetaching([
                    $user->id => [
                        'status' => 'active',
                        'is_default' => false,
                        'joined_at' => now(),
                    ],
                ]);

                $role = Role::firstOrCreate([
                    'name' => 'deportista',
                    'guard_name' => 'web',
                    'team_id' => $club->id,
                ]);
                // Una cuenta genérica creada desde Equipo debe dejar de operar como
                // usuario al convertirse en el acceso privado del deportista.
                $user->removeRole('usuario');
                $user->assignRole($role);
                $athlete->update(['user_id' => $user->id]);

                $this->command?->line("ACCESO | {$athlete->first_name} {$athlete->last_name} | {$athlete->email} | contraseña temporal: {$temporaryPassword}");
            });

        app(PermissionRegistrar::class)->setPermissionsTeamId(null);
        $this->command?->newLine();
        $this->command?->info("Accesos creados: {$created}. Accesos vinculados: {$linked}. Sin correo: {$withoutEmail}. Conflictos: {$conflicts}.");
        $this->command?->warn('Guarda las contraseñas temporales mostradas en consola; no se almacenan en texto plano.');
    }
}
