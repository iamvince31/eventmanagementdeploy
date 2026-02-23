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
            $columnsToDrop = [];

            if (Schema::hasColumn('users', 'supabase_id')) {
                $columnsToDrop[] = 'supabase_id';
            }
            if (Schema::hasColumn('users', 'mfa_enabled')) {
                $columnsToDrop[] = 'mfa_enabled';
            }
            if (Schema::hasColumn('users', 'mfa_factor_id')) {
                $columnsToDrop[] = 'mfa_factor_id';
            }

            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
            
            // Ensure password is not nullable if it was changed by legacy migration
            $table->string('password')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('supabase_id')->nullable()->unique()->after('id');
            $table->boolean('mfa_enabled')->default(false)->after('schedule_initialized');
            $table->string('mfa_factor_id')->nullable()->after('mfa_enabled');
            $table->string('password')->nullable()->change();
        });
    }
};
