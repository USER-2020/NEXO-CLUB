<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clubs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('email')->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->char('currency', 3)->default('COP');
            $table->string('timezone')->default('America/Bogota');
            $table->string('logo_path')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('club_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('enrollment_fee_amount')->default(0);
            $table->unsignedTinyInteger('monthly_due_day')->default(5);
            $table->string('mid_month_policy')->default('next_period');
            $table->text('payment_instructions')->nullable();
            $table->json('reminder_days')->nullable();
            $table->timestamps();
        });

        Schema::create('club_user', function (Blueprint $table) {
            $table->foreignId('club_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('active');
            $table->boolean('is_default')->default(false);
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();
            $table->unique(['club_id', 'user_id']);
            $table->index(['user_id', 'status']);
        });

        Schema::create('disciplines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['club_id', 'name']);
        });

        Schema::create('club_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['club_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('club_locations');
        Schema::dropIfExists('disciplines');
        Schema::dropIfExists('club_user');
        Schema::dropIfExists('club_settings');
        Schema::dropIfExists('clubs');
    }
};
