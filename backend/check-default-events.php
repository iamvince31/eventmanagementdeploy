<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\DefaultEvent;

echo "=== Checking Default Events ===\n\n";

// Get all default events
$allEvents = DefaultEvent::orderBy('month')->orderBy('order')->get();

echo "Total events in database: " . $allEvents->count() . "\n\n";

// Group by school year
$bySchoolYear = $allEvents->groupBy('school_year');

foreach ($bySchoolYear as $schoolYear => $events) {
    $label = $schoolYear ?? 'BASE (no school_year)';
    echo "School Year: $label\n";
    echo "Count: " . $events->count() . "\n";
    
    foreach ($events as $event) {
        echo "  - ID: {$event->id}, Name: {$event->name}, Month: {$event->month}, Date: " . ($event->date ?? 'NULL') . "\n";
    }
    echo "\n";
}

// Test the index query with a specific school year
echo "=== Testing Query for School Year 2024-2025 ===\n";
$schoolYear = '2024-2025';

$testEvents = DefaultEvent::where(function($q) use ($schoolYear) {
    $q->where('school_year', $schoolYear)
      ->orWhereNull('school_year');
})
->orderBy('month')
->orderBy('order')
->get(['id', 'name', 'month', 'order', 'date', 'school_year']);

echo "Events returned: " . $testEvents->count() . "\n";
foreach ($testEvents as $event) {
    echo "  - ID: {$event->id}, Name: {$event->name}, Month: {$event->month}, School Year: " . ($event->school_year ?? 'NULL') . ", Date: " . ($event->date ?? 'NULL') . "\n";
}

echo "\n=== Testing Deduplication Logic ===\n";
$eventsByKey = [];
foreach ($testEvents as $event) {
    $key = $event->name . '_' . $event->month;
    
    if (!isset($eventsByKey[$key]) || $event->school_year !== null) {
        $eventsByKey[$key] = $event;
        echo "Key: $key - Using: ID {$event->id} (school_year: " . ($event->school_year ?? 'NULL') . ")\n";
    } else {
        echo "Key: $key - Skipping: ID {$event->id} (already have base event)\n";
    }
}

$finalEvents = array_values($eventsByKey);
echo "\nFinal event count after deduplication: " . count($finalEvents) . "\n";
