<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\Club;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\PermissionRegistrar;
use Spatie\Permission\Models\Role;

class AthleteController extends Controller
{
    public function index(Request $request): Response
    {
        $club = $this->club($request);
        $this->authorizeManager($request);
        $search = trim($request->string('q')->toString());
        $query = $club->athletes();
        $query->when($search, fn ($query) => $query->where(fn ($query) => $query->where('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%")->orWhere('document_number', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%")));

        return Inertia::render('Athletes/Index', [
            'athletes' => $query->withCount(['enrollments as active_enrollments_count' => fn ($query) => $query->where('status', 'active')])->orderBy('last_name')->orderBy('first_name')->paginate(20)->through(fn (Athlete $athlete) => [
                ...$athlete->toArray(),
                'has_photo' => filled($athlete->photo_path),
            ]),
            'athleteAccess' => session('athleteAccess'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $club = $this->club($request);
        $this->authorizeManager($request);
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'document_type' => ['required', Rule::in(['tarjeta_identidad', 'cedula_ciudadania', 'pasaporte', 'otro'])],
            'document_number' => ['nullable', 'string', 'max:40', Rule::unique('athletes')->where(fn ($query) => $query->where('club_id', $club->id))],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'height_cm' => ['nullable', 'numeric', 'min:30', 'max:260'],
            'weight_kg' => ['nullable', 'numeric', 'min:1', 'max:400'],
            'shirt_size' => ['nullable', 'string', 'max:20'],
            'shoe_size' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:255'],
            'guardian_name' => ['nullable', 'string', 'max:120'],
            'guardian_phone' => ['nullable', 'string', 'max:40'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);
        $photo = $request->file('photo');
        unset($data['photo']);
        $existingUser = filled($data['email'] ?? null) ? User::where('email', $data['email'])->first() : null;
        if ($existingUser) {
            return back()->withErrors(['email' => 'Este correo ya tiene una cuenta. Usa otro correo o solicita una vinculación manual.'])->withInput();
        }

        $temporaryPassword = filled($data['email'] ?? null) ? Str::password(12) : null;

        $athlete = DB::transaction(function () use ($club, $data, $photo, $temporaryPassword) {
            $user = null;
            if ($temporaryPassword) {
                $user = User::create([
                    'name' => trim($data['first_name'].' '.$data['last_name']),
                    'email' => $data['email'],
                    'password' => $temporaryPassword,
                ]);
                $user->forceFill(['email_verified_at' => now()])->save();
                $club->users()->attach($user->id, [
                    'status' => 'active',
                    'is_default' => false,
                    'joined_at' => now(),
                ]);
                app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
                $role = Role::firstOrCreate(['name' => 'deportista', 'guard_name' => 'web', 'team_id' => $club->id]);
                $user->syncRoles([$role]);
            }

            $athlete = $club->athletes()->create([
                ...$data,
                'user_id' => $user?->id,
                'status' => 'active',
            ]);
            if ($photo) {
                $athlete->update(['photo_path' => $photo->store("athletes/{$club->id}", 'local')]);
            }

            return $athlete;
        });

        $response = back()->with('success', 'Deportista registrado correctamente.');
        if ($temporaryPassword) {
            $response->with('athleteAccess', [
                'name' => trim($data['first_name'].' '.$data['last_name']),
                'email' => $data['email'],
                'password' => $temporaryPassword,
            ]);
        }

        return $response;
    }

    public function update(Request $request, Athlete $athlete): RedirectResponse
    {
        $club = $this->club($request);
        $this->authorizeManager($request);
        abort_unless($athlete->club_id === $club->id, 404);

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'document_type' => ['required', Rule::in(['tarjeta_identidad', 'cedula_ciudadania', 'pasaporte', 'otro'])],
            'document_number' => ['nullable', 'string', 'max:40', Rule::unique('athletes')->where(fn ($query) => $query->where('club_id', $club->id))->ignore($athlete->id)],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'height_cm' => ['nullable', 'numeric', 'min:30', 'max:260'],
            'weight_kg' => ['nullable', 'numeric', 'min:1', 'max:400'],
            'shirt_size' => ['nullable', 'string', 'max:20'],
            'shoe_size' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:255'],
            'guardian_name' => ['nullable', 'string', 'max:120'],
            'guardian_phone' => ['nullable', 'string', 'max:40'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);
        $photo = $request->file('photo');
        unset($data['photo']);
        $athlete->update($data);

        if ($photo) {
            $oldPhoto = $athlete->photo_path;
            $athlete->update(['photo_path' => $photo->store("athletes/{$club->id}", 'local')]);
            if ($oldPhoto) {
                Storage::disk('local')->delete($oldPhoto);
            }
        }

        return back()->with('success', 'Perfil del deportista actualizado correctamente.');
    }

    public function photo(Request $request, Athlete $athlete)
    {
        $club = $this->club($request);
        abort_unless($athlete->club_id === $club->id, 404);
        abort_unless($athlete->photo_path && Storage::disk('local')->exists($athlete->photo_path), 404);

        return response()->file(Storage::disk('local')->path($athlete->photo_path));
    }

    public function status(Request $request, Athlete $athlete): RedirectResponse
    {
        $club = $this->club($request);
        $this->authorizeManager($request);
        abort_unless($athlete->club_id === $club->id, 404);

        $status = $request->validate(['status' => ['required', Rule::in(['active', 'inactive'])]])['status'];
        $athlete->update(['status' => $status]);

        return back()->with('success', $status === 'active'
            ? 'Deportista activado correctamente.'
            : 'Deportista desactivado correctamente.');
    }

    private function club(Request $request): Club
    {
        return $request->attributes->get('activeClub') ?? abort(422, 'No hay un club activo seleccionado.');
    }

    private function authorizeManager(Request $request): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($request->attributes->get('activeClub')->id);
        abort_unless($request->user()->hasRole('admin'), 403, 'Solo un administrador puede gestionar deportistas.');
    }
}
