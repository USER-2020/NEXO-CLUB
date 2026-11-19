<?php

namespace Tests\Feature\Billing;

use App\Models\Club;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class BillingNotificationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_updated_enrollment_notifies_its_athlete_and_club_admin_at_the_new_cutoff(): void
    {
        config(['nexo.notifications.enabled' => true, 'mail.default' => 'array']);

        $club = Club::create(['name' => 'Club Prueba', 'slug' => 'club-prueba']);
        $athlete = $club->athletes()->create([
            'first_name' => 'Lucía',
            'last_name' => 'Ríos',
            'email' => 'deportista@example.test',
        ]);
        $discipline = $club->disciplines()->create(['name' => 'Voleibol']);
        $admin = User::factory()->create(['email' => 'admin@example.test']);
        $club->users()->attach($admin, ['status' => 'active']);

        $permissions = app(PermissionRegistrar::class);
        $permissions->setPermissionsTeamId($club->id);
        $admin->assignRole(Role::create(['name' => 'admin', 'guard_name' => 'web', 'team_id' => $club->id]));
        $permissions->setPermissionsTeamId(null);

        $enrollment = $athlete->enrollments()->create([
            'club_id' => $club->id,
            'discipline_id' => $discipline->id,
            'start_date' => '2026-10-07',
            'status' => 'active',
            'billing_frequency' => 'monthly',
            'monthly_amount' => 80000,
            'due_day' => 7,
        ]);
        $previousCharge = $enrollment->charges()->create([
            'club_id' => $club->id,
            'period' => '2026-10-07',
            'period_end' => '2026-11-06',
            'due_date' => '2026-10-07',
            'amount' => 80000,
            'status' => 'paid',
        ]);
        $enrollment->update(['start_date' => '2026-11-17', 'due_day' => 18]);

        $this->artisan('billing:generate-monthly-charges', ['--date' => '2026-11-17'])
            ->expectsOutput('Mensualidades creadas: 1. Inscripciones suspendidas: 0.')
            ->assertSuccessful();
        $this->assertSame('2026-11-18', $enrollment->charges()->latest('period')->firstOrFail()->due_date->toDateString());
        $this->assertSame('2026-10-07', $previousCharge->fresh()->due_date->toDateString());

        $transport = Mail::mailer()->getSymfonyTransport();
        foreach (['2026-11-17' => 'Recordatorio de mensualidad', '2026-11-18' => 'Tu mensualidad vence hoy'] as $date => $subject) {
            $athlete->update(['phone' => $date === '2026-11-17' ? '300 123 4567' : null]);
            $this->artisan('billing:send-notifications', ['--date' => $date])
                ->expectsOutput('Destinatarios deportistas: 1')
                ->expectsOutput('Correos: deportista@example.test')
                ->expectsOutput('Destinatarios administradores: 1')
                ->expectsOutput('Correos: admin@example.test')
                ->assertSuccessful();
            $this->assertSame([
                'deportista@example.test' => $subject.' · NEXO CLUB',
                'admin@example.test' => 'Pendientes por cobrar · Club Prueba',
            ], $transport->messages()->mapWithKeys(fn ($sent) => [
                $sent->getEnvelope()->getRecipients()[0]->getAddress() => $sent->getOriginalMessage()->getSubject(),
            ])->all());
            $report = $transport->messages()->last()->getOriginalMessage();
            $this->assertStringContainsString('Lucía Ríos', $report->getHtmlBody());
            $this->assertStringContainsString('18/11/2026', $report->getHtmlBody());
            if ($athlete->phone) {
                $this->assertStringContainsString('href="https://wa.me/573001234567"', $report->getHtmlBody());
            } else {
                $this->assertStringContainsString('Sin teléfono disponible', $report->getHtmlBody());
                $this->assertStringNotContainsString('https://wa.me/', $report->getHtmlBody());
            }

            $this->assertCount(1, $report->getAttachments());
            $attachment = $report->getAttachments()[0];
            $this->assertSame('pendientes-por-cobrar.xlsx', $attachment->getFilename());
            $this->assertSame('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', $attachment->getMediaType().'/'.$attachment->getMediaSubtype());
            $file = tmpfile();
            try {
                fwrite($file, $attachment->getBody());
                $worksheet = IOFactory::createReader('Xlsx')->load(stream_get_meta_data($file)['uri'])->getActiveSheet();
                $this->assertSame(['Lucía Ríos', 'Voleibol', 80000, 'Pendiente'], [
                    $worksheet->getCell('A2')->getValue(), $worksheet->getCell('B2')->getValue(),
                    $worksheet->getCell('E2')->getValue(), $worksheet->getCell('F2')->getValue(),
                ]);
                $this->assertSame('2026-11-18', Date::excelToDateTimeObject($worksheet->getCell('D2')->getValue())->format('Y-m-d'));
                $this->assertSame(2, $worksheet->getHighestDataRow());
            } finally {
                fclose($file);
            }

            $transport->flush();
        }

        $this->artisan('billing:generate-monthly-charges', ['--date' => '2026-11-19'])->assertSuccessful();
        $this->assertSame('suspended', $enrollment->fresh()->status);
        $this->actingAs($admin)->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
            ->where('adminBillingNotifications.count', 1)
            ->where('adminBillingNotifications.total', 80000)
            ->where('adminBillingNotifications.items.0.status', 'overdue')
            ->where('adminBillingNotifications.items.0.due_date', '2026-11-18'));
        $permissions->setPermissionsTeamId(null);
        $this->artisan('billing:send-notifications', ['--date' => '2026-11-23'])->assertSuccessful();
        $this->assertCount(0, $transport->messages());

        $this->artisan('billing:send-notifications', ['--date' => '2026-11-24'])
            ->expectsOutput('Correos: deportista@example.test')
            ->expectsOutput('Correos: admin@example.test')
            ->assertSuccessful();
        $this->assertCount(2, $transport->messages());
        $transport->flush();

        $this->artisan('billing:send-notifications', ['--date' => '2026-11-24'])->assertSuccessful();
        $this->assertCount(0, $transport->messages());
        $this->assertNull($permissions->getPermissionsTeamId());
    }
}
