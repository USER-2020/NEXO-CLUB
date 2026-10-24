<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('club_payment_methods', function (Blueprint $table): void {
            $table->text('account_number')->nullable()->change();
            $table->text('account_holder')->nullable()->change();
            $table->text('holder_document')->nullable()->change();
        });

        DB::table('club_payment_methods')->orderBy('id')->each(function (object $method): void {
            DB::table('club_payment_methods')->where('id', $method->id)->update([
                'account_number' => filled($method->account_number) ? Crypt::encryptString($method->account_number) : null,
                'account_holder' => filled($method->account_holder) ? Crypt::encryptString($method->account_holder) : null,
                'holder_document' => filled($method->holder_document) ? Crypt::encryptString($method->holder_document) : null,
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('club_payment_methods', function (Blueprint $table): void {
            $table->string('account_number', 100)->nullable()->change();
            $table->string('account_holder', 150)->nullable()->change();
            $table->string('holder_document', 50)->nullable()->change();
        });
    }
};
