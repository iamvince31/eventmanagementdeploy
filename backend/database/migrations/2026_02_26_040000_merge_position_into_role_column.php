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
        // First, update the role column to use the position values where position is not null
        DB::statement("UPDATE users SET role = position WHERE position IS NOT NULL");
        
        // Now modify the role column to include all the position enum values
        Schema::table('users', function (Blueprint $table) {
            // Change role column to include all position values
            $table->enum('role', ['Admin', 'Dean', 'Chairperson', 'Coordinator', 'Faculty Member'])
                  ->default('Faculty Member')
                  ->change();
        });
        
        // Drop the position column
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('position');
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
            $table->enum('role', ['admin', 'teacher'])
                  ->default('teacher')
                  ->change();
        });
        
        // Set role back to 'admin' for Admin position, 'teacher' for others
        DB::statement("UPDATE users SET role = 'admin' WHERE position = 'Admin'");
        DB::statement("UPDATE users SET role = 'teacher' WHERE position != 'Admin'");
    }
};