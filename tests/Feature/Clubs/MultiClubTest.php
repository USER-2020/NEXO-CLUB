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
