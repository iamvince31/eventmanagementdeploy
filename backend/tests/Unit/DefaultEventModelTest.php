<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\DefaultEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DefaultEventModelTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that DefaultEvent model can be created with fillable fields.
     */
    public function test_default_event_can_be_created(): void
    {
        $event = DefaultEvent::create([
            'name' => 'Beginning of Classes',
            'month' => 9,
            'order' => 1,
        ]);

        $this->assertDatabaseHas('default_events', [
            'name' => 'Beginning of Classes',
            'month' => 9,
            'order' => 1,
        ]);

        $this->assertInstanceOf(DefaultEvent::class, $event);
    }

    /**
     * Test that month and order fields are cast to integers.
     */
    public function test_month_and_order_are_cast_to_integers(): void
    {
        $event = DefaultEvent::create([
            'name' => 'Midterm Exam',
            'month' => '10',
            'order' => '2',
        ]);

        $this->assertIsInt($event->month);
        $this->assertIsInt($event->order);
        $this->assertEquals(10, $event->month);
        $this->assertEquals(2, $event->order);
    }

    /**
     * Test scopeForMonth filters events by month.
     */
    public function test_scope_for_month_filters_correctly(): void
    {
        // Create events for different months
        DefaultEvent::create(['name' => 'September Event', 'month' => 9, 'order' => 1]);
        DefaultEvent::create(['name' => 'October Event', 'month' => 10, 'order' => 1]);
        DefaultEvent::create(['name' => 'Another September Event', 'month' => 9, 'order' => 2]);

        $septemberEvents = DefaultEvent::forMonth(9)->get();

        $this->assertCount(2, $septemberEvents);
        $this->assertTrue($septemberEvents->every(fn($event) => $event->month === 9));
    }

    /**
     * Test scopeOrdered orders events by order field.
     */
    public function test_scope_ordered_sorts_correctly(): void
    {
        // Create events with different order values
        DefaultEvent::create(['name' => 'Third Event', 'month' => 9, 'order' => 3]);
        DefaultEvent::create(['name' => 'First Event', 'month' => 9, 'order' => 1]);
        DefaultEvent::create(['name' => 'Second Event', 'month' => 9, 'order' => 2]);

        $orderedEvents = DefaultEvent::ordered()->get();

        $this->assertEquals('First Event', $orderedEvents[0]->name);
        $this->assertEquals('Second Event', $orderedEvents[1]->name);
        $this->assertEquals('Third Event', $orderedEvents[2]->name);
    }

    /**
     * Test combining scopes: forMonth and ordered.
     */
    public function test_combined_scopes_work_correctly(): void
    {
        // Create events for different months with different orders
        DefaultEvent::create(['name' => 'Sept Third', 'month' => 9, 'order' => 3]);
        DefaultEvent::create(['name' => 'Oct First', 'month' => 10, 'order' => 1]);
        DefaultEvent::create(['name' => 'Sept First', 'month' => 9, 'order' => 1]);
        DefaultEvent::create(['name' => 'Sept Second', 'month' => 9, 'order' => 2]);

        $septemberOrdered = DefaultEvent::forMonth(9)->ordered()->get();

        $this->assertCount(3, $septemberOrdered);
        $this->assertEquals('Sept First', $septemberOrdered[0]->name);
        $this->assertEquals('Sept Second', $septemberOrdered[1]->name);
        $this->assertEquals('Sept Third', $septemberOrdered[2]->name);
    }
}
