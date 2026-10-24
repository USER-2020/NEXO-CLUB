<?php

namespace App\Http\Controllers;

use App\Models\MonthlyCharge;
use App\Models\Payment;
use App\Models\PaymentSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AthletePortalController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $athlete = $request->user()->athlete()->with([
            'club',
            'enrollments.discipline',
            'enrollments.charges.payment',
            'enrollments.charges.paymentSubmission.paymentMethod',
        ])->firstOrFail();

        abort_unless($athlete->club_id === $request->attributes->get('activeClub')?->id, 403);

        $charges = $athlete->enrollments->flatMap->charges->sortByDesc('due_date')->values();
        $payments = Payment::with('monthlyCharge')
            ->where('club_id', $athlete->club_id)
            ->whereHas('monthlyCharge.enrollment', fn ($query) => $query->where('athlete_id', $athlete->id))
            ->latest('paid_at')->limit(12)->get();
        $paidTotal = Payment::where('club_id', $athlete->club_id)
            ->whereHas('monthlyCharge.enrollment', fn ($query) => $query->where('athlete_id', $athlete->id))
            ->sum('amount');

        return Inertia::render('Athletes/Portal', [
            'athlete' => [
                'id' => $athlete->id,
                'first_name' => $athlete->first_name,
                'last_name' => $athlete->last_name,
                'name' => trim($athlete->first_name.' '.$athlete->last_name),
                'email' => $request->user()->email,
                'user_name' => $request->user()->name,
                'avatar_url' => filled($athlete->photo_path) ? route('athletes.photo', $athlete->id) : null,
                'document' => $athlete->document_number,
                'phone' => $athlete->phone,
                'birth_date' => $athlete->birth_date?->format('Y-m-d'),
                'height_cm' => $athlete->height_cm,
                'weight_kg' => $athlete->weight_kg,
                'shirt_size' => $athlete->shirt_size,
                'shoe_size' => $athlete->shoe_size,
                'guardian_name' => $athlete->guardian_name,
                'guardian_phone' => $athlete->guardian_phone,
                'club' => $athlete->club?->name,
                'enrollments' => $athlete->enrollments->map(fn ($enrollment) => [
                    'id' => $enrollment->id,
                    'discipline' => $enrollment->discipline?->name,
                    'start_date' => $enrollment->start_date?->translatedFormat('d \d\e F \d\e Y'),
                    'status' => $enrollment->status,
                    'monthly_amount' => $enrollment->monthly_amount,
                    'due_day' => $enrollment->due_day,
                    'charges' => $enrollment->charges->sortByDesc('due_date')->take(6)->map(fn ($charge) => [
                        'id' => $charge->id,
                        'period' => $charge->period?->format('Y-m-d'),
                        'due_date' => $charge->due_date?->format('Y-m-d'),
                        'amount' => $charge->amount,
                        'status' => $charge->status,
                        'payment_submission' => $charge->paymentSubmission ? [
                            'id' => $charge->paymentSubmission->id,
                            'status' => $charge->paymentSubmission->status,
                            'method' => $charge->paymentSubmission->paymentMethod?->label ?? $charge->paymentSubmission->method,
                            'rejection_reason' => $charge->paymentSubmission->rejection_reason,
                        ] : null,
                    ])->values(),
                ])->values(),
            ],
            'stats' => [
                'active_enrollments' => $athlete->enrollments->where('status', 'active')->count(),
                'total_enrollments' => $athlete->enrollments->count(),
                'pending_charges' => $charges->whereIn('status', ['pending', 'overdue'])->count(),
                'paid_total' => $paidTotal,
            ],
            'payments' => $payments->map(fn ($payment) => [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'method' => $payment->method,
                'paid_at' => $payment->paid_at?->format('Y-m-d'),
                'period' => $payment->monthlyCharge?->period?->format('Y-m-d'),
            ])->values(),
            'paymentMethods' => $athlete->club->paymentMethods()->where('is_active', true)->orderBy('type')->get()->map(fn ($method) => [
                'id' => $method->id,
                'type' => $method->type,
                'label' => $method->label,
                'provider' => $method->provider,
                'account_type' => $method->account_type,
                'account_number' => $method->account_number,
                'account_holder' => $method->account_holder,
                'key_type' => $method->key_type,
                'notes' => $method->notes,
            ])->values(),
            'trainingDemo' => [
                ['label' => 'Lun', 'sessions' => 2, 'minutes' => 90],
                ['label' => 'Mar', 'sessions' => 1, 'minutes' => 60],
                ['label' => 'Mié', 'sessions' => 2, 'minutes' => 120],
                ['label' => 'Jue', 'sessions' => 1, 'minutes' => 75],
                ['label' => 'Vie', 'sessions' => 2, 'minutes' => 105],
                ['label' => 'Sáb', 'sessions' => 1, 'minutes' => 90],
            ],
        ]);
    }

    public function submitReceipt(Request $request, MonthlyCharge $charge): RedirectResponse
    {
        $athlete = $request->user()->athlete()->firstOrFail();
        abort_unless($athlete->club_id === $request->attributes->get('activeClub')?->id && $charge->club_id === $athlete->club_id, 404);
        abort_if($charge->status === 'paid', 422, 'Esta mensualidad ya está pagada.');
        abort_if($charge->paymentSubmissions()->where('status', 'pending')->exists(), 422, 'Ya hay un comprobante pendiente de revisión.');

        $data = $request->validate([
            'payment_method_id' => ['required', 'integer', 'exists:club_payment_methods,id'],
            'reference' => ['nullable', 'string', 'max:100'],
            'receipt' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);
        $method = $athlete->club->paymentMethods()->whereKey($data['payment_method_id'])->where('is_active', true)->firstOrFail();
        $path = $data['receipt']->store('payment-receipts/'.$athlete->club_id, 'local');

        PaymentSubmission::create([
            'club_id' => $athlete->club_id,
            'monthly_charge_id' => $charge->id,
            'athlete_id' => $athlete->id,
            'payment_method_id' => $method->id,
            'method' => $method->type,
            'reference' => $data['reference'] ?? null,
            'receipt_path' => $path,
        ]);

        return back()->with('success', 'Comprobante enviado. El club lo revisará antes de registrar el pago.');
    }

    public function payments(Request $request): Response
    {
        $athlete = $request->user()->athlete()->with([
            'club.paymentMethods',
            'enrollments.discipline',
            'enrollments.charges.paymentSubmission.paymentMethod',
        ])->firstOrFail();

        abort_unless($athlete->club_id === $request->attributes->get('activeClub')?->id, 403);
        $charges = $athlete->enrollments->flatMap->charges->sortByDesc('due_date')->values();
        $payments = Payment::with('monthlyCharge')
            ->where('club_id', $athlete->club_id)
            ->whereHas('monthlyCharge.enrollment', fn ($query) => $query->where('athlete_id', $athlete->id))
            ->latest('paid_at')->limit(30)->get();

        return Inertia::render('Athletes/Payments', [
            'charges' => $charges->map(fn ($charge) => [
                'id' => $charge->id,
                'period' => $charge->period?->format('Y-m-d'),
                'due_date' => $charge->due_date?->format('Y-m-d'),
                'amount' => $charge->amount,
                'status' => $charge->status,
                'discipline' => $charge->enrollment?->discipline?->name,
                'payment_submission' => $charge->paymentSubmission ? [
                    'id' => $charge->paymentSubmission->id,
                    'status' => $charge->paymentSubmission->status,
                    'rejection_reason' => $charge->paymentSubmission->rejection_reason,
                ] : null,
            ])->values(),
            'payments' => $payments->map(fn ($payment) => [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'method' => $payment->method,
                'paid_at' => $payment->paid_at?->format('Y-m-d'),
                'period' => $payment->monthlyCharge?->period?->format('Y-m-d'),
            ])->values(),
            'paymentMethods' => $athlete->club->paymentMethods->where('is_active', true)->sortBy('type')->values()->map(fn ($method) => [
                'id' => $method->id,
                'type' => $method->type,
                'label' => $method->label,
                'provider' => $method->provider,
                'account_type' => $method->account_type,
                'account_number' => $method->account_number,
                'account_holder' => $method->account_holder,
                'key_type' => $method->key_type,
                'notes' => $method->notes,
            ])->values(),
        ]);
    }

    public function receipt(Request $request, PaymentSubmission $submission)
    {
        $athlete = $request->user()->athlete()->firstOrFail();
        abort_unless($submission->athlete_id === $athlete->id && $submission->club_id === $athlete->club_id, 404);

        return Storage::disk('local')->download($submission->receipt_path);
    }

    public function update(Request $request): RedirectResponse
    {
        $athlete = $request->user()->athlete()->firstOrFail();
        abort_unless($athlete->club_id === $request->attributes->get('activeClub')?->id, 403);
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'document_number' => ['nullable', 'string', 'max:40', Rule::unique('athletes', 'document_number')->where(fn ($query) => $query->where('club_id', $athlete->club_id))->ignore($athlete->id)],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'height_cm' => ['nullable', 'numeric', 'min:30', 'max:260'],
            'weight_kg' => ['nullable', 'numeric', 'min:1', 'max:400'],
            'shirt_size' => ['nullable', 'string', 'max:20'],
            'shoe_size' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:40'],
            'guardian_name' => ['nullable', 'string', 'max:120'],
            'guardian_phone' => ['nullable', 'string', 'max:40'],
        ]);
        $athlete->update($data);
        $athlete->user?->update(['name' => trim($data['first_name'].' '.$data['last_name'])]);

        return back()->with('success', 'Tus datos personales fueron actualizados.');
    }
}
