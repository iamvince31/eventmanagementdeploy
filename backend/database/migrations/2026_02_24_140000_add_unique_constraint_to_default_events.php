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
        Schema::table('default_events', function (Blueprint $table) {
            // Add unique constraint to prevent duplicate school-year-specific events
            // This ensures each event name + month + school_year combination is unique
            $table->unique(['name', 'month', 'school_year'], 'unique_event_per_school_year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('default_events', function (Blueprint $table) {
            $table->dropUnique('unique_event_per_school_year');
        });
    }
};
