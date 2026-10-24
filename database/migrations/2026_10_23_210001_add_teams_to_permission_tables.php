<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('roles', 'team_id')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->unsignedBigInteger('team_id')->nullable()->after('id');
                $table->index('team_id', 'roles_team_foreign_key_index');
            });
        }

        if (! Schema::hasIndex('roles', ['team_id', 'name', 'guard_name'], 'unique')) {
            Schema::table('roles', function (Blueprint $table) {
                if (Schema::hasIndex('roles', ['name', 'guard_name'], 'unique')) {
                    $table->dropUnique(['name', 'guard_name']);
                }

                $table->unique(['team_id', 'name', 'guard_name']);
            });
        }

        $pivotTables = [
            'model_has_permissions' => [
                'assignment_columns' => ['team_id', 'permission_id', 'model_id', 'model_type'],
                'legacy_columns' => ['permission_id', 'model_id', 'model_type'],
                'foreign_column' => 'permission_id',
                'foreign_table' => 'permissions',
            ],
            'model_has_roles' => [
                'assignment_columns' => ['team_id', 'role_id', 'model_id', 'model_type'],
                'legacy_columns' => ['role_id', 'model_id', 'model_type'],
                'foreign_column' => 'role_id',
                'foreign_table' => 'roles',
            ],
        ];

        foreach ($pivotTables as $tableName => $definition) {
            if (! Schema::hasColumn($tableName, 'team_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->unsignedBigInteger('team_id')->nullable()->first();
                    $table->index('team_id', $table->getTable().'_team_foreign_key_index');
                });
            }

            if (! Schema::hasIndex($tableName, $tableName.'_team_foreign_key_index')) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    $table->index('team_id', $tableName.'_team_foreign_key_index');
                });
            }

            if (! Schema::hasIndex($tableName, $definition['assignment_columns'])) {
                $hasLegacyPrimary = Schema::hasIndex($tableName, $definition['legacy_columns'], 'primary');
                $foreignKey = collect(Schema::getForeignKeys($tableName))->first(
                    fn (array $key): bool => $key['columns'] === [$definition['foreign_column']]
                );

                if ($hasLegacyPrimary) {
                    Schema::table($tableName, function (Blueprint $table) use ($foreignKey) {
                        if ($foreignKey !== null) {
                            $table->dropForeign($foreignKey['name']);
                        }

                        $table->dropPrimary();
                    });
                }

                Schema::table($tableName, function (Blueprint $table) use ($tableName, $definition) {
                    $table->unique($definition['assignment_columns'], $tableName.'_team_assignment_unique');
                });
            }

            $hasForeignKey = collect(Schema::getForeignKeys($tableName))->contains(
                fn (array $key): bool => $key['columns'] === [$definition['foreign_column']]
                    && $key['foreign_table'] === $definition['foreign_table']
            );

            if (! $hasForeignKey) {
                Schema::table($tableName, function (Blueprint $table) use ($definition) {
                    $table->foreign($definition['foreign_column'])
                        ->references('id')
                        ->on($definition['foreign_table'])
                        ->cascadeOnDelete();
                });
            }
        }
    }

    public function down(): void
    {
        foreach (['model_has_permissions', 'model_has_roles', 'roles'] as $tableName) {
            if (Schema::hasColumn($tableName, 'team_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropColumn('team_id');
                });
            }
        }
    }
};
