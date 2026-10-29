<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table): void {
            $table->string('billing_frequency', 20)->default('monthly')->after('monthly_amount')->index();
        });

        Schema::table('monthly_charges', function (Blueprint $table): void {
            $table->date('period_end')->nullable()->after('period')->index();
        });

        DB::table('monthly_charges')->orderBy('id')->each(function (object $charge): void {
            $periodEnd = Carbon::parse($charge->period)->addMonthNoOverflow()->subDay()->toDateString();
            DB::table('monthly_charges')->where('id', $charge->id)->update(['period_end' => $periodEnd]);
        });
    }

    public function down(): void
    {
        Schema::table('monthly_charges', fn (Blueprint $table) => $table->dropColumn('period_end'));
        Schema::table('enrollments', fn (Blueprint $table) => $table->dropColumn('billing_frequency'));
    }
};
