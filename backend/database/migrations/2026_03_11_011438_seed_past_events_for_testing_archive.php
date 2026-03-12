<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\User;

return new class extends Migration 
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $admin = User::where('role', 'Admin')->first();
        if (!$admin)
            return;

        $event1 = DB::table('events')->insertGetId([
            'title' => 'First Semester Orientation 2025',
            'description' => 'Orientation for all new CEIT students.',
            'location' => 'CEIT Gym',
            'date' => '2025-08-15',
            'time' => '08:00:00',
            'school_year' => '2025-2026',
            'host_id' => $admin->id,
            'event_type' => 'event',
            'is_archived' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $event2 = DB::table('events')->insertGetId([
            'title' => 'Midterm IT Department Meeting',
            'description' => 'Discussion of midterm grades and curriculum.',
            'location' => 'IT Faculty Room',
            'date' => '2025-10-20',
            'time' => '13:00:00',
            'school_year' => '2025-2026',
            'host_id' => $admin->id,
            'event_type' => 'meeting',
            'is_archived' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $event3 = DB::table('events')->insertGetId([
            'title' => 'Year-End CEIT Faculty Party',
            'description' => 'Celebrating the end of 2025.',
            'location' => 'CVSU Main Campus Multi-Purpose Hall',
            'date' => '2025-12-20',
            'time' => '17:00:00',
            'school_year' => '2025-2026',
            'host_id' => $admin->id,
            'event_type' => 'event',
            'is_archived' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('event_user')->insert([
            ['event_id' => $event1, 'user_id' => $admin->id, 'status' => 'accepted'],
            ['event_id' => $event2, 'user_id' => $admin->id, 'status' => 'accepted'],
            ['event_id' => $event3, 'user_id' => $admin->id, 'status' => 'accepted'],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('events')->whereIn('title', [
            'First Semester Orientation 2025',
            'Midterm IT Department Meeting',
            'Year-End CEIT Faculty Party'
        ])->delete();
    }
};
