<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Migrate any users with old roles to the closest valid new role
        DB::statement("UPDATE users SET role = 'Department Research Coordinator' WHERE role IN ('Research Coordinator', 'Program Coordinator', 'Coordinator')");
        DB::statement("UPDATE users SET role = 'Department Extension Coordinator' WHERE role IN ('Extension Coordinator', 'GAD Coordinator')");
        DB::statement("UPDATE users SET role = 'Faculty Member' WHERE role = 'Staff'");

        // Update the ENUM to only allow the new valid roles
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'Admin',
            'Dean',
            'CEIT Official',
            'Chairperson',
            'Department Research Coordinator',
            'Department Extension Coordinator',
            'Faculty Member'
        ) NOT NULL DEFAULT 'Faculty Member'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'Admin',
            'Dean',
            'CEIT Official',
            'Chairperson',
            'Research Coordinator',
            'Extension Coordinator',
            'Department Research Coordinator',
            'Department Extension Coordinator',
            'Faculty Member',
            'Staff'
        ) NOT NULL DEFAULT 'Faculty Member'");
    }
};
