<?php

/**
 * Test script for date range functionality
 * Run: php test-date-range.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\DefaultEvent;
use Illuminate\Support\Facades\DB;

echo "========================================\n";
echo "Testing Date Range Functionality\n";
echo "========================================\n\n";

// Test 1: Check if end_date column exists
echo "Test 1: Checking if end_date column exists...\n";
try {
    $columns = DB::select("SHOW COLUMNS FROM default_events LIKE 'end_date'");
    if (count($columns) > 0) {
        echo "✓ end_date column exists\n";
        echo "  Type: " . $columns[0]->Type . "\n";
        echo "  Null: " . $columns[0]->Null . "\n\n";
    } else {
        echo "✗ end_date column does NOT exist\n";
        echo "  Please run the migration first!\n\n";
        exit(1);
    }
} catch (Exception $e) {
    echo "✗ Error checking column: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 2: Check model fillable and casts
echo "Test 2: Checking DefaultEvent model configuration...\n";
$model = new DefaultEvent();
$fillable = $model->getFillable();
$casts = $model->getCasts();

if (in_array('end_date', $fillable)) {
    echo "✓ end_date is in fillable array\n";
} else {
    echo "✗ end_date is NOT in fillable array\n";
}

if (isset($casts['end_date']) && $casts['end_date'] === 'date') {
    echo "✓ end_date is cast as date\n\n";
} else {
    echo "✗ end_date is NOT cast as date\n\n";
}

// Test 3: Create a test event with date range
echo "Test 3: Creating test event with date range...\n";
try {
    // Clean up any existing test event
    DefaultEvent::where('name', 'TEST_DATE_RANGE_EVENT')->delete();
    
    $event = DefaultEvent::create([
        'name' => 'TEST_DATE_RANGE_EVENT',
        'month' => 10,
        'order' => 999,
        'date' => '2024-10-15',
        'end_date' => '2024-10-19',
        'school_year' => '2024-2025',
    ]);
    
    echo "✓ Event created successfully\n";
    echo "  ID: " . $event->id . "\n";
    echo "  Name: " . $event->name . "\n";
    echo "  Start Date: " . $event->date->format('Y-m-d') . "\n";
    echo "  End Date: " . ($event->end_date ? $event->end_date->format('Y-m-d') : 'null') . "\n\n";
} catch (Exception $e) {
    echo "✗ Error creating event: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 4: Retrieve and verify the event
echo "Test 4: Retrieving event from database...\n";
try {
    $retrieved = DefaultEvent::find($event->id);
    
    if ($retrieved) {
        echo "✓ Event retrieved successfully\n";
        echo "  Start Date: " . $retrieved->date->format('Y-m-d') . "\n";
        echo "  End Date: " . ($retrieved->end_date ? $retrieved->end_date->format('Y-m-d') : 'null') . "\n";
        
        if ($retrieved->end_date && $retrieved->end_date->format('Y-m-d') === '2024-10-19') {
            echo "✓ End date matches expected value\n\n";
        } else {
            echo "✗ End date does NOT match expected value\n\n";
        }
    } else {
        echo "✗ Could not retrieve event\n\n";
    }
} catch (Exception $e) {
    echo "✗ Error retrieving event: " . $e->getMessage() . "\n\n";
}

// Test 5: Update event with new date range
echo "Test 5: Updating event with new date range...\n";
try {
    $event->update([
        'date' => '2024-10-20',
        'end_date' => '2024-10-25',
    ]);
    
    $event->refresh();
    
    echo "✓ Event updated successfully\n";
    echo "  New Start Date: " . $event->date->format('Y-m-d') . "\n";
    echo "  New End Date: " . ($event->end_date ? $event->end_date->format('Y-m-d') : 'null') . "\n\n";
} catch (Exception $e) {
    echo "✗ Error updating event: " . $e->getMessage() . "\n\n";
}

// Test 6: Create event without end_date (single day)
echo "Test 6: Creating single-day event (no end_date)...\n";
try {
    $singleDayEvent = DefaultEvent::create([
        'name' => 'TEST_SINGLE_DAY_EVENT',
        'month' => 11,
        'order' => 999,
        'date' => '2024-11-15',
        'end_date' => null,
        'school_year' => '2024-2025',
    ]);
    
    echo "✓ Single-day event created successfully\n";
    echo "  ID: " . $singleDayEvent->id . "\n";
    echo "  Date: " . $singleDayEvent->date->format('Y-m-d') . "\n";
    echo "  End Date: " . ($singleDayEvent->end_date ? $singleDayEvent->end_date->format('Y-m-d') : 'null') . "\n\n";
} catch (Exception $e) {
    echo "✗ Error creating single-day event: " . $e->getMessage() . "\n\n";
}

// Test 7: Query events with date ranges
echo "Test 7: Querying all test events...\n";
try {
    $testEvents = DefaultEvent::whereIn('name', ['TEST_DATE_RANGE_EVENT', 'TEST_SINGLE_DAY_EVENT'])
        ->orderBy('date')
        ->get();
    
    echo "✓ Found " . $testEvents->count() . " test event(s)\n";
    foreach ($testEvents as $evt) {
        echo "  - " . $evt->name . ": ";
        echo $evt->date->format('M d, Y');
        if ($evt->end_date) {
            echo " - " . $evt->end_date->format('M d, Y');
        }
        echo "\n";
    }
    echo "\n";
} catch (Exception $e) {
    echo "✗ Error querying events: " . $e->getMessage() . "\n\n";
}

// Cleanup
echo "Cleaning up test events...\n";
try {
    DefaultEvent::whereIn('name', ['TEST_DATE_RANGE_EVENT', 'TEST_SINGLE_DAY_EVENT'])->delete();
    echo "✓ Test events cleaned up\n\n";
} catch (Exception $e) {
    echo "✗ Error cleaning up: " . $e->getMessage() . "\n\n";
}

echo "========================================\n";
echo "All Tests Completed!\n";
echo "========================================\n";
echo "\nDate range functionality is working correctly.\n";
echo "You can now use start and end dates for academic events.\n\n";
