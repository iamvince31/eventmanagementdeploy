<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class EventArchiveSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::where('designation', 'Admin')->first() ?? User::first();

        if (!$admin) {
            $this->command->error('No users found to host events. Please run AdminSeeder or UsersSeeder first.');
            return;
        }

        $now = Carbon::now();

        $events = [
            // --- ACTIVE EVENTS (Future) ---
            [
                'title' => 'Upcoming Tech Symposium',
                'description' => 'A gathering of tech enthusiasts to discuss future trends.',
                'location' => 'CEIT Multi-Purpose Hall',
                'date' => $now->copy()->addDays(5)->toDateString(),
                'time' => '09:00',
                'end_time' => '12:00',
                'school_year' => '2025-2026',
                'host_id' => $admin->id,
                'event_type' => 'Academic',
                'is_urgent' => true,
                'is_archived' => false,
            ],
            [
                'title' => 'Midterm Faculty Meeting',
                'description' => 'Discussing student progress and upcoming finals.',
                'location' => 'Conference Room A',
                'date' => $now->copy()->addDays(10)->toDateString(),
                'time' => '14:00',
                'end_time' => '16:00',
                'school_year' => '2025-2026',
                'host_id' => $admin->id,
                'event_type' => 'Meeting',
                'is_urgent' => false,
                'is_archived' => false,
            ],

            // --- PAST EVENTS (Not Archived) ---
            [
                'title' => 'Opening Ceremony',
                'description' => 'Welcome ceremony for the new academic year.',
                'location' => 'University Gymnasium',
                'date' => $now->copy()->subMonths(2)->toDateString(),
                'time' => '08:00',
                'end_time' => '10:00',
                'school_year' => '2025-2026',
                'host_id' => $admin->id,
                'event_type' => 'Academic',
                'is_urgent' => false,
                'is_archived' => false,
            ],
            [
                'title' => 'Research Workshop',
                'description' => 'Training session on modern research methodologies.',
                'location' => 'DIT Computer Lab',
                'date' => $now->copy()->subWeeks(3)->toDateString(),
                'time' => '13:00',
                'end_time' => '17:00',
                'school_year' => '2025-2026',
                'host_id' => $admin->id,
                'event_type' => 'Workshop',
                'is_urgent' => false,
                'is_archived' => false,
            ],

            // --- ARCHIVED EVENTS ---
            [
                'title' => 'Old Curriculum Review',
                'description' => 'Historical review of the 2020 curriculum.',
                'location' => 'Old Library',
                'date' => $now->copy()->subYears(1)->toDateString(),
                'time' => '10:00',
                'end_time' => '12:00',
                'school_year' => '2020-2021',
                'host_id' => $admin->id,
                'event_type' => 'Archive',
                'is_urgent' => false,
                'is_archived' => true,
            ],
            [
                'title' => 'Legacy System Migration',
                'description' => 'Archived records of the system migration project.',
                'location' => 'Server Room B',
                'date' => $now->copy()->subMonths(6)->toDateString(),
                'time' => '09:00',
                'end_time' => '17:00',
                'school_year' => '2024-2025',
                'host_id' => $admin->id,
                'event_type' => 'Infrastructure',
                'is_urgent' => false,
                'is_archived' => true,
            ],
            [
                'title' => 'Cancelled Gala Dinner',
                'description' => 'This event was cancelled and moved to archive.',
                'location' => 'University Plaza',
                'date' => $now->copy()->subDays(1)->toDateString(),
                'time' => '18:00',
                'end_time' => '21:00',
                'school_year' => '2025-2026',
                'host_id' => $admin->id,
                'event_type' => 'Social',
                'is_urgent' => false,
                'is_archived' => true,
            ],
        ];

        foreach ($events as $eventData) {
            Event::create($eventData);
        }

        $this->command->info('EventArchiveSeeder: ' . count($events) . ' events seeded.');
    }
}
