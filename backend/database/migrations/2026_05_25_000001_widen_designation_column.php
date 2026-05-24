<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Widen designation column to VARCHAR to allow custom values (like 'test') and prevent truncation errors
        Schema::table('users', function (Blueprint $table) {
            $table->string('designation', 255)->default('Faculty Member')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('designation', [
                'Admin',
                'Dean',
                'CEIT Official',
                'Chairperson',
                'Department Research Coordinator',
                'Department Extension Coordinator',
                'Faculty Member'
            ])->default('Faculty Member')->change();
        });
    }
};
