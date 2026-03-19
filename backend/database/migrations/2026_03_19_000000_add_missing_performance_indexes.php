<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add missing index on events.host_id for filtering user's hosted events
        if (Schema::hasTable('events')) {
            Schema::table('events', function (Blueprint $table) {
                // Check if index doesn't already exist
                $indexes = DB::select("SHOW INDEX FROM events WHERE Column_name = 'host_id'");
                if (empty($indexes)) {
                    $table->index('host_id', 'idx_events_host_id');
                }
            });
        }

        // Add missing composite index on event_user for user event filtering
        if (Schema::hasTable('event_user')) {
            Schema::table('event_user', function (Blueprint $table) {
                $indexes = DB::select("SHOW INDEX FROM event_user WHERE Key_name = 'idx_event_user_user_event'");
                if (empty($indexes)) {
                    $table->index(['user_id', 'event_id'], 'idx_event_user_user_event');
                }
            });
        }

        // Add missing composite index on user_schedules for schedule conflict checking
        if (Schema::hasTable('user_schedules')) {
            Schema::table('user_schedules', function (Blueprint $table) {
                $indexes = DB::select("SHOW INDEX FROM user_schedules WHERE Key_name = 'idx_user_schedules_user_day'");
                if (empty($indexes)) {
                    $table->index(['user_id', 'day'], 'idx_user_schedules_user_day');
                }
            });
        }

        // Add missing index on default_events.school_year for filtering by academic year
        if (Schema::hasTable('default_events') && Schema::hasColumn('default_events', 'school_year')) {
            Schema::table('default_events', function (Blueprint $table) {
                $indexes = DB::select("SHOW INDEX FROM default_events WHERE Key_name = 'idx_default_events_school_year'");
                if (empty($indexes)) {
                    $table->index('school_year', 'idx_default_events_school_year');
                }
            });
        }

        // Add composite index on events for personal event filtering
        if (Schema::hasTable('events')) {
            Schema::table('events', function (Blueprint $table) {
                $indexes = DB::select("SHOW INDEX FROM events WHERE Key_name = 'idx_events_personal_host'");
                if (empty($indexes)) {
                    $table->index(['is_personal', 'host_id'], 'idx_events_personal_host');
                }
            });
        }

        // Add index on users.is_validated for member list queries
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $indexes = DB::select("SHOW INDEX FROM users WHERE Key_name = 'idx_users_is_validated'");
                if (empty($indexes)) {
                    $table->index('is_validated', 'idx_users_is_validated');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('events')) {
            Schema::table('events', function (Blueprint $table) {
                try {
                    $table->dropIndex('idx_events_host_id');
                } catch (\Exception $e) {
                    // Index doesn't exist, skip
                }
                try {
                    $table->dropIndex('idx_events_personal_host');
                } catch (\Exception $e) {
                    // Index doesn't exist, skip
                }
            });
        }

        if (Schema::hasTable('event_user')) {
            Schema::table('event_user', function (Blueprint $table) {
                try {
                    $table->dropIndex('idx_event_user_user_event');
                } catch (\Exception $e) {
                    // Index doesn't exist, skip
                }
            });
        }

        if (Schema::hasTable('user_schedules')) {
            Schema::table('user_schedules', function (Blueprint $table) {
                try {
                    $table->dropIndex('idx_user_schedules_user_day');
                } catch (\Exception $e) {
                    // Index doesn't exist, skip
                }
            });
        }

        if (Schema::hasTable('default_events')) {
            Schema::table('default_events', function (Blueprint $table) {
                try {
                    $table->dropIndex('idx_default_events_school_year');
                } catch (\Exception $e) {
                    // Index doesn't exist, skip
                }
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                try {
                    $table->dropIndex('idx_users_is_validated');
                } catch (\Exception $e) {
                    // Index doesn't exist, skip
                }
            });
        }
    }
};
