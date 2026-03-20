<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Reassign any existing Staff users to Faculty Member
        DB::table('users')->where('role', 'Staff')->update(['role' => 'Faculty Member']);

        // Remove Staff from the role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('Admin', 'Dean', 'Chairperson', 'Coordinator', 'Faculty Member', 'CEIT Official') DEFAULT 'Faculty Member'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('Admin', 'Dean', 'Chairperson', 'Coordinator', 'Faculty Member', 'Staff', 'CEIT Official') DEFAULT 'Faculty Member'");
    }
};
