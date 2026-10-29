<?php

namespace Tests\Feature\Clubs;

use App\Mail\ClubApplicationApprovedMail;
use App\Models\ClubApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ClubApplicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_superadmin_approval_activates_account_creates_club_and_sends_email(): void
    {
        Mail::fake();
        [$superadmin, $application] = $this->makeApplication();

        $response = $this->actingAs($superadmin)->patch(route('platform.club-applications.approve', $application));

        $response->assertRedirect();
        $this->assertDatabaseHas('club_applications', ['id' => $application->id, 'status' => 'approved']);
        $this->assertDatabaseHas('clubs', ['name' => 'Club Applicant']);
        $this->assertDatabaseHas('users', ['id' => $application->user_id, 'is_active' => true]);
        Mail::assertSent(ClubApplicationApprovedMail::class, fn (ClubApplicationApprovedMail $mail) => $mail->hasTo('applicant@example.com'));
    }

    public function test_pending_account_cannot_login_until_approved(): void
    {
        [$superadmin, $application] = $this->makeApplication();

        $this->post('/login', ['email' => 'applicant@example.com', 'password' => 'password'])
            ->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    private function makeApplication(): array
    {
        $superadmin = User::factory()->create(['email_verified_at' => now()]);
        app(PermissionRegistrar::class)->setPermissionsTeamId(null);
        $role = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web', 'team_id' => null]);
        $superadmin->assignRole($role);

        $applicant = User::factory()->create([
            'name' => 'Applicant', 'email' => 'applicant@example.com', 'password' => bcrypt('password'),
            'is_active' => false, 'email_verified_at' => now(),
        ]);
        $application = ClubApplication::create([
            'user_id' => $applicant->id, 'club_name' => 'Club Applicant', 'club_email' => 'club@example.com',
            'club_phone' => '+573001112233', 'club_address' => 'Calle 1', 'club_city' => 'Bogotá',
            'club_timezone' => 'America/Bogota',
        ]);

        return [$superadmin, $application];
    }
}
