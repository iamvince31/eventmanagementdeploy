<?php

/**
 * Test script to verify Sunday validation logic
 * Run: php backend/test-sunday-validation.php
 */

echo "=== Sunday Validation Test ===\n\n";

// Test dates
$testDates = [
    '2026-03-02' => 'Monday',
    '2026-03-03' => 'Tuesday',
    '2026-03-04' => 'Wednesday',
    '2026-03-05' => 'Thursday',
    '2026-03-06' => 'Friday',
    '2026-03-07' => 'Saturday',
    '2026-03-08' => 'Sunday',
    '2026-03-09' => 'Monday',
];

echo "Testing DateTime format('w') method:\n";
echo str_repeat('-', 50) . "\n";

foreach ($testDates as $dateStr => $expectedDay) {
    $date = new DateTime($dateStr);
    $dayOfWeek = $date->format('w'); // 0 = Sunday, 6 = Saturday
    $isSunday = ($dayOfWeek == 0);
    
    $status = $isSunday ? '❌ BLOCKED' : '✓ ALLOWED';
    
    echo sprintf(
        "%s (%s): Day=%s %s %s\n",
        $dateStr,
        $expectedDay,
        $dayOfWeek,
        $status,
        $isSunday ? '(Sunday detected!)' : ''
    );
}

echo "\n" . str_repeat('-', 50) . "\n";
echo "Testing Carbon dayOfWeek property:\n";
echo str_repeat('-', 50) . "\n";

// Simulate Carbon behavior (if Carbon is available)
if (class_exists('Carbon\Carbon')) {
    foreach ($testDates as $dateStr => $expectedDay) {
        $date = \Carbon\Carbon::parse($dateStr);
        $dayOfWeek = $date->dayOfWeek; // 0 = Sunday, 6 = Saturday
        $isSunday = ($dayOfWeek === 0);
        
        $status = $isSunday ? '❌ BLOCKED' : '✓ ALLOWED';
        
        echo sprintf(
            "%s (%s): Day=%s %s %s\n",
            $dateStr,
            $expectedDay,
            $dayOfWeek,
            $status,
            $isSunday ? '(Sunday detected!)' : ''
        );
    }
} else {
    echo "Carbon not available - skipping Carbon tests\n";
}

echo "\n" . str_repeat('=', 50) . "\n";
echo "JavaScript equivalent test (for reference):\n";
echo str_repeat('=', 50) . "\n";
echo "const date = new Date('2026-03-08');\n";
echo "const isSunday = date.getDay() === 0; // true\n";
echo "\nDay values: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday\n";

echo "\n✓ Test completed successfully!\n";
