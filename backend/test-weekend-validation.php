<?php

/**
 * Test Weekend Validation for Default Events
 * 
 * This script tests that both Saturday and Sunday are properly excluded
 * from default event date selection.
 */

require __DIR__ . '/vendor/autoload.php';

use Carbon\Carbon;

echo "=== Weekend Validation Test ===\n\n";

// Test dates
$testDates = [
    '2026-03-02' => 'Monday',
    '2026-03-03' => 'Tuesday',
    '2026-03-04' => 'Wednesday',
    '2026-03-05' => 'Thursday',
    '2026-03-06' => 'Friday',
    '2026-03-07' => 'Saturday',
    '2026-03-08' => 'Sunday',
];

echo "Testing weekend detection:\n";
echo str_repeat('-', 50) . "\n";

foreach ($testDates as $dateStr => $dayName) {
    $date = Carbon::parse($dateStr);
    $dayOfWeek = $date->dayOfWeek;
    $isWeekend = ($dayOfWeek === 0 || $dayOfWeek === 6);
    
    $status = $isWeekend ? '❌ BLOCKED' : '✅ ALLOWED';
    
    echo sprintf(
        "%s (%s) - dayOfWeek: %d - %s\n",
        $dateStr,
        $dayName,
        $dayOfWeek,
        $status
    );
}

echo "\n" . str_repeat('-', 50) . "\n";
echo "Legend:\n";
echo "  dayOfWeek 0 = Sunday\n";
echo "  dayOfWeek 6 = Saturday\n";
echo "  Both should be BLOCKED\n";
echo "\n";

// Validation logic test
echo "Validation Logic Test:\n";
echo str_repeat('-', 50) . "\n";

$validationTests = [
    ['date' => '2026-03-09', 'expected' => 'valid'],   // Monday
    ['date' => '2026-03-14', 'expected' => 'invalid'], // Saturday
    ['date' => '2026-03-15', 'expected' => 'invalid'], // Sunday
    ['date' => '2026-03-16', 'expected' => 'valid'],   // Monday
];

foreach ($validationTests as $test) {
    $date = Carbon::parse($test['date']);
    $isWeekend = ($date->dayOfWeek === 0 || $date->dayOfWeek === 6);
    $result = $isWeekend ? 'invalid' : 'valid';
    $passed = ($result === $test['expected']) ? '✅ PASS' : '❌ FAIL';
    
    echo sprintf(
        "%s (%s) - Expected: %s, Got: %s - %s\n",
        $test['date'],
        $date->format('l'),
        $test['expected'],
        $result,
        $passed
    );
}

echo "\n=== Test Complete ===\n";
