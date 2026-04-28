<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') return;

        // Disable strict mode temporarily so ENUM alteration doesn't fail on warnings
        DB::statement("SET SESSION sql_mode = ''");

        // Reassign any existing GAD Coordinator users to Extension Coordinator
        DB::table('users')
            ->where('role', 'GAD Coordinator')
            ->update(['role' => 'Extension Coordinator']);

        // Also catch any other invalid roles that might cause truncation
        DB::table('users')
            ->whereNotIn('role', [
                'Admin', 'Dean', 'CEIT Official', 'Chairperson',
                'Coordinator', 'Research Coordinator', 'Extension Coordinator',
                'Faculty Member', 'Staff'
            ])
            ->update(['role' => 'Faculty Member']);

        // Remove GAD Coordinator from the ENUM
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

        // Restore strict mode
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
            'GAD Coordinator',
            'Faculty Member',
            'Staff'
        ) NOT NULL DEFAULT 'Faculty Member'");

        DB::statement("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
    }
};
