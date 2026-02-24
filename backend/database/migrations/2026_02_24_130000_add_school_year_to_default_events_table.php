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
        Schema::table('default_events', function (Blueprint $table) {
            $table->string('school_year', 20)->nullable()->after('date');
            $table->index(['school_year', 'month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('default_events', function (Blueprint $table) {
            $table->dropIndex(['school_year', 'month']);
            $table->dropColumn('school_year');
        });
    }
};
