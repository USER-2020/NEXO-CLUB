<?php

namespace App\Http\Middleware;

use App\Models\MonthlyCharge;
use App\Services\ActiveClubResolver;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Spatie\Permission\PermissionRegistrar;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $athlete = $user?->athlete;
        $activeClub = $user ? app(ActiveClubResolver::class)->resolve($request) : null;
        app(PermissionRegistrar::class)->setPermissionsTeamId($activeClub?->id);

        $adminBillingNotifications = ['count' => 0, 'total' => 0, 'items' => []];
        if ($user && $activeClub && $user->hasRole('admin')) {
            $charges = MonthlyCharge::query()
                ->with(['enrollment.athlete:id,first_name,last_name', 'enrollment.discipline:id,name'])
                ->where('club_id', $activeClub->id)
                ->whereIn('status', ['pending', 'overdue'])
                ->whereHas('enrollment', fn ($query) => $query->where('status', 'active'))
                ->orderByRaw("CASE WHEN status = 'overdue' THEN 0 ELSE 1 END")
                ->orderBy('due_date')
                ->limit(50)
                ->get();

            $adminBillingNotifications = [
                'count' => $charges->count(),
                'total' => $charges->sum('amount'),
                'items' => $charges->map(fn (MonthlyCharge $charge) => [
                    'id' => $charge->id,
                    'athlete' => trim($charge->enrollment->athlete->first_name.' '.$charge->enrollment->athlete->last_name),
                    'discipline' => $charge->enrollment->discipline->name,
                    'amount' => $charge->amount,
                    'due_date' => $charge->due_date?->toDateString(),
                    'status' => $charge->status,
                ])->values()->all(),
            ];
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [...$user->toArray(), 'role' => $user->roles->first()?->name, 'avatar_url' => $athlete?->photo_path ? route('athletes.photo', $athlete->id) : null] : null,
            ],
            'clubContext' => [
                'activeClub' => $activeClub?->only(['id', 'name', 'slug', 'currency', 'timezone']),
                'clubs' => $user?->activeClubs()->get(['clubs.id', 'clubs.name', 'clubs.slug']) ?? [],
            ],
            'guidedTours' => $user?->guidedTours()->where('completed', true)->pluck('tour_key')->values() ?? [],
            'adminBillingNotifications' => $adminBillingNotifications,
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
                'createdAccess' => session('createdAccess'),
                'athleteAccess' => session('athleteAccess'),
                'verificationRequired' => session('verificationRequired'),
            ],
        ];
    }
}
