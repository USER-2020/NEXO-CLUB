<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['model_has_roles', 'model_has_permissions'] as $tableName) {
            if (Schema::hasColumn($tableName, 'team_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->unsignedBigInteger('team_id')->nullable()->change();
                });
            }
        }
    }

    public function down(): void
    {
        // No se revierte a NOT NULL porque las asignaciones globales de superadmin
        // requieren team_id = NULL y podrían existir en una instalación activa.
    }
};
