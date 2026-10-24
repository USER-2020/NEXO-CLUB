<?php

namespace App\Http\Controllers;

use App\Models\Club;
use Inertia\Inertia;
use Inertia\Response;

class PlatformDashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Platform/Dashboard', [
            'stats' => [
                'clubs' => Club::count(),
                'activeClubs' => Club::where('is_active', true)->count(),
                'users' => Club::withCount('users')->get()->sum('users_count'),
                'disciplines' => Club::withCount('disciplines')->get()->sum('disciplines_count'),
            ],
            'clubs' => Club::withCount(['users', 'disciplines'])
                ->orderByDesc('is_active')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'city', 'is_active']),
        ]);
    }
}
