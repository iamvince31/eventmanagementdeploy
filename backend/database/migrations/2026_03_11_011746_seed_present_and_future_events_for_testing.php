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
            'title' => 'CEIT Intramurals 2026 (Present/Soon)',
            'description' => 'The annual CEIT Intramurals happening very soon.',
            'location' => 'Main Campus Track Oval',
            'date' => '2026-03-15', // a few days from now
            'time' => '07:00:00',
            'school_year' => '2025-2026',
            'host_id' => $admin->id,
            'event_type' => 'event',
            'is_archived' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $event2 = DB::table('events')->insertGetId([
            'title' => 'Curriculum Review Meeting (Future)',
            'description' => 'Review of the new curriculum for next year.',
            'location' => 'Conference Room A',
            'date' => '2026-04-10', // next month
            'time' => '10:00:00',
            'school_year' => '2025-2026',
            'host_id' => $admin->id,
            'event_type' => 'meeting',
            'is_archived' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('event_user')->insert([
            ['event_id' => $event1, 'user_id' => $admin->id, 'status' => 'accepted'],
            ['event_id' => $event2, 'user_id' => $admin->id, 'status' => 'accepted'],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('events')->whereIn('title', [
            'CEIT Intramurals 2026 (Present/Soon)',
            'Curriculum Review Meeting (Future)'
        ])->delete();
    }
};
