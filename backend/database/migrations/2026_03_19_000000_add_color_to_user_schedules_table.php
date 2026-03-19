<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_schedules', function (Blueprint $table) {
            $table->string('color', 7)->default('#10b981')->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('user_schedules', function (Blueprint $table) {
            $table->dropColumn('color');
        });
    }
};
