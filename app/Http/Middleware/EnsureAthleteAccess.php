<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\AthleteAccessService;
use Symfony\Component\HttpFoundation\Response;

class EnsureAthleteAccess
{
    public function __construct(private readonly AthleteAccessService $access) {}

    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->hasRole('deportista'), 403);
        abort_unless($request->user()->athlete, 403);
        abort_unless($this->access->hasCurrentSubscription($request->user()->athlete), 403, 'Tu acceso está pendiente de una inscripción activa y un pago vigente.');

        return $next($request);
    }
}
