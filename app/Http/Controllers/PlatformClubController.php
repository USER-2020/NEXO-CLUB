<?php

namespace App\Http\Controllers;

use App\Models\Club;
use App\Models\ClubApplication;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PlatformClubController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim($request->string('q')->toString());
        $clubs = Club::withCount(['users', 'disciplines'])->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('slug', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")->orWhere('city', 'like', "%{$search}%"))->orderBy('name')->paginate($this->pageSize($request))->withQueryString();
        $clubs->getCollection()->each(function (Club $club): void {
            app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
            $club->load('primaryAdmin:id,name,email');
        });

        return Inertia::render('Platform/Clubs', [
            'clubs' => $clubs,
            'applications' => ClubApplication::with('user:id,name,email,email_verified_at')->where('status', 'pending')->latest()->get()->map(fn (ClubApplication $application) => [
                'id' => $application->id,
                'applicant' => $application->user->only(['name', 'email']),
                'email_verified_at' => $application->user->email_verified_at,
                'club_name' => $application->club_name,
                'club_email' => $application->club_email,
                'club_phone' => $application->club_phone,
                'club_address' => $application->club_address,
                'club_city' => $application->club_city,
                'club_timezone' => $application->club_timezone,
                'created_at' => $application->created_at,
            ])->values(),
            'createdAccess' => session('createdAccess'),
        ]);
    }

    public function show(Club $club): Response
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
        $club->load([
            'primaryAdmin:id,name,email',
            'disciplines:id,club_id,name,is_active',
            'users:id,name,email',
            'users.roles:id,name,guard_name,team_id',
        ]);

        return Inertia::render('Platform/ClubDetails', [
            'club' => [
                'id' => $club->id,
                'name' => $club->name,
                'slug' => $club->slug,
                'email' => $club->email,
                'city' => $club->city,
                'timezone' => $club->timezone,
                'is_active' => $club->is_active,
                'created_at' => $club->created_at,
                'primary_admin' => $club->primaryAdmin->first()?->only(['id', 'name', 'email']),
                'disciplines' => $club->disciplines->map(fn ($discipline) => [
                    'id' => $discipline->id,
                    'name' => $discipline->name,
                    'is_active' => $discipline->is_active,
                ])->values(),
                'members' => $club->users->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'status' => $user->pivot->status,
                    'role' => $user->roles->first()?->name,
                    'is_default' => (bool) $user->pivot->is_default,
                ])->values(),
            ],
            'adminAccess' => session('adminAccess'),
        ]);
    }

    public function addAdmin(Request $request, Club $club): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        [$admin, $temporaryPassword, $isPrimary] = DB::transaction(function () use ($data, $club): array {
            $admin = User::where('email', $data['email'])->first();
            $temporaryPassword = null;

            if (! $admin) {
                abort_if(blank($data['password']), 422, 'La contraseña es obligatoria para un administrador nuevo.');
                $temporaryPassword = $data['password'];
                $admin = User::create([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => Hash::make($data['password']),
                    'email_verified_at' => now(),
                ]);
            }

            abort_if($club->users()->whereKey($admin->id)->exists(), 422, 'Este usuario ya pertenece al club.');

            app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
            $isPrimary = ! $club->primaryAdmin()->exists();
            $club->users()->attach($admin->id, [
                'status' => 'active',
                'is_default' => $isPrimary,
                'joined_at' => now(),
            ]);

            Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web', 'team_id' => $club->id]);
            $admin->syncRoles(['admin']);
            app(AuditLogger::class)->event('club_admin_added', $request->user()->id, ['club_id' => $club->id, 'admin_id' => $admin->id, 'primary' => $isPrimary]);

            return [$admin, $temporaryPassword, $isPrimary];
        });

        return to_route('platform.clubs.show', $club)
            ->with('success', $isPrimary ? 'Administrador principal asociado correctamente.' : 'Administrador asociado correctamente.')
            ->with('adminAccess', [
                'name' => $admin->name,
                'email' => $admin->email,
                'password' => $temporaryPassword,
                'primary' => $isPrimary,
                'existing' => $temporaryPassword === null,
            ]);
    }

    public function removeAdmin(Club $club, User $user): RedirectResponse
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
        abort_unless($club->users()->whereKey($user->id)->exists(), 404);
        abort_unless($user->hasRole('admin'), 422, 'El usuario no es administrador de este club.');

        $membership = $club->users()->whereKey($user->id)->first();
        $replacement = null;

        if ((bool) $membership?->pivot->is_default) {
            $replacement = $club->users
                ->filter(fn (User $member) => $member->id !== $user->id && $member->hasRole('admin'))
                ->sortBy('id')
                ->first();

            abort_unless($replacement, 422, 'No puedes retirar al administrador principal sin otro administrador asociado.');
        }

        $user->removeRole('admin');
        $club->users()->detach($user->id);

        if ($replacement) {
            $club->users()->updateExistingPivot($replacement->id, ['is_default' => true]);
        }

        app(AuditLogger::class)->event('club_admin_removed', request()->user()->id, ['club_id' => $club->id, 'admin_id' => $user->id, 'replacement_id' => $replacement?->id]);

        return back()->with('success', 'Administrador retirado correctamente del club.');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'timezone' => ['required', 'timezone'],
            'admin_name' => ['required', 'string', 'max:120'],
            'admin_email' => ['required', 'email', 'max:255'],
            'admin_password' => ['nullable', 'string', 'min:8'],
        ]);

        [$club, $admin, $temporaryPassword] = DB::transaction(function () use ($data, $request): array {
            $club = Club::create([
                'name' => $data['name'],
                'email' => $data['email'] ?? null,
                'city' => $data['city'] ?? null,
                'timezone' => $data['timezone'],
                'slug' => $this->uniqueSlug($data['name']),
            ]);
            $club->settings()->create(['reminder_days' => [5, 2, 0, -3, -7]]);

            $admin = User::where('email', $data['admin_email'])->first();
            $temporaryPassword = null;

            if (! $admin) {
                abort_if(blank($data['admin_password']), 422, 'La contraseña del administrador es obligatoria.');
                $temporaryPassword = $data['admin_password'];
                $admin = User::create([
                    'name' => $data['admin_name'],
                    'email' => $data['admin_email'],
                    'password' => Hash::make($data['admin_password']),
                    'email_verified_at' => now(),
                ]);
            }

            $club->users()->attach($request->user()->id, ['status' => 'active', 'is_default' => false, 'joined_at' => now()]);
            $club->users()->syncWithoutDetaching([$admin->id => ['status' => 'active', 'is_default' => true, 'joined_at' => now()]]);

            app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
            Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web', 'team_id' => $club->id]);
            $admin->syncRoles(['admin']);

            return [$club, $admin, $temporaryPassword];
        });

        return to_route('platform.clubs.index')->with('success', 'Club creado correctamente desde la plataforma.')->with('createdAccess', [
            'club' => $club->name,
            'name' => $admin->name,
            'email' => $admin->email,
            'password' => $temporaryPassword,
            'existing' => $temporaryPassword === null,
        ]);
    }

    public function destroy(Club $club): RedirectResponse
    {
        DB::transaction(function () use ($club): void {
            DB::table('model_has_permissions')->where('team_id', $club->id)->delete();
            DB::table('model_has_roles')->where('team_id', $club->id)->delete();
            DB::table('roles')->where('team_id', $club->id)->delete();
            $club->delete();
        });

        return to_route('platform.clubs.index')->with('success', 'Club eliminado correctamente.');
    }

    public function toggle(Club $club): RedirectResponse
    {
        $club->update(['is_active' => ! $club->is_active]);

        return back()->with('success', $club->is_active
            ? 'Club activado correctamente.'
            : 'Club desactivado correctamente.');
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 2;

        while (Club::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }
}
