<?php

namespace Tests\Feature\Auth;

use App\Mail\ClubApplicationReceivedMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_public_registration_creates_a_pending_club_application_without_authenticating(): void
    {
        Mail::fake();
        config(['nexo.notifications.enabled' => true]);

        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'club_name' => 'Club Test',
            'club_email' => 'club@example.com',
            'club_phone' => '+573001112233',
            'club_address' => 'Calle 1 # 2-3',
            'club_city' => 'Bogotá',
            'club_timezone' => 'America/Bogota',
        ]);

        $this->assertGuest();
        $this->assertDatabaseHas('users', ['email' => 'test@example.com', 'is_active' => false]);
        $this->assertDatabaseHas('users', ['email' => 'test@example.com', 'email_verified_at' => null]);
        $this->assertDatabaseHas('club_applications', ['club_name' => 'Club Test', 'status' => 'pending']);
        Mail::assertSent(ClubApplicationReceivedMail::class, fn (ClubApplicationReceivedMail $mail) => $mail->hasTo('test@example.com'));
        $response->assertRedirect(route('registration.submitted', absolute: false));
    }

    public function test_registration_submitted_page_explains_the_review_process(): void
    {
        $response = $this->withSession(['registrationSubmitted' => [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'club' => 'Club Test',
        ]])->get(route('registration.submitted'));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('Auth/RegistrationSubmitted')
            ->where('email', 'test@example.com')
            ->where('clubName', 'Club Test'));
    }

    public function test_public_user_can_confirm_email_with_the_signed_link(): void
    {
        $user = \App\Models\User::factory()->unverified()->create(['is_active' => false]);

        $url = URL::temporarySignedRoute('registration.verify', now()->addHour(), [
            'user' => $user->id,
            'hash' => sha1($user->email),
        ]);

        $this->get($url)->assertRedirect(route('registration.submitted', absolute: false));
        $this->assertNotNull($user->fresh()->email_verified_at);
    }
}
