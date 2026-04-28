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

        // Add 'CEIT Staff' to the role enum
        // Position it after 'Dean' and before 'Chairperson'
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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') return;

        // Remove 'CEIT Staff' from the role enum
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
};
