<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, update the role enum to include 'Program Coordinator'
        // Position it after 'Chairperson' and before 'Research Coordinator'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'Admin',
            'Dean',
            'CEIT Official',
            'Chairperson',
            'Coordinator',
            'Program Coordinator',
            'Research Coordinator',
            'Extension Coordinator',
            'GAD Coordinator',
            'Faculty Member'
        ) NOT NULL DEFAULT 'Faculty Member'");

        // Now update all users with 'Coordinator' role to 'Program Coordinator'
        DB::table('users')
            ->where('role', 'Coordinator')
            ->update(['role' => 'Program Coordinator']);

        // Finally, remove 'Coordinator' from the role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'Admin',
            'Dean',
            'CEIT Official',
            'Chairperson',
            'Program Coordinator',
            'Research Coordinator',
            'Extension Coordinator',
            'GAD Coordinator',
            'Faculty Member'
        ) NOT NULL DEFAULT 'Faculty Member'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add 'Coordinator' back to the role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'Admin',
            'Dean',
            'CEIT Official',
            'Chairperson',
            'Coordinator',
            'Program Coordinator',
            'Research Coordinator',
            'Extension Coordinator',
            'GAD Coordinator',
            'Faculty Member'
        ) NOT NULL DEFAULT 'Faculty Member'");

        // Revert 'Program Coordinator' back to 'Coordinator'
        DB::table('users')
            ->where('role', 'Program Coordinator')
            ->update(['role' => 'Coordinator']);

        // Remove 'Program Coordinator' from the enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'Admin',
            'Dean',
            'CEIT Official',
            'Chairperson',
            'Coordinator',
            'Research Coordinator',
            'Extension Coordinator',
            'GAD Coordinator',
            'Faculty Member'
        ) NOT NULL DEFAULT 'Faculty Member'");
    }
};
