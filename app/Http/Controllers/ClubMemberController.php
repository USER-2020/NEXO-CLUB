<?php

namespace App\Http\Controllers;

use App\Models\Club;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class ClubMemberController extends Controller
{
    public function index(Request $request): Response
    {
        $club = $this->activeClub($request);
        $this->authorize('manageMembers', $club);
        $search = trim($request->string('q')->toString());

        app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);

        // Los deportistas tienen su propio portal y se administran desde
        // Deportistas; Equipo solo lista usuarios operativos del club.
        $memberQuery = $club->users()
            ->whereDoesntHave('athlete')
            ->when($search, fn ($query) => $query->where(fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")));
        $members = $memberQuery->orderBy('name')->paginate($this->pageSize($request))->withQueryString()->through(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->pivot->status,
            'is_default' => (bool) $user->pivot->is_default,
            'role' => $user->roles->first()?->name,
            'joined_at' => optional($user->pivot->joined_at)->format('Y-m-d'),
        ]);

        return Inertia::render('ClubMembers/Index', [
            'members' => $members,
            'roles' => Role::query()->where('team_id', $club->id)->whereIn('name', ['contador', 'usuario'])->orderBy('name')->pluck('name'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $club = $this->activeClub($request);
        $this->authorize('manageMembers', $club);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', Rule::in(['contador', 'usuario'])],
        ]);

        $user = User::where('email', $data['email'])->first();

        if ($user && $club->users()->whereKey($user->id)->exists()) {
            return back()->withErrors(['email' => 'Este usuario ya pertenece al club.'])->withInput();
        }

        if (! $user) {
            if (blank($data['password'])) {
                return back()->withErrors(['password' => 'La contraseña es obligatoria para un usuario nuevo.'])->withInput();
            }

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'email_verified_at' => now(),
            ]);
        }

        $club->users()->attach($user->id, [
            'status' => 'active',
            'is_default' => false,
            'joined_at' => now(),
        ]);

        $this->setClubTeam($club);
        $user->syncRoles([$data['role']]);
        app(AuditLogger::class)->event('club_member_added', $request->user()->id, ['club_id' => $club->id, 'member_id' => $user->id, 'role' => $data['role']]);

        return to_route('club-members.index')->with('success', 'Miembro agregado correctamente.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $club = $this->activeClub($request);
        $this->authorize('manageMembers', $club);

        abort_unless($club->users()->whereKey($user->id)->exists(), 404);

        $this->setClubTeam($club);
        abort_if($user->hasRole('admin'), 403, 'Los administradores solo pueden ser gestionados por el Superadmin.');

        $data = $request->validate([
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'role' => ['required', Rule::in(['contador', 'usuario'])],
        ]);

        $club->users()->updateExistingPivot($user->id, ['status' => $data['status']]);
        $user->syncRoles([$data['role']]);
        app(AuditLogger::class)->event('club_member_updated', $request->user()->id, ['club_id' => $club->id, 'member_id' => $user->id, 'role' => $data['role'], 'status' => $data['status']]);

        return back()->with('success', 'Permisos del miembro actualizados.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $club = $this->activeClub($request);
        $this->authorize('manageMembers', $club);

        abort_if($request->user()->is($user), 422, 'No puedes retirarte del club desde esta pantalla.');
        abort_unless($club->users()->whereKey($user->id)->exists(), 404);

        $this->setClubTeam($club);
        abort_if($user->hasRole('admin'), 403, 'Los administradores solo pueden ser gestionados por el Superadmin.');
        $user->removeRole($user->roles->first()?->name ?? 'usuario');
        $club->users()->detach($user->id);
        app(AuditLogger::class)->event('club_member_removed', $request->user()->id, ['club_id' => $club->id, 'member_id' => $user->id]);

        return back()->with('success', 'Miembro retirado del club.');
    }

    private function activeClub(Request $request): Club
    {
        return $request->attributes->get('activeClub')
            ?? abort(422, 'No hay un club activo seleccionado.');
    }

    private function setClubTeam(Club $club): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
    }
}
