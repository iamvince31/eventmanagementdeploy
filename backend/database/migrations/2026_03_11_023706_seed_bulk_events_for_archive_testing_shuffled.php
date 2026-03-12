<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\User;
use Illuminate\Support\Facades\DB;

return new class extends Migration 
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $admins = User::where('role', 'Admin')->get();
        $faculty = User::where('role', 'Faculty Member')->get();
        $allUsers = User::all();

        $hosts = $admins->concat($faculty);

        if ($hosts->isEmpty() || $allUsers->isEmpty()) {
            return;
        }

        $years = [2024, 2025, 2026];
        $eventTitles = [];

        foreach ($years as $year) {
            for ($i = 1; $i <= 5; $i++) {
                $host = $hosts->random();
                $month = str_pad(rand(1, 12), 2, '0', STR_PAD_LEFT);
                $day = str_pad(rand(1, 28), 2, '0', STR_PAD_LEFT);
                $title = "Bulk Test Event {$i} - {$year}";
                $eventTitles[] = $title;

                $eventId = DB::table('events')->insertGetId([
                    'title' => $title,
                    'description' => "Automated test event for year {$year}, iteration {$i}.",
                    'location' => "Test Wing - Hall " . rand(1, 10),
                    'date' => "{$year}-{$month}-{$day}",
                    'time' => str_pad(rand(8, 17), 2, '0', STR_PAD_LEFT) . ":00:00",
                    'school_year' => ($year - 1) . "-" . $year,
                    'host_id' => $host->id,
                    'event_type' => rand(0, 1) ? 'event' : 'meeting',
                    'is_archived' => false,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                // Invite all users
                $invites = $allUsers->map(function ($user) use ($eventId) {
                    return [
                    'event_id' => $eventId,
                    'user_id' => $user->id,
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now()
                    ];
                })->toArray();

                DB::table('event_user')->insert($invites);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $years = [2024, 2025, 2026];
        $titles = [];
        foreach ($years as $year) {
            for ($i = 1; $i <= 5; $i++) {
                $titles[] = "Bulk Test Event {$i} - {$year}";
            }
        }

        $eventIds = DB::table('events')->whereIn('title', $titles)->pluck('id');

        DB::table('event_user')->whereIn('event_id', $eventIds)->delete();
        DB::table('events')->whereIn('id', $eventIds)->delete();
    }
};
