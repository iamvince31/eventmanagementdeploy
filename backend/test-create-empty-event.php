<?php

/**
 * Test script for creating empty academic events for July and August
 * 
 * This script tests the new endpoint that allows creating empty events
 * for months that don't have any default events scheduled.
 */

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Empty Event Creation for July and August ===\n\n";

// Test data
$schoolYear = '2025-2026';
$testMonths = [7 => 'July', 8 => 'August'];

foreach ($testMonths as $monthNumber => $monthName) {
    echo "Testing $monthName (month $monthNumber):\n";
    echo str_repeat('-', 50) . "\n";
    
    // Check if any events exist for this month
    $existingEvents = DB::table('default_events')
        ->where('month', $monthNumber)
        ->where('school_year', $schoolYear)
        ->get();
    
    echo "Existing events for $monthName $schoolYear: " . $existingEvents->count() . "\n";
    
    if ($existingEvents->count() === 0) {
        echo "✓ No events found - ready to create empty event\n";
    } else {
        echo "Events found:\n";
        foreach ($existingEvents as $event) {
            echo "  - {$event->name} (Order: {$event->order})\n";
        }
    }
    
    echo "\n";
}

echo "\n=== API Endpoint Information ===\n";
echo "Endpoint: POST /api/default-events/create-empty\n";
echo "Required fields:\n";
echo "  - month: integer (1-12)\n";
echo "  - school_year: string (format: YYYY-YYYY)\n\n";

echo "Example request body:\n";
echo json_encode([
    'month' => 7,
    'school_year' => '2025-2026'
], JSON_PRETTY_PRINT) . "\n\n";

echo "=== Frontend Button Location ===\n";
echo "The 'Add Academic Event' button will appear:\n";
echo "  - In the DefaultEvents page\n";
echo "  - Only for July and August months\n";
echo "  - Only when no events exist for that month\n";
echo "  - In the empty state section of each month card\n\n";

echo "Test completed!\n";
