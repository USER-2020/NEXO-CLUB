<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformAuditController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim($request->string('q')->toString());

        return Inertia::render('Platform/AuditLogs', [
            'logs' => AuditLog::with(['user:id,name,email', 'club:id,name'])
                ->when($search, fn ($query) => $query->where('action', 'like', "%{$search}%")->orWhere('ip_address', 'like', "%{$search}%")->orWhereHas('user', fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))->orWhereHas('club', fn ($query) => $query->where('name', 'like', "%{$search}%")))
                ->latest()
                ->paginate($this->pageSize($request))
                ->withQueryString()
                ->through(fn (AuditLog $log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'user' => $log->user?->only(['name', 'email']),
                    'club' => $log->club?->only(['id', 'name']),
                    'auditable_type' => $log->auditable_type ? class_basename($log->auditable_type) : null,
                    'auditable_id' => $log->auditable_id,
                    'old_values' => $log->old_values,
                    'new_values' => $log->new_values,
                    'metadata' => $log->metadata,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at?->format('Y-m-d H:i:s'),
                ]),
        ]);
    }
}
