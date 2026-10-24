<?php

namespace Database\Seeders;

use App\Models\Club;
use Illuminate\Database\Seeder;

class DemoClubSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $club = Club::updateOrCreate(
            ['slug' => 'nexo-club-demo'],
            [
                'name' => 'NEXO Club Demo',
                'email' => 'demo@nexo.club',
                'city' => 'Bogotá',
                'currency' => 'COP',
                'timezone' => 'America/Bogota',
                'is_active' => true,
            ],
        );

        $club->settings()->updateOrCreate([], [
            'enrollment_fee_amount' => 0,
            'monthly_due_day' => 5,
            'mid_month_policy' => 'next_period',
            'reminder_days' => [5, 2, 0, -3, -7],
        ]);

        $club->disciplines()->firstOrCreate(['name' => 'Fútbol'], ['is_active' => true]);
    }
}
