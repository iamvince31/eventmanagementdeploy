<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') return;

        DB::statement("SET SESSION sql_mode = ''");

        // Reassign any existing Coordinator users to Faculty Member
        DB::table('users')
            ->where('role', 'Coordinator')
            ->update(['role' => 'Faculty Member']);

        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'Admin',
            'Dean',
            'CEIT Official',
            'Chairperson',
            'Research Coordinator',
            'Extension Coordinator',
            'Faculty Member',
            'Staff'
        ) NOT NULL DEFAULT 'Faculty Member'");

        DB::statement("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') return;

        DB::statement("SET SESSION sql_mode = ''");

        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'Admin',
            'Dean',
            'CEIT Official',
            'Chairperson',
            'Coordinator',
            'Research Coordinator',
            'Extension Coordinator',
            'Faculty Member',
            'Staff'
        ) NOT NULL DEFAULT 'Faculty Member'");

        DB::statement("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
    }
};
