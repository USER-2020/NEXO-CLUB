<?php

namespace App\Providers;

use App\Models\Athlete;
use App\Models\Club;
use App\Models\ClubLocation;
use App\Models\ClubPaymentMethod;
use App\Models\ClubSetting;
use App\Models\Discipline;
use App\Models\Enrollment;
use App\Models\MonthlyCharge;
use App\Models\Payment;
use App\Models\PaymentSubmission;
use App\Models\User;
use App\Observers\AuditObserver;
use App\Services\AuditLogger;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        foreach ([User::class, Club::class, ClubSetting::class, ClubLocation::class, ClubPaymentMethod::class, Discipline::class, Athlete::class, Enrollment::class, MonthlyCharge::class, Payment::class, PaymentSubmission::class] as $model) {
            $model::observe(AuditObserver::class);
        }

        Event::listen(Login::class, fn (Login $event) => app(AuditLogger::class)->event('login', $event->user->id, ['guard' => $event->guard]));
        Event::listen(Logout::class, fn (Logout $event) => app(AuditLogger::class)->event('logout', $event->user?->id));
        Event::listen(Failed::class, fn (Failed $event) => app(AuditLogger::class)->event('login_failed', $event->user?->id, ['email' => $event->credentials['email'] ?? null, 'guard' => $event->guard]));
    }
}
