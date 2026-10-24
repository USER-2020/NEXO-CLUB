<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class GuidedTourController extends Controller
{
    public function complete(Request $request, string $tourKey): RedirectResponse
    {
        abort_unless(preg_match('/^[A-Za-z0-9_\/-]+$/', $tourKey), 404);

        $request->user()->guidedTours()->updateOrCreate(
            ['tour_key' => $tourKey],
            ['completed' => true, 'completed_at' => now()],
        );

        return back(303);
    }
}
