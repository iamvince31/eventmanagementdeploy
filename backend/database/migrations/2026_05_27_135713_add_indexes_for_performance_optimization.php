<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add indexes to improve query performance for frequently accessed columns.
     * Checks if indexes exist before creating to avoid duplicate key errors.
     */
    public function up(): void
    {
        // Helper function to check if index exists
        $indexExists = function($table, $indexName) {
            $indexes = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
            return !empty($indexes);
        };

        // Default Events Table
        Schema::table('default_events', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('default_events', 'idx_default_events_school_year')) {
                $table->index('school_year', 'idx_default_events_school_year');
            }
            
            if (!$indexExists('default_events', 'idx_default_events_month_order')) {
                $table->index(['month', 'order'], 'idx_default_events_month_order');
            }
        });

        // Default Event Dates Table
        Schema::table('default_event_dates', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('default_event_dates', 'idx_ded_event_school_year')) {
                $table->index(['default_event_id', 'school_year'], 'idx_ded_event_school_year');
            }
            
            if (!$indexExists('default_event_dates', 'idx_ded_school_year')) {
                $table->index('school_year', 'idx_ded_school_year');
            }
            
            if (!$indexExists('default_event_dates', 'idx_ded_month')) {
                $table->index('month', 'idx_ded_month');
            }
            
            if (!$indexExists('default_event_dates', 'idx_ded_semester')) {
                $table->index('semester', 'idx_ded_semester');
            }
        });

        // Created Academic Events Table
        Schema::table('created_academic_events', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('created_academic_events', 'idx_cae_school_year')) {
                $table->index('school_year', 'idx_cae_school_year');
            }
            
            if (!$indexExists('created_academic_events', 'idx_cae_school_year_semester')) {
                $table->index(['school_year', 'semester'], 'idx_cae_school_year_semester');
            }
            
            if (!$indexExists('created_academic_events', 'idx_cae_order')) {
                $table->index('order', 'idx_cae_order');
            }
            
            if (!$indexExists('created_academic_events', 'idx_cae_school_year_month')) {
                $table->index(['school_year', 'month'], 'idx_cae_school_year_month');
            }
        });

        // Events Table
        if (Schema::hasTable('events')) {
            Schema::table('events', function (Blueprint $table) use ($indexExists) {
                if (Schema::hasColumn('events', 'event_type')) {
                    if (!$indexExists('events', 'idx_events_type_personal_archived')) {
                        $table->index(['event_type', 'is_personal', 'is_archived'], 'idx_events_type_personal_archived');
                    }
                }
                
                if (Schema::hasColumn('events', 'date')) {
                    if (!$indexExists('events', 'idx_events_date')) {
                        $table->index('date', 'idx_events_date');
                    }
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Helper function to check if index exists
        $indexExists = function($table, $indexName) {
            $indexes = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
            return !empty($indexes);
        };

        Schema::table('default_events', function (Blueprint $table) use ($indexExists) {
            if ($indexExists('default_events', 'idx_default_events_school_year')) {
                $table->dropIndex('idx_default_events_school_year');
            }
            if ($indexExists('default_events', 'idx_default_events_month_order')) {
                $table->dropIndex('idx_default_events_month_order');
            }
        });

        Schema::table('default_event_dates', function (Blueprint $table) use ($indexExists) {
            if ($indexExists('default_event_dates', 'idx_ded_event_school_year')) {
                $table->dropIndex('idx_ded_event_school_year');
            }
            if ($indexExists('default_event_dates', 'idx_ded_school_year')) {
                $table->dropIndex('idx_ded_school_year');
            }
            if ($indexExists('default_event_dates', 'idx_ded_month')) {
                $table->dropIndex('idx_ded_month');
            }
            if ($indexExists('default_event_dates', 'idx_ded_semester')) {
                $table->dropIndex('idx_ded_semester');
            }
        });

        Schema::table('created_academic_events', function (Blueprint $table) use ($indexExists) {
            if ($indexExists('created_academic_events', 'idx_cae_school_year')) {
                $table->dropIndex('idx_cae_school_year');
            }
            if ($indexExists('created_academic_events', 'idx_cae_school_year_semester')) {
                $table->dropIndex('idx_cae_school_year_semester');
            }
            if ($indexExists('created_academic_events', 'idx_cae_order')) {
                $table->dropIndex('idx_cae_order');
            }
            if ($indexExists('created_academic_events', 'idx_cae_school_year_month')) {
                $table->dropIndex('idx_cae_school_year_month');
            }
        });

        if (Schema::hasTable('events')) {
            Schema::table('events', function (Blueprint $table) use ($indexExists) {
                if ($indexExists('events', 'idx_events_type_personal_archived')) {
                    $table->dropIndex('idx_events_type_personal_archived');
                }
                if ($indexExists('events', 'idx_events_date')) {
                    $table->dropIndex('idx_events_date');
                }
            });
        }
    }
};
