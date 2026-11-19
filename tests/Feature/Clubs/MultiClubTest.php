<?php

namespace Tests\Feature\Clubs;

use App\Models\Club;
use App\Models\Payment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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
            ->where('showOnboarding', true)
            ->has('onboardingChapters', 3)
            ->where('onboardingChapters.0.video.src', fn ($url) => str_contains($url, '/flow-videos/club-configuracion.mp4'))
            ->where('onboardingChapters.2.href', route('athletes.index', absolute: false))
            ->where('onboardingChapters.2.video.src', fn ($url) => str_contains($url, '/flow-videos/deportistas-perfil.mp4')));
        $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('showOnboarding', false)
            ->has('onboardingChapters', 3));

        $this->post('/logout')->assertRedirect('/');
        $this->post('/login', $login)->assertRedirect(route('dashboard', absolute: false));
        $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('showOnboarding', true));
    }

    public function test_club_onboarding_stays_hidden_for_operational_users_without_admin_role(): void
    {
        [$user] = $this->makeUserWithClubs();

        $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect();
        $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('showOnboarding', false)
            ->where('onboardingChapters', []));
    }

    public function test_dashboard_monthly_activity_uses_only_the_active_club_and_correct_dates(): void
    {
        $this->travelTo(Carbon::parse('2026-11-18 10:00:00'));
        [$user, $club, $otherClub] = $this->makeUserWithClubs();

        $enrollmentFor = function (Club $club) {
            $athlete = $club->athletes()->create(['first_name' => $club->name, 'last_name' => 'Deportista', 'status' => 'active']);
            $discipline = $club->disciplines()->create(['name' => 'Natación', 'is_active' => true]);

            return $athlete->enrollments()->create([
                'club_id' => $club->id,
                'discipline_id' => $discipline->id,
                'start_date' => '2025-12-01',
                'monthly_amount' => 85000,
                'due_day' => 1,
                'status' => 'active',
            ]);
        };

        $enrollment = $enrollmentFor($club);
        $outstanding = ['club_id' => $club->id, 'status' => 'overdue', 'amount' => 20000];
        $enrollment->charges()->create([...$outstanding, 'period' => '2025-12-01', 'due_date' => '2025-12-01']);
        $enrollment->charges()->create([...$outstanding, 'period' => '2026-11-01', 'due_date' => '2026-11-01']);
        $paidCharge = $enrollment->charges()->create([
            ...$outstanding, 'status' => 'paid', 'amount' => 85000, 'period' => '2026-10-01', 'due_date' => '2026-10-01',
        ]);
        $payment = Payment::create([
            'club_id' => $club->id, 'monthly_charge_id' => $paidCharge->id, 'amount' => 85000, 'paid_at' => '2026-11-01 00:00:00', 'method' => 'cash',
        ]);
        $otherCharge = $enrollmentFor($otherClub)->charges()->create([
            ...$outstanding, 'club_id' => $otherClub->id, 'status' => 'paid', 'amount' => 40000, 'period' => '2026-11-01', 'due_date' => '2026-11-01',
        ]);
        Payment::create([
            'club_id' => $otherClub->id, 'monthly_charge_id' => $otherCharge->id, 'amount' => 40000, 'paid_at' => '2026-11-02 00:00:00', 'method' => 'cash',
        ]);

        $this->actingAs($user)->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->has('financialActivity.months', 12)
            ->where('financialActivity.year', 2026)
            ->where('financialActivity.months.9.paid', 0)
            ->where('financialActivity.months.9.outstanding', 0)
            ->where('financialActivity.months.10.paid', 85000)
            ->where('financialActivity.months.10.outstanding', 20000)
            ->where('financialActivity.months.11.outstanding', 0)
            ->where('stats.monthlyRevenue', 85000)
            ->where('stats.outstandingBalance', 40000)
            ->has('recentPayments', 1)
            ->where('recentPayments.0.id', $payment->id)
            ->where('recentPayments.0.date', '2026-11-01')
            ->where('recentPayments.0.amount', 85000));
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

        $this->travel(2)->days();
        $this->post(route('memberships.pay', $charge), ['method' => 'cash'])
            ->assertRedirect()->assertSessionHasNoErrors();

        $charge->refresh();
        $enrollment->refresh();
        $this->assertSame('paid', $charge->status);
        $this->assertSame('active', $enrollment->status);
        $this->assertSame(today()->toDateString(), $enrollment->start_date->toDateString());
        $this->assertSame($enrollment->start_date->toDateString(), $charge->period->toDateString());
        $this->assertSame($charge->period->toDateString(), $charge->payment->paid_at->toDateString());
    }

    public function test_athlete_onboarding_can_record_the_first_payment_and_start_the_enrollment_on_the_same_day(): void
    {
        [$admin, $club, $otherClub] = $this->makeUserWithClubs();
        app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
        $admin->assignRole(Role::create(['name' => 'admin', 'guard_name' => 'web', 'team_id' => $club->id]));
        $discipline = $club->disciplines()->create(['name' => 'Natación', 'is_active' => true]);
        $foreignDiscipline = $otherClub->disciplines()->create(['name' => 'Atletismo', 'is_active' => true]);

        $profile = [
            'first_name' => 'Lucía',
            'last_name' => 'Ríos',
            'document_type' => 'cedula_ciudadania',
            'discipline_id' => $discipline->id,
            'start_date' => today()->addDays(5)->toDateString(),
            'billing_frequency' => 'biweekly',
            'monthly_amount' => 85000,
            'due_day' => 18,
            'initial_charge_mode' => 'paid',
        ];

        $this->actingAs($admin)->post(route('athletes.store'), $profile)
            ->assertSessionHasErrors('payment_method');
        $this->post(route('athletes.store'), [...$profile, 'discipline_id' => $foreignDiscipline->id, 'payment_method' => 'cash'])
            ->assertSessionHasErrors('discipline_id');
        $this->assertDatabaseCount('athletes', 0);

        $this->post(route('athletes.store'), [...$profile, 'payment_method' => 'transfer', 'payment_reference' => 'NEXO-018'])
            ->assertRedirect()->assertSessionHasNoErrors();

        $enrollment = $club->athletes()->sole()->enrollments()->sole();
        $charge = $enrollment->charges()->sole();
        $payment = $charge->payment()->sole();
        $this->assertSame('active', $enrollment->status);
        $this->assertSame('paid', $charge->status);
        $this->assertSame(today()->toDateString(), $enrollment->start_date->toDateString());
        $this->assertSame($enrollment->start_date->toDateString(), $charge->period->toDateString());
        $this->assertSame($charge->period->toDateString(), $payment->paid_at->toDateString());
        $this->assertSame(today()->addDays(14)->toDateString(), $charge->period_end->toDateString());
        $this->assertSame($club->id, $payment->club_id);
        $this->assertEquals(85000, $payment->amount);
        $this->assertSame('transfer', $payment->method);
        $this->assertSame('NEXO-018', $payment->reference);

        $this->post(route('memberships.pay', $charge), ['method' => 'cash'])->assertUnprocessable();
        $this->assertDatabaseCount('payments', 1);
    }

    public function test_athlete_photo_is_replaced_and_served_privately_with_a_new_url(): void
    {
        $disk = Storage::fake('local');
        [$admin, $club, $otherClub] = $this->makeUserWithClubs();
        $admin->assignRole(Role::create(['name' => 'admin', 'guard_name' => 'web', 'team_id' => $club->id]));
        $owner = User::factory()->create();
        $club->users()->attach($owner, ['status' => 'active', 'is_default' => true, 'joined_at' => now()]);
        $photoBytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aG4sAAAAASUVORK5CYII=');
        $oldPath = "athletes/{$club->id}/old.png";
        $disk->put($oldPath, $photoBytes);
        $profile = ['first_name' => 'Lucía', 'last_name' => 'Ríos', 'document_type' => 'cedula_ciudadania'];
        $athlete = $club->athletes()->create([...$profile, 'user_id' => $owner->id, 'photo_path' => $oldPath, 'status' => 'active']);
        $oldUrl = $athlete->photoUrl();

        $this->get($oldUrl)->assertRedirect(route('login'));
        $payload = [
            ...$profile,
            '_method' => 'patch',
            'photo' => UploadedFile::fake()->createWithContent('nueva.png', $photoBytes),
        ];

        $failedDisk = \Mockery::mock(FilesystemAdapter::class);
        $failedDisk->shouldReceive('putFileAs')->once()->andReturn(false);
        Storage::set('local', $failedDisk);
        $this->actingAs($admin)->post(route('athletes.update', $athlete), $payload)
            ->assertSessionHasErrors('photo');
        Storage::set('local', $disk);
        $this->assertSame($oldPath, $athlete->fresh()->photo_path);
        $disk->assertExists($oldPath);

        $this->post(route('athletes.update', $athlete), $payload)
            ->assertRedirect()->assertSessionHasNoErrors();

        $athlete->refresh();
        $newUrl = $athlete->photoUrl();
        $this->assertNotSame($oldUrl, $newUrl);
        $disk->assertExists($athlete->photo_path);
        $disk->assertMissing($oldPath);
        $this->get(route('athletes.index'))->assertInertia(fn ($page) => $page
            ->where('athletes.data.0.photo_url', $newUrl)
            ->missing('athletes.data.0.photo_path'));
        $photo = $this->get($newUrl)->assertOk()->assertHeader('Cache-Control', 'no-store, private');
        $this->assertSame($disk->path($athlete->photo_path), $photo->baseResponse->getFile()->getPathname());
        $this->withSession(['active_club_id' => $otherClub->id])->get($newUrl)->assertNotFound();
        $this->actingAs($owner)->withSession(['active_club_id' => $club->id])->get($newUrl)->assertOk();

        $otherMember = User::factory()->create();
        $club->users()->attach($otherMember, ['status' => 'active', 'is_default' => true, 'joined_at' => now()]);
        $this->actingAs($otherMember)->get($newUrl)->assertNotFound();
        $disk->delete($athlete->photo_path);
        $this->actingAs($admin)->get(route('athletes.index'))->assertInertia(fn ($page) => $page
            ->where('athletes.data.0.photo_url', null));
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
