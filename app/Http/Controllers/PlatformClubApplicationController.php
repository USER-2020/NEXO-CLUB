<?php

namespace App\Http\Controllers;

use App\Mail\ClubApplicationApprovedMail;
use App\Models\Club;
use App\Models\ClubApplication;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PlatformClubApplicationController extends Controller
{
    public function approve(Request $request, ClubApplication $application): RedirectResponse
    {
        abort_unless($application->status === 'pending', 422, 'Esta solicitud ya fue revisada.');
        $application->load('user');
        if (! $application->user->hasVerifiedEmail()) {
            return back()->with('verificationRequired', [
                'applicationId' => $application->id,
                'email' => $application->user->email,
            ]);
        }

        [$application, $club] = DB::transaction(function () use ($application, $request): array {
            $application->load('user');
            $club = Club::create([
                'name' => $application->club_name,
                'slug' => $this->uniqueSlug($application->club_name),
                'email' => $application->club_email,
                'phone' => $application->club_phone,
                'address' => $application->club_address,
                'city' => $application->club_city,
                'timezone' => $application->club_timezone,
            ]);
            $club->settings()->create(['reminder_days' => [5, 2, 0, -3, -7]]);
            $club->users()->attach($application->user_id, [
                'status' => 'active',
                'is_default' => true,
                'joined_at' => now(),
            ]);

            app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
            Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web', 'team_id' => $club->id]);
            $application->user->update(['is_active' => true]);
            $application->user->syncRoles(['admin']);
            $application->update([
                'status' => 'approved',
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'approved_club_id' => $club->id,
            ]);

            app(AuditLogger::class)->event('club_application_approved', $request->user()->id, [
                'application_id' => $application->id,
                'club_id' => $club->id,
                'user_id' => $application->user_id,
            ]);

            return [$application->fresh(['user', 'approvedClub']), $club];
        });

        if (config('nexo.notifications.enabled')) {
            try {
                Mail::to($application->user->email)->send(new ClubApplicationApprovedMail($application));
            } catch (\Throwable $exception) {
                Log::warning('No fue posible enviar el correo de activación de club.', [
                    'application_id' => $application->id,
                    'email' => $application->user->email,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return back()->with('success', 'Solicitud aprobada. El club y la cuenta ya están activos.');
    }

    public function resendVerification(Request $request, ClubApplication $application): RedirectResponse
    {
        abort_unless($application->status === 'pending', 422, 'Esta solicitud ya fue revisada.');
        $application->load('user');

        if ($application->user->hasVerifiedEmail()) {
            return back()->with('success', 'El correo del solicitante ya está confirmado. Puedes aprobar la solicitud.');
        }

        if (! config('nexo.notifications.enabled')) {
            return back()->with('error', 'Las notificaciones por correo están desactivadas en la configuración.');
        }

        try {
            $verificationUrl = URL::temporarySignedRoute(
                'registration.verify',
                now()->addDay(),
                ['user' => $application->user_id, 'hash' => sha1($application->user->email)],
            );
            Mail::to($application->user->email)->send(new \App\Mail\ClubApplicationReceivedMail($application, $verificationUrl));
        } catch (\Throwable $exception) {
            Log::warning('No fue posible reenviar el correo de verificación de club.', [
                'application_id' => $application->id,
                'email' => $application->user->email,
                'error' => $exception->getMessage(),
            ]);

            return back()->with('error', 'No fue posible enviar el correo. Revisa la configuración SMTP.');
        }

        return back()->with('success', "Correo de verificación reenviado a {$application->user->email}.");
    }

    public function reject(Request $request, ClubApplication $application): RedirectResponse
    {
        abort_unless($application->status === 'pending', 422, 'Esta solicitud ya fue revisada.');
        $data = $request->validate(['rejection_reason' => ['nullable', 'string', 'max:1000']]);

        DB::transaction(function () use ($application, $request, $data): void {
            $application->update([
                'status' => 'rejected',
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'rejection_reason' => $data['rejection_reason'] ?? null,
            ]);
            $application->user()->update(['is_active' => false]);
            app(AuditLogger::class)->event('club_application_rejected', $request->user()->id, [
                'application_id' => $application->id,
                'user_id' => $application->user_id,
            ]);
        });

        return back()->with('success', 'Solicitud rechazada.');
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 2;

        while (Club::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }
}
