<?php

/**
 * Test script to verify that base events are hidden when a school-year-specific
 * version exists, even if the school-year version is in a different month.
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\DefaultEvent;
use Carbon\Carbon;

echo "=== Testing Base Event Hiding Logic ===\n\n";

$schoolYear = '2025-2026';

// Find a base event in April
$baseEvent = DefaultEvent::where('month', 4)
    ->whereNull('school_year')
    ->first();

if (!$baseEvent) {
    echo "❌ No base event found in April\n";
    exit(1);
}

echo "📋 Base Event:\n";
echo "   ID: {$baseEvent->id}\n";
echo "   Name: {$baseEvent->name}\n";
echo "   Month: {$baseEvent->month} (April)\n";
echo "   School Year: NULL (base event)\n\n";

// Create a school-year-specific version in May (different month)
$mayDate = Carbon::create(2026, 5, 15);

$schoolYearEvent = DefaultEvent::updateOrCreate(
    [
        'name' => $baseEvent->name,
        'school_year' => $schoolYear,
    ],
    [
        'month' => 5, // May - different from base event's April
        'order' => $baseEvent->order,
        'date' => $mayDate,
    ]
);

echo "✅ Created school-year-specific version:\n";
echo "   ID: {$schoolYearEvent->id}\n";
echo "   Name: {$schoolYearEvent->name}\n";
echo "   Month: {$schoolYearEvent->month} (May)\n";
echo "   Date: {$schoolYearEvent->date->format('Y-m-d')}\n";
echo "   School Year: {$schoolYearEvent->school_year}\n\n";

// Now fetch events for this school year (simulating the API call)
echo "🔍 Fetching events for school year {$schoolYear}...\n\n";

$allEvents = DefaultEvent::where(function($q) use ($schoolYear) {
    $q->where('school_year', $schoolYear)
      ->orWhereNull('school_year');
})
->orderByRaw('CASE WHEN school_year IS NULL THEN 1 ELSE 0 END')
->orderBy('month')
->orderBy('order')
->get(['id', 'name', 'month', 'order', 'date', 'school_year']);

// Get all school-year-specific event names
$schoolYearEventNames = $allEvents
    ->where('school_year', $schoolYear)
    ->pluck('name')
    ->unique()
    ->toArray();

echo "📝 School-year-specific event names: " . implode(', ', $schoolYearEventNames) . "\n\n";

// Filter events
$eventsByKey = [];
foreach ($allEvents as $event) {
    $isSchoolYearSpecific = $event->school_year === $schoolYear;
    $hasSchoolYearVersion = in_array($event->name, $schoolYearEventNames);
    
    if ($isSchoolYearSpecific || !$hasSchoolYearVersion) {
        $key = $event->name . '_' . $event->month;
        
        if (!isset($eventsByKey[$key])) {
            $eventsByKey[$key] = $event;
        }
    }
}

$events = collect(array_values($eventsByKey))
    ->sortBy([
        ['month', 'asc'],
        ['order', 'asc']
    ])
    ->values();

// Check results
echo "📊 Results:\n\n";

// Check if base event appears in April
$aprilEvents = $events->where('month', 4);
$baseEventInApril = $aprilEvents->where('name', $baseEvent->name)->first();

if ($baseEventInApril) {
    echo "❌ FAILED: Base event '{$baseEvent->name}' still appears in April\n";
    echo "   This should be hidden because a school-year version exists\n";
} else {
    echo "✅ SUCCESS: Base event '{$baseEvent->name}' is hidden from April\n";
}

// Check if school-year event appears in May
$mayEvents = $events->where('month', 5);
$schoolYearEventInMay = $mayEvents->where('name', $baseEvent->name)->first();

if ($schoolYearEventInMay) {
    echo "✅ SUCCESS: School-year event '{$baseEvent->name}' appears in May\n";
    echo "   ID: {$schoolYearEventInMay->id}\n";
    echo "   Date: {$schoolYearEventInMay->date->format('Y-m-d')}\n";
} else {
    echo "❌ FAILED: School-year event '{$baseEvent->name}' not found in May\n";
}

echo "\n📈 Summary:\n";
echo "   Total events returned: {$events->count()}\n";
echo "   Events in April: {$aprilEvents->count()}\n";
echo "   Events in May: {$mayEvents->count()}\n";

// List all events with the same name
echo "\n📋 All versions of '{$baseEvent->name}':\n";
$allVersions = $events->where('name', $baseEvent->name);
foreach ($allVersions as $version) {
    $monthName = date('F', mktime(0, 0, 0, $version->month, 1));
    $sy = $version->school_year ?? 'NULL (base)';
    echo "   - Month: {$monthName}, School Year: {$sy}, Date: " . 
         ($version->date ? $version->date->format('Y-m-d') : 'Not set') . "\n";
}

echo "\n=== Test Complete ===\n";
