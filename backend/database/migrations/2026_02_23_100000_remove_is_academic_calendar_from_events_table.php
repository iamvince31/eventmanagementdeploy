<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasColumn('events', 'is_academic_calendar')) {
            Schema::table('events', function (Blueprint $table) {
                $table->dropColumn('is_academic_calendar');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->boolean('is_academic_calendar')->default(false)->after('auto_accept_reschedule');
        });
    }
};
