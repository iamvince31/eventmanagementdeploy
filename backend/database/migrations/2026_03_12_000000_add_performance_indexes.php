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
        // Add indexes to events table for better query performance
        Schema::table('events', function (Blueprint $table) {
            $table->index('date', 'idx_events_date');
            $table->index(['date', 'time'], 'idx_events_date_time');
            $table->index('school_year', 'idx_events_school_year');
            $table->index('event_type', 'idx_events_event_type');
            $table->index('is_personal', 'idx_events_is_personal');
        });

        // Add index to event_user pivot table
        Schema::table('event_user', function (Blueprint $table) {
            $table->index('status', 'idx_event_user_status');
            $table->index(['user_id', 'status'], 'idx_event_user_user_status');
        });

        // Add indexes to messages table if it exists
        if (Schema::hasTable('messages')) {
            Schema::table('messages', function (Blueprint $table) {
                if (!Schema::hasColumn('messages', 'recipient_id')) {
                    return;
                }
                $table->index('recipient_id', 'idx_messages_recipient_id');
                $table->index('event_id', 'idx_messages_event_id');
                $table->index('type', 'idx_messages_type');
                $table->index(['recipient_id', 'type'], 'idx_messages_recipient_type');
            });
        }

        // Add indexes to event_reschedule_requests table
        if (Schema::hasTable('event_reschedule_requests')) {
            Schema::table('event_reschedule_requests', function (Blueprint $table) {
                $table->index('status', 'idx_reschedule_status');
                $table->index(['event_id', 'status'], 'idx_reschedule_event_status');
            });
        }

        // Add indexes to default_events table for date range queries
        Schema::table('default_events', function (Blueprint $table) {
            $table->index('date', 'idx_default_events_date');
            $table->index('end_date', 'idx_default_events_end_date');
            $table->index(['date', 'end_date'], 'idx_default_events_date_range');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('idx_events_date');
            $table->dropIndex('idx_events_date_time');
            $table->dropIndex('idx_events_school_year');
            $table->dropIndex('idx_events_event_type');
            $table->dropIndex('idx_events_is_personal');
        });

        Schema::table('event_user', function (Blueprint $table) {
            $table->dropIndex('idx_event_user_status');
            $table->dropIndex('idx_event_user_user_status');
        });

        if (Schema::hasTable('messages')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->dropIndex('idx_messages_recipient_id');
                $table->dropIndex('idx_messages_event_id');
                $table->dropIndex('idx_messages_type');
                $table->dropIndex('idx_messages_recipient_type');
            });
        }

        if (Schema::hasTable('event_reschedule_requests')) {
            Schema::table('event_reschedule_requests', function (Blueprint $table) {
                $table->dropIndex('idx_reschedule_status');
                $table->dropIndex('idx_reschedule_event_status');
            });
        }

        Schema::table('default_events', function (Blueprint $table) {
            $table->dropIndex('idx_default_events_date');
            $table->dropIndex('idx_default_events_end_date');
            $table->dropIndex('idx_default_events_date_range');
        });
    }
};
