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
        if (DB::getDriverName() !== 'mysql') return;

        // First, update all users with 'Program Coordinator' role to 'Coordinator'
        DB::table('users')
            ->where('role', 'Program Coordinator')
            ->update(['role' => 'Coordinator']);

        // Remove 'Program Coordinator' from the role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'Admin',
            'Dean',
            'CEIT Staff',
            'Chairperson',
            'Coordinator',
            'Research Coordinator',
            'Extension Coordinator',
            'GAD Coordinator',
            'Faculty Member',
            'CEIT Official'
        ) NOT NULL DEFAULT 'Faculty Member'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') return;

        // Add 'Program Coordinator' back to the role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'Admin',
            'Dean',
            'CEIT Staff',
            'Chairperson',
            'Program Coordinator',
            'Coordinator',
            'Research Coordinator',
            'Extension Coordinator',
            'GAD Coordinator',
            'Faculty Member',
            'CEIT Official'
        ) NOT NULL DEFAULT 'Faculty Member'");
    }
};
