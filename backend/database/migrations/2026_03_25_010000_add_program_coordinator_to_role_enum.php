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
        // Add 'Program Coordinator' to the role enum
        // Position it after 'Chairperson' and before 'Coordinator'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'Admin',
            'Dean',
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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'Program Coordinator' from the role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'Admin',
            'Dean',
            'Chairperson',
            'Coordinator',
            'Research Coordinator',
            'Extension Coordinator',
            'GAD Coordinator',
            'Faculty Member',
            'CEIT Official'
        ) NOT NULL DEFAULT 'Faculty Member'");
    }
};
