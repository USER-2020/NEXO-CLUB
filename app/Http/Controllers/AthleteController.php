<?php

namespace App\Http\Controllers;

use App\Mail\AthleteAccessMail;
use App\Mail\AthleteEnrollmentUpdatedMail;
use App\Models\Athlete;
use App\Models\Club;
use App\Models\User;
use App\Services\BillingPeriodService;
use App\Services\ChargePaymentService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

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
            'athletes' => $query->with(['enrollments.discipline'])->withCount(['enrollments as active_enrollments_count' => fn ($query) => $query->where('status', 'active')])->orderBy('last_name')->orderBy('first_name')->paginate($this->pageSize($request))->withQueryString()->through(fn (Athlete $athlete) => [
                ...$athlete->makeHidden('photo_path')->toArray(),
                'photo_url' => $athlete->photoUrl(),
                'current_enrollment' => $athlete->enrollments->sortByDesc('created_at')->first()?->only(['id', 'discipline_id', 'start_date', 'billing_frequency', 'monthly_amount', 'due_day', 'status']),
            ]),
            'disciplines' => $club->disciplines()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'today' => today()->toDateString(),
            'athleteAccess' => session('athleteAccess'),
        ]);
    }

    public function store(Request $request, ChargePaymentService $payments): RedirectResponse
    {
        $club = $this->club($request);
        $this->authorizeManager($request);
        $payNow = $request->input('initial_charge_mode') === 'paid';
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
            'discipline_id' => [Rule::requiredIf($payNow), 'nullable', 'integer', Rule::exists('disciplines', 'id')->where(fn ($query) => $query->where('club_id', $club->id)->where('is_active', true))],
            'start_date' => ['exclude_if:initial_charge_mode,paid', 'nullable', 'date'],
            'billing_frequency' => ['nullable', Rule::in(BillingPeriodService::FREQUENCIES)],
            'monthly_amount' => ['nullable', 'integer', 'min:0'],
            'due_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'initial_charge_mode' => ['sometimes', Rule::in(['pending', 'paid'])],
            'payment_method' => ['exclude_unless:initial_charge_mode,paid', 'required', Rule::in(ChargePaymentService::METHODS)],
            'payment_reference' => ['exclude_unless:initial_charge_mode,paid', 'nullable', 'string', 'max:100'],
        ], [
            'discipline_id.required' => 'Selecciona una disciplina para registrar el pago.',
            'payment_method.required' => 'Selecciona cómo recibiste el pago.',
        ]);
        if ($payNow) {
            $data['start_date'] = today()->toDateString();
        }
        if (filled($data['discipline_id'] ?? null)) {
            validator($data, [
                'start_date' => ['required', 'date'],
                'billing_frequency' => ['required', Rule::in(BillingPeriodService::FREQUENCIES)],
                'monthly_amount' => ['required', 'integer', 'min:0'],
                'due_day' => ['required', 'integer', 'min:1', 'max:31'],
            ])->validate();
        }
        $photo = $request->file('photo');
        unset($data['photo']);
        $enrollmentData = array_intersect_key($data, array_flip(['discipline_id', 'start_date', 'billing_frequency', 'monthly_amount', 'due_day']));
        $hasEnrollment = filled($enrollmentData['discipline_id'] ?? null);
        $paymentMethod = $data['payment_method'] ?? null;
        $paymentReference = $data['payment_reference'] ?? null;
        $data = array_diff_key($data, $enrollmentData, array_flip(['initial_charge_mode', 'payment_method', 'payment_reference']));
        $existingUser = filled($data['email'] ?? null) ? User::where('email', $data['email'])->first() : null;
        if ($existingUser) {
            return back()->withErrors(['email' => 'Este correo ya tiene una cuenta. Usa otro correo o solicita una vinculación manual.'])->withInput();
        }

        $temporaryPassword = filled($data['email'] ?? null) ? Str::password(12) : null;

        $athlete = DB::transaction(function () use ($club, $data, $photo, $temporaryPassword, $enrollmentData, $hasEnrollment, $payments, $paymentMethod, $paymentReference) {
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
            if ($hasEnrollment) {
                $startDate = Carbon::parse($enrollmentData['start_date']);
                $enrollment = $athlete->enrollments()->create([
                    ...$enrollmentData,
                    'club_id' => $club->id,
                    'status' => 'pending',
                ]);
                $periodEnd = app(BillingPeriodService::class)->end($startDate, $enrollment->billing_frequency);
                $charge = $enrollment->charges()->create([
                    'club_id' => $club->id,
                    'period' => $startDate->toDateString(),
                    'period_end' => $periodEnd->toDateString(),
                    'due_date' => $startDate->toDateString(),
                    'amount' => $enrollment->monthly_amount,
                    'status' => 'pending',
                ]);

                if ($paymentMethod !== null) {
                    $payments->register($charge, $paymentMethod, $paymentReference);
                }
            }

            if ($photo) {
                $athlete->update(['photo_path' => $this->storePhoto($photo, $club)]);
            }

            return $athlete->load('club');
        });

        $response = back()->with('success', match (true) {
            $payNow => 'Deportista registrado, pago confirmado e inscripción activada.',
            $hasEnrollment => 'Deportista registrado. El primer cargo quedó pendiente en Recaudos.',
            default => 'Deportista registrado correctamente.',
        });
        if ($temporaryPassword) {
            $response->with('athleteAccess', [
                'name' => trim($data['first_name'].' '.$data['last_name']),
                'email' => $data['email'],
                'password' => $temporaryPassword,
            ]);
            if (config('nexo.notifications.enabled')) {
                try {
                    Mail::to($data['email'])->send(new AthleteAccessMail(
                        $athlete,
                        $temporaryPassword,
                        $athlete->enrollments()->with(['discipline', 'charges'])->latest()->first(),
                    ));
                    $athlete->update(['access_email_sent_at' => now()]);
                } catch (\Throwable $exception) {
                    Log::warning('No fue posible enviar el acceso del deportista.', ['athlete_id' => $athlete->id, 'error' => $exception->getMessage()]);
                }
            }
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
            'discipline_id' => ['nullable', 'integer', Rule::exists('disciplines', 'id')->where(fn ($query) => $query->where('club_id', $club->id)->where('is_active', true))],
            'start_date' => ['nullable', 'date'],
            'billing_frequency' => ['nullable', Rule::in(BillingPeriodService::FREQUENCIES)],
            'monthly_amount' => ['nullable', 'integer', 'min:0'],
            'due_day' => ['nullable', 'integer', 'min:1', 'max:31'],
        ]);
        if (filled($data['discipline_id'] ?? null)) {
            validator($data, [
                'start_date' => ['required', 'date'],
                'billing_frequency' => ['required', Rule::in(BillingPeriodService::FREQUENCIES)],
                'monthly_amount' => ['required', 'integer', 'min:0'],
                'due_day' => ['required', 'integer', 'min:1', 'max:31'],
            ])->validate();
        }
        $photo = $request->file('photo');
        unset($data['photo']);
        $enrollmentData = array_intersect_key($data, array_flip(['discipline_id', 'start_date', 'billing_frequency', 'monthly_amount', 'due_day']));
        unset($data['discipline_id'], $data['start_date'], $data['billing_frequency'], $data['monthly_amount'], $data['due_day']);
        if ($photo) {
            $newPhoto = $this->storePhoto($photo, $club);
            try {
                $oldPhoto = DB::transaction(function () use ($athlete, $club, $data, $newPhoto): ?string {
                    $current = $club->athletes()->lockForUpdate()->findOrFail($athlete->id);
                    $oldPhoto = $current->photo_path;
                    $current->update([...$data, 'photo_path' => $newPhoto]);

                    return $oldPhoto;
                });
            } catch (\Throwable $exception) {
                Storage::disk('local')->delete($newPhoto);

                throw $exception;
            }
            if ($oldPhoto) {
                Storage::disk('local')->delete($oldPhoto);
            }
            $athlete->refresh();
        } else {
            $athlete->update($data);
        }

        $temporaryPassword = null;
        $accessCreated = false;
        if (filled($athlete->email) && filled($enrollmentData['discipline_id'] ?? null)) {
            $user = $athlete->user;
            if (! $user) {
                $temporaryPassword = Str::password(12);
                $user = User::create([
                    'name' => trim($athlete->first_name.' '.$athlete->last_name),
                    'email' => $athlete->email,
                    'password' => $temporaryPassword,
                ]);
                $user->forceFill(['email_verified_at' => now()])->save();
                $club->users()->attach($user->id, [
                    'status' => 'active',
                    'is_default' => false,
                    'joined_at' => now(),
                ]);
                $accessCreated = true;
            } elseif (! $athlete->access_email_sent_at) {
                $temporaryPassword = Str::password(12);
                $user->forceFill(['password' => $temporaryPassword])->save();
                $accessCreated = true;
            }
            app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
            $role = Role::firstOrCreate(['name' => 'deportista', 'guard_name' => 'web', 'team_id' => $club->id]);
            $user->syncRoles([$role]);
            if ($athlete->user_id !== $user->id) {
                $athlete->update(['user_id' => $user->id]);
            }
        }

        $enrollmentCreated = false;
        $enrollment = null;
        if (filled($enrollmentData['discipline_id'] ?? null)) {
            $enrollment = $athlete->enrollments()->whereIn('status', ['pending', 'active', 'suspended'])->latest()->first();
            if ($enrollment) {
                $enrollment->update($enrollmentData);
            } else {
                $enrollment = $athlete->enrollments()->create([
                    ...$enrollmentData,
                    'club_id' => $club->id,
                    'status' => 'pending',
                ]);
                $enrollmentCreated = true;
            }

            if (! $enrollment->charges()->exists()) {
                $startDate = Carbon::parse($enrollment->start_date);
                $enrollment->charges()->create([
                    'club_id' => $club->id,
                    'period' => $startDate->toDateString(),
                    'period_end' => app(BillingPeriodService::class)->end($startDate, $enrollment->billing_frequency)->toDateString(),
                    'due_date' => $startDate->copy()->day(min((int) $enrollment->due_day, (int) $startDate->daysInMonth))->toDateString(),
                    'amount' => $enrollment->monthly_amount,
                    'status' => 'pending',
                ]);
            }
        }

        if ($enrollmentCreated && $athlete->email && config('nexo.notifications.enabled')) {
            try {
                $enrollment = $enrollment?->fresh(['athlete', 'club', 'discipline', 'charges']);
                if ($accessCreated && $temporaryPassword) {
                    Mail::to($athlete->email)->send(new AthleteAccessMail($athlete->fresh('club'), $temporaryPassword, $enrollment));
                    $athlete->update(['access_email_sent_at' => now()]);
                } elseif (! $accessCreated) {
                    Mail::to($athlete->email)->send(new AthleteEnrollmentUpdatedMail($enrollment));
                }
            } catch (\Throwable $exception) {
                Log::warning('No fue posible enviar la información de inscripción del deportista.', ['athlete_id' => $athlete->id, 'error' => $exception->getMessage()]);
            }
        }

        return back()->with('success', 'Perfil del deportista actualizado correctamente.');
    }

    public function photo(Request $request, Athlete $athlete)
    {
        $club = $this->club($request);
        abort_unless($athlete->club_id === $club->id, 404);
        abort_unless($athlete->user_id === $request->user()->id || $request->user()->hasRole('admin'), 404);
        $path = $athlete->availablePhotoPath();
        abort_unless($path, 404);

        return response()->file(Storage::disk('local')->path($path), ['Cache-Control' => 'no-store'])->setPrivate();
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

    private function storePhoto(UploadedFile $photo, Club $club): string
    {
        $path = $photo->store("athletes/{$club->id}", 'local');
        if ($path === false) {
            throw ValidationException::withMessages(['photo' => 'No pudimos guardar la foto. Vuelve a intentarlo.']);
        }

        return $path;
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
