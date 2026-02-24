<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\DefaultEvent;

echo "=== Testing Query for School Year 2025-2026 ===\n";
$schoolYear = '2025-2026';

$testEvents = DefaultEvent::where(function($q) use ($schoolYear) {
    $q->where('school_year', $schoolYear)
      ->orWhereNull('school_year');
})
->orderBy('month')
->orderBy('order')
->get(['id', 'name', 'month', 'order', 'date', 'school_year']);

echo "Events returned: " . $testEvents->count() . "\n\n";

echo "=== Testing Deduplication Logic ===\n";
$eventsByKey = [];
foreach ($testEvents as $event) {
    $key = $event->name . '_' . $event->month;
    
    if (!isset($eventsByKey[$key]) || $event->school_year !== null) {
        if (isset($eventsByKey[$key])) {
            echo "Key: $key - REPLACING base event ID {$eventsByKey[$key]->id} with school-year-specific ID {$event->id}\n";
        } else {
            echo "Key: $key - Using: ID {$event->id} (school_year: " . ($event->school_year ?? 'NULL') . ")\n";
        }
        $eventsByKey[$key] = $event;
    }
}

$finalEvents = array_values($eventsByKey);
echo "\nFinal event count after deduplication: " . count($finalEvents) . "\n\n";

echo "Events in February:\n";
foreach ($finalEvents as $event) {
    if ($event->month == 2) {
        echo "  - ID: {$event->id}, Name: {$event->name}, School Year: " . ($event->school_year ?? 'NULL') . ", Date: " . ($event->date ?? 'NULL') . "\n";
    }
}
