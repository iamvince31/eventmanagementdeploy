<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add indexes to improve query performance for frequently accessed columns.
     */
    public function up(): void
    {
        Schema::table('default_events', function (Blueprint $table) {
            // Index for filtering by school_year (used in whereNull queries)
            $table->index('school_year', 'idx_default_events_school_year');
            
            // Composite index for ordering queries (month + order)
            $table->index(['month', 'order'], 'idx_default_events_month_order');
        });

        Schema::table('default_event_dates', function (Blueprint $table) {
            // Composite index for the most common query pattern
            $table->index(['default_event_id', 'school_year'], 'idx_ded_event_school_year');
            
            // Index for filtering by school_year
            $table->index('school_year', 'idx_ded_school_year');
            
            // Index for filtering by month
            $table->index('month', 'idx_ded_month');
            
            // Index for filtering by semester
            $table->index('semester', 'idx_ded_semester');
        });

        Schema::table('created_academic_events', function (Blueprint $table) {
            // Index for filtering by school_year
            $table->index('school_year', 'idx_cae_school_year');
            
            // Composite index for filtering and ordering
            $table->index(['school_year', 'semester'], 'idx_cae_school_year_semester');
            
            // Index for ordering
            $table->index('order', 'idx_cae_order');
            
            // Composite index for month-based queries
            $table->index(['school_year', 'month'], 'idx_cae_school_year_month');
        });

        Schema::table('events', function (Blueprint $table) {
            // Index for filtering by event_type
            if (!Schema::hasColumn('events', 'event_type')) {
                return; // Skip if column doesn't exist
            }
            
            // Check if index doesn't already exist
            $sm = Schema::getConnection()->getDoctrineSchemaManager();
            $indexesFound = $sm->listTableIndexes('events');
            
            if (!isset($indexesFound['idx_events_type_personal_archived'])) {
                // Composite index for common filtering pattern
                $table->index(['event_type', 'is_personal', 'is_archived'], 'idx_events_type_personal_archived');
            }
            
            if (!isset($indexesFound['idx_events_date'])) {
                // Index for date-based queries
                $table->index('date', 'idx_events_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('default_events', function (Blueprint $table) {
            $table->dropIndex('idx_default_events_school_year');
            $table->dropIndex('idx_default_events_month_order');
        });

        Schema::table('default_event_dates', function (Blueprint $table) {
            $table->dropIndex('idx_ded_event_school_year');
            $table->dropIndex('idx_ded_school_year');
            $table->dropIndex('idx_ded_month');
            $table->dropIndex('idx_ded_semester');
        });

        Schema::table('created_academic_events', function (Blueprint $table) {
            $table->dropIndex('idx_cae_school_year');
            $table->dropIndex('idx_cae_school_year_semester');
            $table->dropIndex('idx_cae_order');
            $table->dropIndex('idx_cae_school_year_month');
        });

        Schema::table('events', function (Blueprint $table) {
            $sm = Schema::getConnection()->getDoctrineSchemaManager();
            $indexesFound = $sm->listTableIndexes('events');
            
            if (isset($indexesFound['idx_events_type_personal_archived'])) {
                $table->dropIndex('idx_events_type_personal_archived');
            }
            
            if (isset($indexesFound['idx_events_date'])) {
                $table->dropIndex('idx_events_date');
            }
        });
    }
};
