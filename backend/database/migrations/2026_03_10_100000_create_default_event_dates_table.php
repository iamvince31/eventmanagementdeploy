<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This table tracks when users set specific dates for default academic calendar events
     * for each school year. This allows the same base event to have different dates
     * across different school years without duplicating the event definition.
     */
    public function up(): void
    {
        Schema::create('default_event_dates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('default_event_id')->constrained('default_events')->onDelete('cascade');
            $table->string('school_year', 20); // e.g., "2025-2026"
            $table->date('date');
            $table->date('end_date')->nullable();
            $table->integer('month'); // Extracted from date for quick filtering
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            // Ensure one date entry per event per school year
            $table->unique(['default_event_id', 'school_year'], 'unique_event_date_per_school_year');
            
            // Index for quick lookups
            $table->index(['school_year', 'month']);
            $table->index('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('default_event_dates');
    }
};
