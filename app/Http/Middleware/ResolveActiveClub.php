<?php

namespace App\Http\Middleware;

use App\Services\ActiveClubResolver;
use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class ResolveActiveClub
{
    public function __construct(private readonly ActiveClubResolver $resolver) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()) {
            $club = $this->resolver->resolve($request);
            $request->attributes->set('activeClub', $club);
            app(PermissionRegistrar::class)->setPermissionsTeamId($club?->getKey());
        }

        return $next($request);
    }
}
