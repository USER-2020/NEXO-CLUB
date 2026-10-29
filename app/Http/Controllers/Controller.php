<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

abstract class Controller
{
    use AuthorizesRequests;

    protected function pageSize(Request $request): int
    {
        $requested = $request->integer('per_page', 10);

        return in_array($requested, [10, 20, 50], true) ? $requested : 10;
    }
}
