<?php

namespace App\Http\Middleware;

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
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
                'createdAccess' => session('createdAccess'),
                'athleteAccess' => session('athleteAccess'),
            ],
        ];
    }
}
