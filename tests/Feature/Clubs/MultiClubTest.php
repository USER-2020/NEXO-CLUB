<?php

namespace Tests\Feature\Clubs;

use App\Models\Club;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class MultiClubTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_switch_between_clubs_they_belong_to(): void
    {
        [$user, $clubA, $clubB] = $this->makeUserWithClubs();

        $response = $this->actingAs($user)->post(route('clubs.switch'), ['club_id' => $clubB->id]);

        $response->assertRedirect();
        $this->assertSame($clubB->id, session('active_club_id'));
    }

    public function test_user_cannot_switch_to_a_club_they_do_not_belong_to(): void
    {
        [$user, $clubA, $clubB] = $this->makeUserWithClubs();
        $user->clubs()->detach($clubB);
        $this->actingAs($user)->withSession(['active_club_id' => $clubA->id]);

        $response = $this->post(route('clubs.switch'), ['club_id' => $clubB->id]);

        $response->assertNotFound();
        $this->assertSame($clubA->id, session('active_club_id'));
    }

    public function test_club_index_only_returns_the_authenticated_users_active_clubs(): void
    {
        [$user, $clubA, $clubB] = $this->makeUserWithClubs();
        $user->clubs()->updateExistingPivot($clubB->id, ['status' => 'inactive']);

        $response = $this->actingAs($user)->get(route('clubs.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Clubs/Index')
            ->where('clubs.data.0.id', $clubA->id)
            ->where('clubs.data', fn ($clubs) => count($clubs) === 1));
    }

    public function test_user_without_a_club_can_open_configuration_without_a_403(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $response = $this->actingAs($user)->get(route('clubs.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Clubs/Index')
            ->where('clubs.data', [])
            ->where('canCreate', false));
    }

    public function test_club_admin_can_manage_members_but_regular_user_cannot(): void
    {
        $club = Club::create(['name' => 'Club Admin', 'slug' => 'club-admin', 'timezone' => 'America/Bogota']);
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $regularUser = User::factory()->create(['email_verified_at' => now()]);

        $club->users()->attach([
            $admin->id => ['status' => 'active', 'is_default' => true, 'joined_at' => now()],
            $regularUser->id => ['status' => 'active', 'is_default' => false, 'joined_at' => now()],
        ]);

        app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
        Role::create(['name' => 'admin', 'guard_name' => 'web', 'team_id' => $club->id]);
        Role::create(['name' => 'usuario', 'guard_name' => 'web', 'team_id' => $club->id]);
        $admin->assignRole('admin');
        $regularUser->assignRole('usuario');

        $this->actingAs($admin)->get(route('club-members.index'))->assertOk();
        $this->actingAs($regularUser)->get(route('club-members.index'))->assertForbidden();
    }

    public function test_superadmin_uses_the_global_platform_dashboard(): void
    {
        $club = Club::create(['name' => 'Club Platform', 'slug' => 'club-platform', 'timezone' => 'America/Bogota']);
        $superadmin = User::factory()->create(['email_verified_at' => now()]);

        $club->users()->attach($superadmin->id, ['status' => 'active', 'is_default' => true, 'joined_at' => now()]);
        app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
        Role::create(['name' => 'superadmin', 'guard_name' => 'web', 'team_id' => $club->id]);
        $superadmin->assignRole('superadmin');

        $response = $this->actingAs($superadmin)->get(route('platform.dashboard'));

        $response->assertOk()->assertInertia(fn ($page) => $page->component('Platform/Dashboard'));
        $this->actingAs($superadmin)->get(route('dashboard'))->assertRedirect(route('platform.dashboard'));
    }

    public function test_club_onboarding_opens_once_after_each_successful_admin_login(): void
    {
        [$admin, $club] = $this->makeUserWithClubs();
        app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
        Role::create(['name' => 'admin', 'guard_name' => 'web', 'team_id' => $club->id]);
        $admin->syncRoles(['admin']);

        $login = ['email' => $admin->email, 'password' => 'password'];

        $this->post('/login', $login)->assertRedirect(route('dashboard', absolute: false));
        $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->has('onboardingChapters', 5)
            ->where('onboardingChapters.0.animation', fn ($url) => str_contains($url, '/flow-videos/club-configuracion.gif'))
            ->where('onboardingChapters.4.animation', fn ($url) => str_contains($url, '/flow-videos/mensualidades-cobros.gif')));
        $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('onboardingChapters', []));

        $this->post('/logout')->assertRedirect('/');
        $this->post('/login', $login)->assertRedirect(route('dashboard', absolute: false));
        $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->has('onboardingChapters', 5));
    }

    public function test_club_onboarding_stays_hidden_for_operational_users_without_admin_role(): void
    {
        [$user] = $this->makeUserWithClubs();

        $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect();
        $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('onboardingChapters', []));
    }

    public function test_first_athlete_with_email_can_be_enrolled_and_have_the_initial_charge_paid(): void
    {
        [$admin, $club] = $this->makeUserWithClubs();
        app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
        Role::create(['name' => 'admin', 'guard_name' => 'web', 'team_id' => $club->id]);
        $admin->syncRoles(['admin']);
        $discipline = $club->disciplines()->create(['name' => 'Natación', 'is_active' => true]);

        $this->actingAs($admin)->post(route('athletes.store'), [
            'first_name' => 'Lucía',
            'last_name' => 'Ríos',
            'document_type' => 'cedula_ciudadania',
            'email' => 'deportista@example.test',
            'discipline_id' => $discipline->id,
            'start_date' => today()->toDateString(),
            'billing_frequency' => 'monthly',
            'monthly_amount' => 85000,
            'due_day' => today()->day,
        ])->assertRedirect()->assertSessionHasNoErrors();

        $athlete = $club->athletes()->sole();
        $this->assertNotNull($athlete->user_id);
        $enrollment = $athlete->enrollments()->sole();
        $charge = $enrollment->charges()->sole();
        $this->assertSame('pending', $enrollment->status);
        $this->assertSame('pending', $charge->status);

        $this->post(route('memberships.pay', $charge), ['method' => 'cash'])
            ->assertRedirect()->assertSessionHasNoErrors();

        $this->assertSame('paid', $charge->fresh()->status);
        $this->assertSame('active', $enrollment->fresh()->status);
    }

    private function makeUserWithClubs(): array
    {
        $clubA = Club::create(['name' => 'Club A', 'slug' => 'club-a', 'timezone' => 'America/Bogota']);
        $clubB = Club::create(['name' => 'Club B', 'slug' => 'club-b', 'timezone' => 'America/Bogota']);
        $user = User::factory()->create(['email_verified_at' => now()]);

        $user->clubs()->attach([
            $clubA->id => ['status' => 'active', 'is_default' => true, 'joined_at' => now()],
            $clubB->id => ['status' => 'active', 'is_default' => false, 'joined_at' => now()],
        ]);

        app(PermissionRegistrar::class)->setPermissionsTeamId($clubA->id);
        Role::firstOrCreate(['name' => 'usuario', 'guard_name' => 'web', 'team_id' => $clubA->id]);
        $user->assignRole('usuario');

        return [$user, $clubA, $clubB];
    }
}
