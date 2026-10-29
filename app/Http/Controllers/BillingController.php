<?php

namespace App\Http\Controllers;

use App\Mail\AthleteSubscriptionActivatedMail;
use App\Models\Club;
use App\Models\Enrollment;
use App\Models\MonthlyCharge;
use App\Models\Payment;
use App\Models\PaymentSubmission;
use App\Services\BillingPeriodService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\PermissionRegistrar;

class BillingController extends Controller
{
    public function index(Request $request): Response
    {
        $club = $this->club($request);
        $this->authorizeBilling($request);
        $search = trim($request->string('q')->toString());
        $status = $request->string('status')->toString();
        abort_unless(in_array($status, ['', 'pending', 'paid'], true), 422, 'Filtro de recaudos inválido.');
        $chargeQuery = $club->monthlyCharges()->with(['enrollment.athlete:id,first_name,last_name', 'enrollment.discipline:id,name']);
        $chargeQuery->when($status === 'pending', fn ($query) => $query->whereIn('status', ['pending', 'overdue']));
        $chargeQuery->when($status === 'paid', fn ($query) => $query->where('status', 'paid'));
        $chargeQuery->when($search, fn ($query) => $query->where(fn ($query) => $query->where('status', 'like', "%{$search}%")->orWhereHas('enrollment.athlete', fn ($query) => $query->where('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%"))->orWhereHas('enrollment.discipline', fn ($query) => $query->where('name', 'like', "%{$search}%"))));
        $chargeQuery->orderByRaw("CASE WHEN status IN ('pending', 'overdue') THEN 0 ELSE 1 END")->orderBy('due_date')->orderByDesc('id');

        return Inertia::render('Memberships/Index', [
            'charges' => $chargeQuery->paginate(20)->withQueryString(),
            'status' => $status ?: 'all',
            'paymentMethods' => $club->paymentMethods()->where('is_active', true)->orderBy('type')->get(),
            'paymentSubmissions' => PaymentSubmission::with(['athlete:id,first_name,last_name', 'monthlyCharge:id,period,due_date,amount,status', 'paymentMethod:id,label', 'reviewer:id,name'])
                ->where('club_id', $club->id)->latest()->limit(30)->get()->map(fn ($submission) => [
                    'id' => $submission->id,
                    'athlete' => $submission->athlete?->first_name.' '.$submission->athlete?->last_name,
                    'charge_id' => $submission->monthly_charge_id,
                    'period' => $submission->monthlyCharge?->period?->format('Y-m-d'),
                    'amount' => $submission->monthlyCharge?->amount,
                    'method' => $submission->paymentMethod?->label ?? $submission->method,
                    'reference' => $submission->reference,
                    'status' => $submission->status,
                    'rejection_reason' => $submission->rejection_reason,
                ]),
        ]);
    }

    public function approveSubmission(Request $request, PaymentSubmission $submission): RedirectResponse
    {
        $club = $this->club($request);
        $this->authorizeBilling($request);
        abort_unless($submission->club_id === $club->id, 404);
        abort_if($submission->status !== 'pending', 422, 'Este comprobante ya fue revisado.');

        $activatedEnrollment = null;
        DB::transaction(function () use ($submission, $request, $club, &$activatedEnrollment): void {
            $charge = $submission->monthlyCharge()->lockForUpdate()->firstOrFail();
            abort_if($charge->status === 'paid', 422, 'La mensualidad ya está pagada.');
            $paidAt = now();
            $this->anchorFirstPaymentPeriod($charge, $paidAt);
            Payment::create([
                'club_id' => $club->id,
                'monthly_charge_id' => $charge->id,
                'amount' => $charge->amount,
                'paid_at' => $paidAt,
                'method' => in_array($submission->method, ['nequi', 'bre_b', 'payment_key', 'bank_account'], true) ? 'transfer' : $submission->method,
                'reference' => $submission->reference,
            ]);
            $charge->update(['status' => 'paid', 'paid_at' => $paidAt]);
            if (in_array($charge->enrollment->status, ['pending', 'suspended'], true)) {
                $charge->enrollment->update(['status' => 'active', 'suspended_at' => null, 'suspension_reason' => null]);
                $activatedEnrollment = $charge->enrollment->fresh(['athlete', 'club', 'discipline', 'charges']);
            }
            $submission->update(['status' => 'approved', 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);
        });

        $this->sendActivationEmail($activatedEnrollment);

        return back()->with('success', 'Comprobante aprobado y pago registrado.');
    }

    public function rejectSubmission(Request $request, PaymentSubmission $submission): RedirectResponse
    {
        $club = $this->club($request);
        $this->authorizeBilling($request);
        abort_unless($submission->club_id === $club->id, 404);
        abort_if($submission->status !== 'pending', 422, 'Este comprobante ya fue revisado.');
        $data = $request->validate(['rejection_reason' => ['required', 'string', 'max:500']]);
        $submission->update(['status' => 'rejected', 'rejection_reason' => $data['rejection_reason'], 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);

        return back()->with('success', 'Comprobante rechazado. El deportista podrá enviar uno nuevo.');
    }

    public function submissionReceipt(Request $request, PaymentSubmission $submission)
    {
        $club = $this->club($request);
        $this->authorizeBilling($request);
        abort_unless($submission->club_id === $club->id, 404);

        return Storage::disk('local')->download($submission->receipt_path);
    }

    public function pay(Request $request, MonthlyCharge $charge): RedirectResponse
    {
        $club = $this->club($request);
        $this->authorizeBilling($request);
        abort_unless($charge->club_id === $club->id, 404);
        abort_if($charge->status === 'paid', 422, 'Esta mensualidad ya está pagada.');
        $data = $request->validate(['method' => ['required', Rule::in(['cash', 'transfer', 'card'])], 'reference' => ['nullable', 'string', 'max:100']]);

        $wasRestricted = in_array($charge->enrollment->status, ['pending', 'suspended'], true);
        $paidAt = now();
        $this->anchorFirstPaymentPeriod($charge, $paidAt);
        Payment::create(['club_id' => $club->id, 'monthly_charge_id' => $charge->id, 'amount' => $charge->amount, 'paid_at' => $paidAt, ...$data]);
        $charge->update(['status' => 'paid', 'paid_at' => $paidAt]);
        if ($wasRestricted) {
            $charge->enrollment->update(['status' => 'active', 'suspended_at' => null, 'suspension_reason' => null]);
        }

        $this->sendActivationEmail($wasRestricted ? $charge->enrollment->fresh(['athlete', 'club', 'discipline', 'charges']) : null);

        return back()->with('success', 'Pago registrado. La inscripción fue reactivada si estaba suspendida.');
    }

    private function sendActivationEmail(?Enrollment $enrollment): void
    {
        if (! $enrollment || ! config('nexo.notifications.enabled') || ! $enrollment->athlete?->email) {
            return;
        }

        try {
            Mail::to($enrollment->athlete->email)->send(new AthleteSubscriptionActivatedMail($enrollment));
        } catch (\Throwable $exception) {
            Log::warning('No fue posible enviar el correo de activación del deportista.', [
                'enrollment_id' => $enrollment->id,
                'email' => $enrollment->athlete->email,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function anchorFirstPaymentPeriod(MonthlyCharge $charge, Carbon $paidAt): void
    {
        $enrollment = $charge->enrollment;

        // The first payment activates the enrollment. From that point, the
        // next charge must be calculated from the real activation/payment date,
        // not from the date on which the pending enrollment was pre-created.
        if ($enrollment->status !== 'pending' || $charge->payment()->exists()) {
            return;
        }

        $period = $paidAt->copy()->startOfDay();
        $charge->update([
            'period' => $period->toDateString(),
            'period_end' => app(BillingPeriodService::class)->end($period, $enrollment->billing_frequency ?? 'monthly')->toDateString(),
            'due_date' => $period->toDateString(),
        ]);
    }

    private function club(Request $request): Club
    {
        return $request->attributes->get('activeClub') ?? abort(422, 'No hay un club activo seleccionado.');
    }

    private function authorizeBilling(Request $request): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($request->attributes->get('activeClub')->id);
        abort_unless($request->user()->hasAnyRole(['admin', 'contador']), 403, 'No tienes permisos para gestionar mensualidades.');
    }
}
