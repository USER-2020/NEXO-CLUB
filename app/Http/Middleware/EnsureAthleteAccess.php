<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAthleteAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->hasRole('deportista'), 403);
        abort_unless($request->user()->athlete, 403);

        return $next($request);
    }
}
