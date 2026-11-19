<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class FlowDocumentationAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_club_admin_cannot_see_platform_guides_or_open_their_media(): void
    {
        $club = Club::create(['name' => 'Club de prueba', 'slug' => 'club-de-prueba']);
        $admin = User::factory()->create();
        $club->users()->attach($admin, ['status' => 'active', 'is_default' => true]);
        app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);
        Role::create(['name' => 'admin', 'guard_name' => 'web', 'team_id' => $club->id]);
        $admin->assignRole('admin');

        $this->actingAs($admin)->get(route('flow-docs.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('FlowDocumentation/Index')
                ->where('guides', fn ($guides) => collect($guides)->every(
                    fn ($guide) => ! in_array('Superadmin', $guide['roles'], true)
                ))
                ->has('videos.deportistas-perfil')
                ->where('videos.notificaciones-plataforma.src', fn ($src) => str_starts_with($src, asset('flow-videos/notificaciones-plataforma.mp4')))
                ->where('videos.notificaciones-plataforma.poster', asset('flow-videos/notificaciones-plataforma.jpg'))
                ->where('videos.notificaciones-correo.src', fn ($src) => str_starts_with($src, asset('flow-videos/notificaciones-correo.mp4')))
                ->where('videos.notificaciones-correo.poster', asset('flow-videos/notificaciones-correo.jpg'))
                ->missing('videos.acceso-superadmin')
                ->missing('videos.clubes-global')
                ->missing('videos.auditoria-operaciones'));

        $this->get(route('platform.flow-docs.media', ['guide' => 'clubes-global', 'extension' => 'mp4']))->assertForbidden();
        $this->get(route('platform.flow-docs.media', ['guide' => 'auditoria-operaciones', 'extension' => 'jpg']))->assertForbidden();

        foreach (['acceso-superadmin', 'clubes-global', 'auditoria-operaciones'] as $guide) {
            $this->assertFileDoesNotExist(public_path("flow-videos/{$guide}.mp4"));
            $this->assertFileDoesNotExist(public_path("flow-videos/{$guide}.jpg"));
        }
    }

    public function test_superadmin_can_see_the_platform_guides_and_play_a_protected_video(): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId(null);
        Role::create(['name' => 'superadmin', 'guard_name' => 'web']);
        $superadmin = User::factory()->create();
        $superadmin->assignRole('superadmin');

        $this->actingAs($superadmin)->get(route('platform.flow-docs.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('videos.acceso-superadmin.src', route('platform.flow-docs.media', ['guide' => 'acceso-superadmin', 'extension' => 'mp4']))
                ->has('videos.clubes-global')
                ->has('videos.auditoria-operaciones')
                ->where('videos.clubes-global.src', route('platform.flow-docs.media', ['guide' => 'clubes-global', 'extension' => 'mp4'])));

        $this->withHeader('Range', 'bytes=0-99')
            ->get(route('platform.flow-docs.media', ['guide' => 'clubes-global', 'extension' => 'mp4']))
            ->assertStatus(206)
            ->assertHeader('Content-Type', 'video/mp4');
    }
}
