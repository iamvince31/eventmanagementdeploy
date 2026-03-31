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
        // First, update all users with 'CEIT Staff' role to 'CEIT Official'
        DB::table('users')
            ->where('role', 'CEIT Staff')
            ->update(['role' => 'CEIT Official']);

        // Remove 'CEIT Staff' from the role enum
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
        // Add 'CEIT Staff' back to the role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'Admin',
            'Dean',
            'CEIT Staff',
            'CEIT Official',
            'Chairperson',
            'Program Coordinator',
            'Research Coordinator',
            'Extension Coordinator',
            'GAD Coordinator',
            'Faculty Member'
        ) NOT NULL DEFAULT 'Faculty Member'");

        // Update users back to 'CEIT Staff' (optional, as we can't know which ones were originally CEIT Staff)
        // Leaving them as CEIT Official for safety
    }
};
