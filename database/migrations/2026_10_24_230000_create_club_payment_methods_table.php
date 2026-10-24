<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('club_payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_id')->constrained()->cascadeOnDelete();
            $table->string('type', 30); // bank_account, nequi, bre_b, payment_key
            $table->string('label');
            $table->string('provider')->nullable();
            $table->string('account_type', 30)->nullable();
            $table->string('account_number')->nullable();
            $table->string('account_holder')->nullable();
            $table->string('holder_document')->nullable();
            $table->string('key_type', 30)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->index(['club_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('club_payment_methods');
    }
};
