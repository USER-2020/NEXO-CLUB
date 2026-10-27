<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['model_has_roles', 'model_has_permissions'] as $tableName) {
            if (! Schema::hasColumn($tableName, 'team_id')) {
                continue;
            }

            $hasPrimaryKey = collect(Schema::getIndexes($tableName))
                ->contains(fn (array $index): bool => (bool) ($index['primary'] ?? false));

            if ($hasPrimaryKey) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropPrimary();
                });
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->unsignedBigInteger('team_id')->nullable()->change();
            });

            $columns = ['team_id', str_ends_with($tableName, 'roles') ? 'role_id' : 'permission_id', 'model_id', 'model_type'];
            $indexName = $tableName.'_team_assignment_unique';

            if (! Schema::hasIndex($tableName, $columns, 'unique')) {
                Schema::table($tableName, function (Blueprint $table) use ($columns, $indexName) {
                    $table->unique($columns, $indexName);
                });
            }
        }
    }

    public function down(): void
    {
        // No se revierte: las asignaciones globales necesitan team_id = NULL.
    }
};
