<?php

namespace App\Http\Middleware;

use App\Services\PlatformAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlatformAdmin
{
    public function __construct(private readonly PlatformAccess $platformAccess) {}

    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($this->platformAccess->isSuperadmin($request->user()), 403);

        return $next($request);
    }
}
