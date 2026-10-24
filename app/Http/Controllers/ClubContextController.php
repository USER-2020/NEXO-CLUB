<?php

namespace App\Http\Controllers;

use App\Services\ActiveClubResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ClubContextController extends Controller
{
    public function __invoke(Request $request, ActiveClubResolver $resolver): RedirectResponse
    {
        $validated = $request->validate(['club_id' => ['required', 'integer', 'exists:clubs,id']]);
        $resolver->setActiveClub($request, (int) $validated['club_id']);

        return back()->with('success', 'Club activo actualizado.');
    }
}
