<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\ClubApplicationReceivedMail;
use App\Models\ClubApplication;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function submitted(Request $request): Response
    {
        $application = $request->session()->get('registrationSubmitted', []);

        return Inertia::render('Auth/RegistrationSubmitted', [
            'applicantName' => $application['name'] ?? null,
            'email' => $application['email'] ?? null,
            'clubName' => $application['club'] ?? null,
            'emailVerified' => (bool) ($application['emailVerified'] ?? false),
        ]);
    }

    public function verifyEmail(Request $request, User $user, string $hash): RedirectResponse
    {
        abort_unless(hash_equals(sha1($user->email), $hash), 403);

        $user->forceFill(['email_verified_at' => now()])->save();

        return redirect(route('registration.submitted', absolute: false))->with('registrationSubmitted', [
            'name' => $user->name,
            'email' => $user->email,
            'emailVerified' => true,
            'club' => $user->clubApplications()->latest()->value('club_name'),
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'club_name' => ['required', 'string', 'max:120'],
            'club_email' => ['required', 'email', 'max:255'],
            'club_phone' => ['required', 'string', 'max:40'],
            'club_address' => ['required', 'string', 'max:255'],
            'club_city' => ['required', 'string', 'max:100'],
            'club_timezone' => ['required', 'timezone'],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_active' => false,
            'email_verified_at' => null,
        ]);

        $application = ClubApplication::create([
            'user_id' => $user->id,
            'club_name' => $request->club_name,
            'club_email' => $request->club_email,
            'club_phone' => $request->club_phone,
            'club_address' => $request->club_address,
            'club_city' => $request->club_city,
            'club_timezone' => $request->club_timezone,
        ]);

        if (config('nexo.notifications.enabled')) {
            try {
                $verificationUrl = URL::temporarySignedRoute(
                    'registration.verify',
                    now()->addDay(),
                    ['user' => $user->id, 'hash' => sha1($user->email)],
                );
                Mail::to($user->email)->send(new ClubApplicationReceivedMail($application->load('user'), $verificationUrl));
            } catch (\Throwable $exception) {
                Log::warning('No fue posible enviar el correo de recepción de solicitud de club.', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return redirect(route('registration.submitted', absolute: false))->with('registrationSubmitted', [
            'name' => $user->name,
            'email' => $user->email,
            'club' => $application->club_name,
            'emailVerified' => false,
        ]);
    }
}
