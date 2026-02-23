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
            // Drop Supabase-related columns
            $table->dropColumn(['supabase_id', 'mfa_enabled', 'mfa_factor_id']);
            
            // Make password required again (was made nullable for Supabase)
            $table->string('password')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Restore Supabase columns
            $table->string('supabase_id')->nullable()->unique()->after('id');
            $table->boolean('mfa_enabled')->default(false);
            $table->string('mfa_factor_id')->nullable();
            
            // Make password nullable again
            $table->string('password')->nullable()->change();
        });
    }
};
