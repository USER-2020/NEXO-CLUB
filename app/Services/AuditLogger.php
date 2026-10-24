<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

class AuditLogger
{
    public function model(string $action, Model $model): void
    {
        $old = $action === 'updated' ? $model->getRawOriginal() : null;
        $new = in_array($action, ['created', 'updated'], true) ? $model->getAttributes() : null;
        $this->write($action, $model::class, $model->getKey(), $old, $new);
    }

    public function event(string $action, ?int $userId, array $metadata = []): void
    {
        $this->write($action, null, null, null, null, $userId, $metadata);
    }

    private function write(string $action, ?string $type, ?int $id, ?array $old, ?array $new, ?int $userId = null, array $metadata = []): void
    {
        $request = app()->bound('request') ? request() : null;
        $clubId = $new['club_id'] ?? $old['club_id'] ?? $request?->attributes->get('activeClub')?->id;
        $userId ??= auth()->id();

        foreach ([$old, $new] as &$values) {
            if ($values) {
                unset($values['password'], $values['remember_token']);
            }
        }

        AuditLog::create([
            'user_id' => $userId,
            'club_id' => $clubId,
            'action' => $action,
            'auditable_type' => $type,
            'auditable_id' => $id,
            'old_values' => $old,
            'new_values' => $new,
            'metadata' => $metadata,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }
}
