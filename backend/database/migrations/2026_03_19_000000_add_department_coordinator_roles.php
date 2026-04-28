<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') return;

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

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') return;

        // Reassign new roles back to Coordinator before dropping
        DB::table('users')
            ->whereIn('role', ['Research Coordinator', 'Extension Coordinator', 'GAD Coordinator'])
            ->update(['role' => 'Coordinator']);

        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'Admin',
            'Dean',
            'Chairperson',
            'Coordinator',
            'Faculty Member',
            'CEIT Official'
        ) NOT NULL DEFAULT 'Faculty Member'");
    }
};
