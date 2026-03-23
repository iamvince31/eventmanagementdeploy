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
        // Check if position column exists before trying to merge
        if (Schema::hasColumn('users', 'position')) {
            // First, update the role column to use the position values where position is not null
            DB::statement("UPDATE users SET role = position WHERE position IS NOT NULL");

            // Drop the position column
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('position');
            });
        }

        // Now modify the role column to include all the position enum values
        Schema::table('users', function (Blueprint $table) {
            // Change role column to string to support all position values (compatible with pgsql)
            $table->string('role')
                ->default('Faculty Member')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add back the position column
        Schema::table('users', function (Blueprint $table) {
            $table->enum('position', ['Admin', 'Dean', 'Chairperson', 'Coordinator', 'Faculty Member'])
                ->nullable()
                ->after('role');
        });

        // Copy role values to position column
        DB::statement("UPDATE users SET position = role WHERE role IN ('Admin', 'Dean', 'Chairperson', 'Coordinator', 'Faculty Member')");

        // Revert role column to original values
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')
                ->default('teacher')
                ->change();
        });

        // Set role back to 'admin' for Admin position, 'teacher' for others
        DB::statement("UPDATE users SET role = 'admin' WHERE position = 'Admin'");
        DB::statement("UPDATE users SET role = 'teacher' WHERE position != 'Admin'");
    }
};