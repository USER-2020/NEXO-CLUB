<?php

use App\Http\Controllers\AthleteController;
use App\Http\Controllers\AthletePortalController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\ClubContextController;
use App\Http\Controllers\ClubController;
use App\Http\Controllers\ClubMemberController;
use App\Http\Controllers\DisciplineController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\GuidedTourController;
use App\Http\Controllers\PlatformAuditController;
use App\Http\Controllers\PlatformClubApplicationController;
use App\Http\Controllers\PlatformClubController;
use App\Http\Controllers\PlatformDashboardController;
use App\Http\Controllers\ProfileController;
use App\Models\Payment;
use App\Services\PlatformAccess;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function (Request $request) {
    if (app(PlatformAccess::class)->isSuperadmin($request->user())) {
        return redirect()->route('platform.dashboard');
    }

    if ($request->user()->hasRole('deportista')) {
        return redirect()->route('athlete.dashboard');
    }

    $club = $request->attributes->get('activeClub');
    $monthStart = now()->startOfMonth();
    $monthEnd = now()->endOfMonth();

    return Inertia::render('Dashboard', [
        'stats' => [
            'activeAthletes' => $club->enrollments()->where('status', 'active')->distinct('athlete_id')->count('athlete_id'),
            'monthlyEnrollments' => $club->enrollments()->whereBetween('created_at', [$monthStart, $monthEnd])->count(),
            'monthlyRevenue' => Payment::where('club_id', $club->id)->whereBetween('paid_at', [$monthStart, $monthEnd])->sum('amount'),
            'outstandingBalance' => $club->monthlyCharges()->whereIn('status', ['pending', 'overdue'])->sum('amount'),
            'overdueCharges' => $club->monthlyCharges()->where('status', 'overdue')->count(),
        ],
        'recentPayments' => Payment::with('monthlyCharge.enrollment.athlete')->where('club_id', $club->id)->latest('paid_at')->limit(5)->get()->map(fn (Payment $payment) => [
            'id' => $payment->id,
            'name' => $payment->monthlyCharge?->enrollment?->athlete?->first_name.' '.$payment->monthlyCharge?->enrollment?->athlete?->last_name,
            'amount' => $payment->amount,
            'date' => $payment->paid_at?->format('Y-m-d'),
        ])->values(),
        'today' => now()->locale('es')->translatedFormat('l, d \\d\\e F \\d\\e Y'),
    ]);
})->middleware(['auth', 'verified', 'active.club'])->name('dashboard');

Route::get('/platform', PlatformDashboardController::class)
    ->middleware(['auth', 'verified', 'platform.admin'])
    ->name('platform.dashboard');

Route::middleware(['auth', 'verified', 'platform.admin'])->prefix('platform')->group(function () {
    Route::get('/documentacion-flujos', fn () => Inertia::render('FlowDocumentation/Index'))->name('platform.flow-docs.index');
    Route::get('/clubs', [PlatformClubController::class, 'index'])->name('platform.clubs.index');
    Route::get('/logs', [PlatformAuditController::class, 'index'])->name('platform.logs.index');
    Route::get('/clubs/{club}', [PlatformClubController::class, 'show'])->name('platform.clubs.show');
    Route::post('/clubs', [PlatformClubController::class, 'store'])->name('platform.clubs.store');
    Route::patch('/club-applications/{application}/approve', [PlatformClubApplicationController::class, 'approve'])->name('platform.club-applications.approve');
    Route::post('/club-applications/{application}/resend-verification', [PlatformClubApplicationController::class, 'resendVerification'])->name('platform.club-applications.resend-verification');
    Route::patch('/club-applications/{application}/reject', [PlatformClubApplicationController::class, 'reject'])->name('platform.club-applications.reject');
    Route::post('/clubs/{club}/administrators', [PlatformClubController::class, 'addAdmin'])->name('platform.clubs.admins.store');
    Route::delete('/clubs/{club}/administrators/{user}', [PlatformClubController::class, 'removeAdmin'])->name('platform.clubs.admins.destroy');
    Route::patch('/clubs/{club}/status', [PlatformClubController::class, 'toggle'])->name('platform.clubs.toggle');
    Route::delete('/clubs/{club}', [PlatformClubController::class, 'destroy'])->name('platform.clubs.destroy');
});

Route::middleware('auth')->group(function () {
    Route::post('/club-context', ClubContextController::class)->name('clubs.switch');
    Route::get('/documentacion-flujos', fn () => Inertia::render('FlowDocumentation/Index'))->name('flow-docs.index');
    Route::post('/guided-tours/{tourKey}/complete', [GuidedTourController::class, 'complete'])->name('guided-tours.complete');

    Route::get('/mi-dashboard', AthletePortalController::class)
        ->middleware(['verified', 'active.club', 'athlete.access'])
        ->name('athlete.dashboard');
    Route::get('/mis-pagos', [AthletePortalController::class, 'payments'])
        ->middleware(['verified', 'active.club', 'athlete.access'])
        ->name('athlete.payments');
    Route::patch('/mi-dashboard', [AthletePortalController::class, 'update'])
        ->middleware(['verified', 'active.club', 'athlete.access'])
        ->name('athlete.profile.update');
    Route::post('/mi-dashboard/mensualidades/{charge}/comprobante', [AthletePortalController::class, 'submitReceipt'])
        ->middleware(['verified', 'active.club', 'athlete.access'])->name('athlete.payment-submissions.store');
    Route::get('/mi-dashboard/comprobantes/{submission}', [AthletePortalController::class, 'receipt'])
        ->middleware(['verified', 'active.club', 'athlete.access'])->name('athlete.payment-submissions.receipt');

    Route::middleware('active.club')->group(function () {
        Route::get('/deportistas', [AthleteController::class, 'index'])->name('athletes.index');
        Route::post('/deportistas', [AthleteController::class, 'store'])->name('athletes.store');
        Route::patch('/deportistas/{athlete}', [AthleteController::class, 'update'])->name('athletes.update');
        Route::get('/deportistas/{athlete}/photo', [AthleteController::class, 'photo'])->name('athletes.photo');
        Route::patch('/deportistas/{athlete}/status', [AthleteController::class, 'status'])->name('athletes.status');
        Route::get('/inscripciones', [EnrollmentController::class, 'index'])->name('enrollments.index');
        Route::post('/inscripciones', [EnrollmentController::class, 'store'])->name('enrollments.store');
        Route::patch('/inscripciones/{enrollment}', [EnrollmentController::class, 'update'])->name('enrollments.update');
        Route::patch('/inscripciones/{enrollment}/status', [EnrollmentController::class, 'status'])->name('enrollments.status');
        Route::get('/mensualidades', [BillingController::class, 'index'])->name('memberships.index');
        Route::post('/mensualidades/{charge}/pay', [BillingController::class, 'pay'])->name('memberships.pay');
        Route::patch('/mensualidades/comprobantes/{submission}/approve', [BillingController::class, 'approveSubmission'])->name('memberships.submissions.approve');
        Route::patch('/mensualidades/comprobantes/{submission}/reject', [BillingController::class, 'rejectSubmission'])->name('memberships.submissions.reject');
        Route::get('/mensualidades/comprobantes/{submission}/receipt', [BillingController::class, 'submissionReceipt'])->name('memberships.submissions.receipt');

        Route::get('/disciplinas', [DisciplineController::class, 'index'])->name('disciplines.index');

        Route::get('/clubs', [ClubController::class, 'index'])->name('clubs.index');
        Route::post('/clubs', [ClubController::class, 'store'])->name('clubs.store');
        Route::patch('/clubs/{club}', [ClubController::class, 'update'])->name('clubs.update');
        Route::post('/club-medios-pago', [ClubController::class, 'storePaymentMethod'])->name('clubs.payment-methods.store');
        Route::patch('/club-medios-pago/{paymentMethod}/toggle', [ClubController::class, 'togglePaymentMethod'])->name('clubs.payment-methods.toggle');
        Route::delete('/club-medios-pago/{paymentMethod}', [ClubController::class, 'destroyPaymentMethod'])->name('clubs.payment-methods.destroy');
        Route::get('/club-miembros', [ClubMemberController::class, 'index'])->name('club-members.index');
        Route::post('/club-miembros', [ClubMemberController::class, 'store'])->name('club-members.store');
        Route::patch('/club-miembros/{user}', [ClubMemberController::class, 'update'])->name('club-members.update');
        Route::delete('/club-miembros/{user}', [ClubMemberController::class, 'destroy'])->name('club-members.destroy');
        Route::post('/disciplines', [DisciplineController::class, 'store'])->name('disciplines.store');
        Route::patch('/disciplines/{discipline}', [DisciplineController::class, 'update'])->name('disciplines.update');
        Route::delete('/disciplines/{discipline}', [DisciplineController::class, 'destroy'])->name('disciplines.destroy');
        Route::patch('/disciplines/{discipline}/status', [DisciplineController::class, 'toggle'])->name('disciplines.toggle');
    });

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
