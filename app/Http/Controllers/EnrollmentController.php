<?php

namespace App\Http\Controllers;

use App\Mail\EnrollmentActivatedMail;
use App\Models\Club;
use App\Models\Enrollment;
use App\Services\BillingPeriodService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\PermissionRegistrar;

class EnrollmentController extends Controller
{
    public function index(Request $request): Response
    {
        $club = $this->club($request);
        $this->authorizeManager($request);
        $search = trim($request->string('q')->toString());
        $enrollmentQuery = $club->enrollments()->with(['athlete:id,first_name,last_name', 'discipline:id,name']);
        $enrollmentQuery->when($search, fn ($query) => $query->where(fn ($query) => $query->where('status', 'like', "%{$search}%")->orWhereHas('athlete', fn ($query) => $query->where('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%"))->orWhereHas('discipline', fn ($query) => $query->where('name', 'like', "%{$search}%"))));

        return Inertia::render('Enrollments/Index', [
            'enrollments' => $enrollmentQuery->latest()->paginate($this->pageSize($request))->withQueryString(),
            'athletes' => $club->athletes()->where('status', 'active')->orderBy('last_name')->get(['id', 'first_name', 'last_name']),
            'disciplines' => $club->disciplines()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $club = $this->club($request);
        $this->authorizeManager($request);
        $data = $request->validate([
            'athlete_id' => ['required', 'integer', Rule::exists('athletes', 'id')->where(fn ($query) => $query->where('club_id', $club->id))],
            'discipline_id' => ['required', 'integer', Rule::exists('disciplines', 'id')->where(fn ($query) => $query->where('club_id', $club->id)->where('is_active', true))],
            'start_date' => ['required', 'date'],
            'monthly_amount' => ['required', 'integer', 'min:0'],
            'billing_frequency' => ['nullable', Rule::in(BillingPeriodService::FREQUENCIES)],
            'due_day' => ['required', 'integer', 'min:1', 'max:31'],
        ]);
        $club->enrollments()->create([...$data, 'billing_frequency' => $data['billing_frequency'] ?? 'monthly', 'status' => 'pending']);

        return back()->with('success', 'Inscripción creada como pendiente de activación.');
    }

    public function status(Request $request, Enrollment $enrollment): RedirectResponse
    {
        $club = $this->club($request);
        $this->authorizeManager($request);
        abort_unless($enrollment->club_id === $club->id, 404);
        $data = $request->validate(['action' => ['required', Rule::in(['activate', 'suspend', 'cancel'])]]);
        $attributes = match ($data['action']) {
            'activate' => ['status' => 'active', 'suspended_at' => null, 'suspension_reason' => null, 'end_date' => null],
            'suspend' => ['status' => 'suspended', 'suspended_at' => now(), 'suspension_reason' => 'Suspendida por falta de pago'],
            'cancel' => ['status' => 'cancelled', 'end_date' => Carbon::today()],
        };
        $enrollment->update($attributes);

        if ($data['action'] === 'activate') {
            $today = Carbon::today();
            $startDate = Carbon::parse($enrollment->start_date);

            if ($startDate->lte($today)) {
                $period = $startDate;
                $dueDate = $period->copy()->day(min($enrollment->due_day, $period->daysInMonth));

                $enrollment->charges()->firstOrCreate(
                    ['period' => $period->toDateString()],
                    [
                        'club_id' => $enrollment->club_id,
                        'period_end' => app(BillingPeriodService::class)->end($period, $enrollment->billing_frequency)->toDateString(),
                        'due_date' => $dueDate->toDateString(),
                        'amount' => $enrollment->monthly_amount,
                        'status' => $dueDate->lt($today) ? 'overdue' : 'pending',
                    ],
                );

            }

            if (config('nexo.notifications.enabled') && $enrollment->load('athlete')->athlete->email) {
                Mail::to($enrollment->athlete->email)->send(new EnrollmentActivatedMail($enrollment->load(['club', 'discipline', 'athlete'])));
            }
        }

        return back()->with('success', match ($data['action']) {
            'activate' => 'Inscripción activada correctamente.',
            'suspend' => 'Inscripción suspendida por falta de pago.',
            'cancel' => 'Inscripción cancelada correctamente.',
        });
    }

    public function update(Request $request, Enrollment $enrollment): RedirectResponse
    {
        $club = $this->club($request);
        $this->authorizeManager($request);
        abort_unless($enrollment->club_id === $club->id, 404);
        $data = $request->validate([
            'athlete_id' => ['required', 'integer', Rule::exists('athletes', 'id')->where(fn ($query) => $query->where('club_id', $club->id))],
            'discipline_id' => ['required', 'integer', Rule::exists('disciplines', 'id')->where(fn ($query) => $query->where('club_id', $club->id)->where('is_active', true))],
            'start_date' => ['required', 'date'],
            'monthly_amount' => ['required', 'integer', 'min:0'],
            'billing_frequency' => ['nullable', Rule::in(BillingPeriodService::FREQUENCIES)],
            'due_day' => ['required', 'integer', 'min:1', 'max:31'],
        ]);
        $enrollment->update([...$data, 'billing_frequency' => $data['billing_frequency'] ?? $enrollment->billing_frequency ?? 'monthly']);

        return back()->with('success', 'Inscripción actualizada correctamente.');
    }

    private function club(Request $request): Club
    {
        return $request->attributes->get('activeClub') ?? abort(422, 'No hay un club activo seleccionado.');
    }

    private function authorizeManager(Request $request): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($request->attributes->get('activeClub')->id);
        abort_unless($request->user()->hasRole('admin'), 403, 'Solo un administrador puede gestionar inscripciones.');
    }
}
