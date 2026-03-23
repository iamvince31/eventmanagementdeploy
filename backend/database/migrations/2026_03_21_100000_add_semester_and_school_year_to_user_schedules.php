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
        Schema::table('user_schedules', function (Blueprint $table) {
            // Add semester column (first, second, midyear) if it doesn't exist
            if (!Schema::hasColumn('user_schedules', 'semester')) {
                $table->string('semester')->default('first')->after('description');
            }

            // Add school_year column (e.g., "2025-2026") if it doesn't exist
            if (!Schema::hasColumn('user_schedules', 'school_year')) {
                $table->string('school_year', 9)->nullable()->after('semester');
            }
        });

        // Add index for faster queries (outside the closure to avoid issues)
        try {
            Schema::table('user_schedules', function (Blueprint $table) {
                $table->index(['user_id', 'semester', 'school_year'], 'user_schedules_semester_index');
            });
        }
        catch (\Exception $e) {
        // Index might already exist, ignore the error
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop index if it exists
        try {
            Schema::table('user_schedules', function (Blueprint $table) {
                $table->dropIndex('user_schedules_semester_index');
            });
        }
        catch (\Exception $e) {
        // Index might not exist, ignore the error
        }

        Schema::table('user_schedules', function (Blueprint $table) {
            // Drop columns if they exist
            if (Schema::hasColumn('user_schedules', 'school_year')) {
                $table->dropColumn('school_year');
            }
            if (Schema::hasColumn('user_schedules', 'semester')) {
                $table->dropColumn('semester');
            }
        });
    }
};
