<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('athletes', function (Blueprint $table) {
            $table->decimal('height_cm', 5, 2)->nullable()->after('birth_date');
            $table->decimal('weight_kg', 5, 2)->nullable()->after('height_cm');
            $table->string('shirt_size', 20)->nullable()->after('weight_kg');
            $table->string('shoe_size', 20)->nullable()->after('shirt_size');
            $table->string('photo_path')->nullable()->after('shoe_size');
        });
    }

    public function down(): void
    {
        Schema::table('athletes', function (Blueprint $table) {
            $table->dropColumn(['height_cm', 'weight_kg', 'shirt_size', 'shoe_size', 'photo_path']);
        });
    }
};
