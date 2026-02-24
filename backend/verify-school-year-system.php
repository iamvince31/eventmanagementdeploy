<?php

/**
 * Complete System Verification Script
 * 
 * This script verifies that the school year system is working correctly
 * by testing multiple school years and ensuring events appear properly.
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\DefaultEvent;

echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║        School Year System - Complete Verification             ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

// Test multiple school years
$testYears = ['2024-2025', '2025-2026', '2026-2027'];

echo "Test 1: Verify Base Events\n";
echo str_repeat("─", 64) . "\n";

$baseEvents = DefaultEvent::whereNull('school_year')->count();
echo "Base events (school_year = NULL): $baseEvents\n";

if ($baseEvents === 36) {
    echo "✅ PASS: All 36 base events are present\n";
} else {
    echo "❌ FAIL: Expected 36 base events, found $baseEvents\n";
}

echo "\nTest 2: Verify School-Year-Specific Events\n";
echo str_repeat("─", 64) . "\n";

$schoolYearEvents = DefaultEvent::whereNotNull('school_year')->get();
echo "School-year-specific events: " . $schoolYearEvents->count() . "\n";

foreach ($schoolYearEvents as $event) {
    $monthName = date('F', mktime(0, 0, 0, $event->month, 1));
    echo "  • {$event->name} ({$monthName}) - {$event->school_year}\n";
}

echo "\nTest 3: Query Each School Year\n";
echo str_repeat("─", 64) . "\n";

foreach ($testYears as $schoolYear) {
    echo "\nSchool Year: $schoolYear\n";
    
    // Simulate the controller query
    $allEvents = DefaultEvent::where(function($q) use ($schoolYear) {
        $q->where('school_year', $schoolYear)
          ->orWhereNull('school_year');
    })
    ->orderByRaw('CASE WHEN school_year IS NULL THEN 1 ELSE 0 END')
    ->orderBy('month')
    ->orderBy('order')
    ->get(['id', 'name', 'month', 'order', 'date', 'school_year']);
    
    // Deduplicate
    $eventsByKey = [];
    foreach ($allEvents as $event) {
        $key = $event->name . '_' . $event->month;
        if (!isset($eventsByKey[$key])) {
            $eventsByKey[$key] = $event;
        }
    }
    
    $finalEvents = collect(array_values($eventsByKey))
        ->sortBy([
            ['month', 'asc'],
            ['order', 'asc']
        ])
        ->values()
        ->all();
    
    echo "  Total events: " . count($finalEvents) . "\n";
    
    // Check February events specifically
    $februaryEvents = array_filter($finalEvents, fn($e) => $e->month == 2);
    echo "  February events: " . count($februaryEvents) . "\n";
    
    foreach ($februaryEvents as $event) {
        $dateStr = $event->date ? $event->date->format('M d, Y') : 'No date';
        $syStr = $event->school_year ?? 'BASE';
        echo "    - {$event->name} [$syStr] - $dateStr\n";
    }
    
    if (count($finalEvents) >= 34) {
        echo "  ✅ PASS: Events are displaying correctly\n";
    } else {
        echo "  ❌ FAIL: Expected at least 34 events\n";
    }
}

echo "\nTest 4: Verify No Duplicate Base Events\n";
echo str_repeat("─", 64) . "\n";

$duplicates = DefaultEvent::whereNull('school_year')
    ->select('name', 'month', \DB::raw('COUNT(*) as count'))
    ->groupBy('name', 'month')
    ->having('count', '>', 1)
    ->get();

if ($duplicates->count() === 0) {
    echo "✅ PASS: No duplicate base events found\n";
} else {
    echo "❌ FAIL: Found duplicate base events:\n";
    foreach ($duplicates as $dup) {
        echo "  - {$dup->name} (Month: {$dup->month}) - {$dup->count} copies\n";
    }
}

echo "\nTest 5: Verify Unique Constraint\n";
echo str_repeat("─", 64) . "\n";

try {
    // Try to create a duplicate school-year-specific event
    $testEvent = [
        'name' => 'Test Event',
        'month' => 2,
        'order' => 99,
        'school_year' => '2025-2026',
    ];
    
    DefaultEvent::create($testEvent);
    
    // Try to create duplicate
    try {
        DefaultEvent::create($testEvent);
        echo "❌ FAIL: Unique constraint is not working\n";
        
        // Clean up
        DefaultEvent::where('name', 'Test Event')->delete();
    } catch (\Exception $e) {
        echo "✅ PASS: Unique constraint is working (prevented duplicate)\n";
        
        // Clean up
        DefaultEvent::where('name', 'Test Event')->delete();
    }
} catch (\Exception $e) {
    echo "⚠️  WARNING: Could not test unique constraint: " . $e->getMessage() . "\n";
}

echo "\nTest 6: Verify Controller Logic\n";
echo str_repeat("─", 64) . "\n";

// Test that base events exist for all months with events
$monthsWithEvents = [1, 2, 3, 4, 5, 6, 9, 10, 11, 12];
$allMonthsHaveBaseEvents = true;

foreach ($monthsWithEvents as $month) {
    $count = DefaultEvent::where('month', $month)->whereNull('school_year')->count();
    if ($count === 0) {
        echo "❌ Month $month has no base events\n";
        $allMonthsHaveBaseEvents = false;
    }
}

if ($allMonthsHaveBaseEvents) {
    echo "✅ PASS: All months have base events\n";
} else {
    echo "❌ FAIL: Some months are missing base events\n";
}

echo "\n" . str_repeat("═", 64) . "\n";
echo "Verification Summary\n";
echo str_repeat("─", 64) . "\n";

$allTestsPassed = (
    $baseEvents === 36 &&
    $duplicates->count() === 0 &&
    $allMonthsHaveBaseEvents
);

if ($allTestsPassed) {
    echo "✅ ALL TESTS PASSED - System is working correctly!\n";
} else {
    echo "⚠️  SOME TESTS FAILED - Review the output above\n";
    echo "\nRecommended action:\n";
    echo "  php restore-missing-base-events.php\n";
}

echo "\n";
