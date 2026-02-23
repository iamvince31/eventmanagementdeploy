<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\DefaultEvent;
use Database\Seeders\DefaultEventSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DefaultEventSeederTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that seeder creates exactly 37 events.
     */
    public function test_seeder_creates_correct_total_number_of_events(): void
    {
        $this->seed(DefaultEventSeeder::class);

        $totalEvents = DefaultEvent::count();
        $this->assertEquals(37, $totalEvents, 'Seeder should create exactly 37 events');
    }

    /**
     * Test that all months have the correct event counts as specified in requirements.
     */
    public function test_seeder_creates_correct_events_per_month(): void
    {
        $this->seed(DefaultEventSeeder::class);

        $expectedCounts = [
            1 => 6,   // January
            2 => 3,   // February
            3 => 3,   // March
            4 => 4,   // April
            5 => 3,   // May
            6 => 8,   // June
            7 => 0,   // July (no events)
            8 => 0,   // August (no events)
            9 => 3,   // September
            10 => 2,  // October
            11 => 1,  // November
            12 => 3,  // December
        ];

        foreach ($expectedCounts as $month => $expectedCount) {
            $actualCount = DefaultEvent::where('month', $month)->count();
            $this->assertEquals(
                $expectedCount,
                $actualCount,
                "Month {$month} should have {$expectedCount} events, but has {$actualCount}"
            );
        }
    }

    /**
     * Test that specific required events exist (sampling from requirements 8.1-8.10).
     */
    public function test_seeder_creates_required_events_from_specification(): void
    {
        $this->seed(DefaultEventSeeder::class);

        // Sample events from each month with events (requirements 8.1-8.10)
        $requiredEvents = [
            // September (8.1)
            ['name' => 'Beginning of Classes', 'month' => 9],
            ['name' => 'Registration Period', 'month' => 9],
            ['name' => 'Last Day of Adding/Changing Subjects', 'month' => 9],
            
            // October (8.2)
            ['name' => 'Last Day of Filing Application for Graduation', 'month' => 10],
            ['name' => 'Midterm Exam', 'month' => 10],
            
            // November (8.3)
            ['name' => 'Student Evaluation for Teachers', 'month' => 11],
            
            // December (8.4)
            ['name' => 'Last Day for Thesis Final Defense', 'month' => 12],
            ['name' => 'Christmas Break', 'month' => 12],
            
            // January (8.5)
            ['name' => 'Final Exam (Graduating)', 'month' => 1],
            ['name' => 'Semestral Break', 'month' => 1],
            
            // February (8.6)
            ['name' => 'Beginning of Classes', 'month' => 2],
            
            // March (8.7)
            ['name' => 'College Academic Student Council', 'month' => 3],
            
            // April (8.8)
            ['name' => 'U-Games', 'month' => 4],
            
            // May (8.9)
            ['name' => 'Final Examination for Graduating', 'month' => 5],
            
            // June (8.10)
            ['name' => 'Start of Vacation', 'month' => 6],
        ];

        foreach ($requiredEvents as $event) {
            $this->assertDatabaseHas('default_events', $event, 
                "Required event '{$event['name']}' for month {$event['month']} is missing");
        }
    }

    /**
     * Test that events within each month have proper order values.
     */
    public function test_seeder_sets_appropriate_order_values(): void
    {
        $this->seed(DefaultEventSeeder::class);

        // Check that each month's events have sequential order starting from 1
        $monthsWithEvents = [1, 2, 3, 4, 5, 6, 9, 10, 11, 12];

        foreach ($monthsWithEvents as $month) {
            $events = DefaultEvent::where('month', $month)
                ->orderBy('order')
                ->get();

            $this->assertGreaterThan(0, $events->count(), "Month {$month} should have events");

            // Verify order values start at 1 and are sequential
            foreach ($events as $index => $event) {
                $expectedOrder = $index + 1;
                $this->assertEquals(
                    $expectedOrder,
                    $event->order,
                    "Event '{$event->name}' in month {$month} should have order {$expectedOrder}"
                );
            }
        }
    }

    /**
     * Test that all month values are valid (1-12).
     */
    public function test_all_events_have_valid_month_values(): void
    {
        $this->seed(DefaultEventSeeder::class);

        $events = DefaultEvent::all();

        foreach ($events as $event) {
            $this->assertGreaterThanOrEqual(1, $event->month, 
                "Event '{$event->name}' has invalid month {$event->month} (must be >= 1)");
            $this->assertLessThanOrEqual(12, $event->month, 
                "Event '{$event->name}' has invalid month {$event->month} (must be <= 12)");
        }
    }

    /**
     * Test that all events have non-empty names.
     */
    public function test_all_events_have_names(): void
    {
        $this->seed(DefaultEventSeeder::class);

        $events = DefaultEvent::all();

        foreach ($events as $event) {
            $this->assertNotEmpty($event->name, 
                "Event with id {$event->id} has an empty name");
        }
    }
}
