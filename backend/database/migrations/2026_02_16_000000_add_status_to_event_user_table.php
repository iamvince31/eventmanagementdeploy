<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    public function up(): void
    {
        if (!Schema::hasColumn('event_user', 'status')) {
            Schema::table('event_user', function (Blueprint $table) {
                $table->string('status')->default('pending')->after('user_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('event_user', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
