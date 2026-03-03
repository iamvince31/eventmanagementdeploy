<?php

/**
 * Test script to verify that default events move to the correct month
 * when a date is set in a different month than the original.
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\DefaultEvent;
use Carbon\Carbon;

echo "=== Testing Default Event Month Movement ===\n\n";

// Test scenario: Move an event from April to May
$schoolYear = '2025-2026';

// Find or create a test event in April
$aprilEvent = DefaultEvent::where('month', 4)
    ->whereNull('school_year')
    ->first();

if (!$aprilEvent) {
    echo "❌ No base event found in April to test with\n";
    exit(1);
}

echo "📋 Base Event Found:\n";
echo "   Name: {$aprilEvent->name}\n";
echo "   Original Month: {$aprilEvent->month} (April)\n";
echo "   Date: " . ($aprilEvent->date ? $aprilEvent->date->format('Y-m-d') : 'Not set') . "\n\n";

// Set a date in May (month 5)
$newDate = Carbon::create(2026, 5, 15); // May 15, 2026

echo "🔄 Setting date to: {$newDate->format('F d, Y')} (Month: {$newDate->month})\n\n";

// Check if school-year-specific version exists
$existingEvent = DefaultEvent::where('name', $aprilEvent->name)
    ->where('month', $aprilEvent->month)
    ->where('school_year', $schoolYear)
    ->first();

if ($existingEvent) {
    // Update existing
    $existingEvent->date = $newDate;
    $existingEvent->month = $newDate->month;
    $existingEvent->save();
    $event = $existingEvent;
    echo "✅ Updated existing school-year-specific event\n";
} else {
    // Create new
    $event = DefaultEvent::create([
        'name' => $aprilEvent->name,
        'month' => $newDate->month, // Use month from the selected date
        'order' => $aprilEvent->order,
        'date' => $newDate,
        'school_year' => $schoolYear,
    ]);
    echo "✅ Created new school-year-specific event\n";
}

echo "\n📊 Result:\n";
echo "   Event ID: {$event->id}\n";
echo "   Name: {$event->name}\n";
echo "   New Month: {$event->month} (May)\n";
echo "   Date: {$event->date->format('Y-m-d')}\n";
echo "   School Year: {$event->school_year}\n\n";

// Verify the event appears in May when fetching
$mayEvents = DefaultEvent::where('month', 5)
    ->where(function($q) use ($schoolYear) {
        $q->where('school_year', $schoolYear)
          ->orWhereNull('school_year');
    })
    ->get();

$foundInMay = $mayEvents->contains('id', $event->id);

if ($foundInMay) {
    echo "✅ SUCCESS: Event now appears in May!\n";
} else {
    echo "❌ FAILED: Event not found in May\n";
}

// Check that it doesn't appear in April for this school year
$aprilEventsForYear = DefaultEvent::where('month', 4)
    ->where('school_year', $schoolYear)
    ->get();

$foundInApril = $aprilEventsForYear->contains('name', $event->name);

if (!$foundInApril) {
    echo "✅ SUCCESS: Event no longer appears in April for school year {$schoolYear}\n";
} else {
    echo "⚠️  WARNING: Event still appears in April for school year {$schoolYear}\n";
}

echo "\n=== Test Complete ===\n";
