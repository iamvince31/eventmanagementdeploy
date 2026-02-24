<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\DefaultEvent;

echo "=== Testing FIXED Query for School Year 2025-2026 ===\n";
$schoolYear = '2025-2026';

// Get all events with new ordering
$allEvents = DefaultEvent::where(function($q) use ($schoolYear) {
    $q->where('school_year', $schoolYear)
      ->orWhereNull('school_year');
})
->orderByRaw('CASE WHEN school_year IS NULL THEN 1 ELSE 0 END')
->orderBy('month')
->orderBy('order')
->get(['id', 'name', 'month', 'order', 'date', 'school_year']);

echo "Events returned (ordered school-year-specific first): " . $allEvents->count() . "\n\n";

echo "First 10 events to show ordering:\n";
foreach ($allEvents->take(10) as $event) {
    echo "  - ID: {$event->id}, Name: {$event->name}, Month: {$event->month}, School Year: " . ($event->school_year ?? 'NULL') . "\n";
}

echo "\n=== Testing NEW Deduplication Logic ===\n";
$eventsByKey = [];
foreach ($allEvents as $event) {
    $key = $event->name . '_' . $event->month;
    
    if (!isset($eventsByKey[$key])) {
        echo "Key: $key - Using: ID {$event->id} (school_year: " . ($event->school_year ?? 'NULL') . ")\n";
        $eventsByKey[$key] = $event;
    } else {
        echo "Key: $key - SKIPPING: ID {$event->id} (already have " . ($eventsByKey[$key]->school_year ?? 'base') . " version)\n";
    }
}

$events = collect(array_values($eventsByKey))
    ->sortBy([
        ['month', 'asc'],
        ['order', 'asc']
    ])
    ->values()
    ->all();

echo "\nFinal event count after deduplication: " . count($events) . "\n\n";

echo "Events in February (should show school-year-specific versions):\n";
foreach ($events as $event) {
    if ($event->month == 2) {
        echo "  - ID: {$event->id}, Name: {$event->name}, School Year: " . ($event->school_year ?? 'NULL') . ", Date: " . ($event->date ?? 'NULL') . "\n";
    }
}

echo "\n=== Testing for School Year 2024-2025 (should show base events) ===\n";
$schoolYear2 = '2024-2025';

$allEvents2 = DefaultEvent::where(function($q) use ($schoolYear2) {
    $q->where('school_year', $schoolYear2)
      ->orWhereNull('school_year');
})
->orderByRaw('CASE WHEN school_year IS NULL THEN 1 ELSE 0 END')
->orderBy('month')
->orderBy('order')
->get(['id', 'name', 'month', 'order', 'date', 'school_year']);

$eventsByKey2 = [];
foreach ($allEvents2 as $event) {
    $key = $event->name . '_' . $event->month;
    if (!isset($eventsByKey2[$key])) {
        $eventsByKey2[$key] = $event;
    }
}

$events2 = collect(array_values($eventsByKey2))
    ->sortBy([
        ['month', 'asc'],
        ['order', 'asc']
    ])
    ->values()
    ->all();

echo "Total events for 2024-2025: " . count($events2) . "\n";
echo "Events in February for 2024-2025:\n";
foreach ($events2 as $event) {
    if ($event->month == 2) {
        echo "  - ID: {$event->id}, Name: {$event->name}, School Year: " . ($event->school_year ?? 'NULL') . ", Date: " . ($event->date ?? 'NULL') . "\n";
    }
}
