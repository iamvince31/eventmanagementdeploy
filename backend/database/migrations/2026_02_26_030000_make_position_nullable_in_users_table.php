<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Modify position column to be nullable and remove default
            $table->enum('position', ['Admin', 'Dean', 'Chairperson', 'Coordinator', 'Faculty Member'])
                  ->nullable()
                  ->default(null)
                  ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Revert position column to not nullable with default
            $table->enum('position', ['Admin', 'Dean', 'Chairperson', 'Coordinator', 'Faculty Member'])
                  ->default('Faculty Member')
                  ->change();
        });
    }
};