<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuidedTourTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_complete_a_module_tour_and_it_is_scoped_to_that_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $this->actingAs($user)
            ->post(route('guided-tours.complete', 'athletes'))
            ->assertRedirect();

        $this->assertDatabaseHas('guided_tours', [
            'user_id' => $user->id,
            'tour_key' => 'athletes',
            'completed' => true,
        ]);
        $this->assertDatabaseMissing('guided_tours', [
            'user_id' => $otherUser->id,
            'tour_key' => 'athletes',
        ]);
    }

    public function test_tour_key_must_be_a_safe_module_key(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('guided-tours.complete', 'athletes<script>'))
            ->assertNotFound();
    }
}
