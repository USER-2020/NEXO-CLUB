<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'athlete' => $request->user()->athlete ? [
                'first_name' => $request->user()->athlete->first_name,
                'last_name' => $request->user()->athlete->last_name,
                'document_number' => $request->user()->athlete->document_number,
                'birth_date' => $request->user()->athlete->birth_date?->format('Y-m-d'),
                'height_cm' => $request->user()->athlete->height_cm,
                'weight_kg' => $request->user()->athlete->weight_kg,
                'shirt_size' => $request->user()->athlete->shirt_size,
                'shoe_size' => $request->user()->athlete->shoe_size,
                'phone' => $request->user()->athlete->phone,
                'guardian_name' => $request->user()->athlete->guardian_name,
                'guardian_phone' => $request->user()->athlete->guardian_phone,
            ] : null,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
