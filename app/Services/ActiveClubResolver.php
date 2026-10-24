<?php

namespace App\Services;

use App\Models\Club;
use App\Models\User;
use Illuminate\Http\Request;

class ActiveClubResolver
{
    public const SESSION_KEY = 'active_club_id';

    public function resolve(Request $request): ?Club
    {
        $user = $request->user();

        if (! $user) {
            return null;
        }

        $clubs = $user->activeClubs();
        $sessionClubId = $request->session()->get(self::SESSION_KEY);

        if ($sessionClubId) {
            $club = (clone $clubs)->whereKey($sessionClubId)->first();

            if ($club) {
                return $club;
            }
        }

        $club = (clone $clubs)->orderByDesc('club_user.is_default')->orderBy('clubs.name')->first();

        if ($club) {
            $request->session()->put(self::SESSION_KEY, $club->getKey());
        }

        return $club;
    }

    public function setActiveClub(Request $request, int $clubId): Club
    {
        /** @var User $user */
        $user = $request->user();
        $club = $user->activeClubs()->whereKey($clubId)->firstOrFail();

        $request->session()->put(self::SESSION_KEY, $club->getKey());
        app()->instance(Club::class, $club);

        return $club;
    }
}
