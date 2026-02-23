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
        // Update all existing users (except admin) to have 'teacher' role
        DB::table('users')
            ->where('role', '!=', 'admin')
            ->whereNotNull('role')
            ->update(['role' => 'teacher']);
            
        // Update users with null role to 'teacher'
        DB::table('users')
            ->whereNull('role')
            ->update(['role' => 'teacher']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionally revert back to 'user' role
        DB::table('users')
            ->where('role', 'teacher')
            ->update(['role' => 'user']);
    }
};
