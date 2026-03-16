<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add Mid-Year Semester events for July
        DB::table('default_events')->insert([
            [
                'name' => 'Registration Period',
                'month' => 7,
                'order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Beginning of Classes',
                'month' => 7,
                'order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Midterm Exam',
                'month' => 7,
                'order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Add Mid-Year Semester event for August
        DB::table('default_events')->insert([
            [
                'name' => 'Final Exam',
                'month' => 8,
                'order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove Mid-Year Semester events
        DB::table('default_events')
            ->where('month', 7)
            ->whereIn('name', ['Registration Period', 'Beginning of Classes', 'Midterm Exam'])
            ->delete();

        DB::table('default_events')
            ->where('month', 8)
            ->where('name', 'Final Exam')
            ->delete();
    }
};
