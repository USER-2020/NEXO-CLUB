<?php

namespace App\Observers;

use App\Services\AuditLogger;
use Illuminate\Database\Eloquent\Model;

class AuditObserver
{
    public function created(Model $model): void
    {
        app(AuditLogger::class)->model('created', $model);
    }

    public function updated(Model $model): void
    {
        app(AuditLogger::class)->model('updated', $model);
    }

    public function deleted(Model $model): void
    {
        app(AuditLogger::class)->model('deleted', $model);
    }
}
