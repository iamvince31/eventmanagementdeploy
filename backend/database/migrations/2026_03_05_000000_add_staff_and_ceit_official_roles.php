<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add new roles to the role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('Admin', 'Dean', 'Chairperson', 'Coordinator', 'Faculty Member', 'CEIT Official') DEFAULT 'Faculty Member'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the new roles from the enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('Admin', 'Dean', 'Chairperson', 'Coordinator', 'Faculty Member') DEFAULT 'Faculty Member'");
    }
};
