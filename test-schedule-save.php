<?php

/**
 * Test script to debug schedule saving
 * Run from backend directory: php ../test-schedule-save.php
 */

require __DIR__ . '/backend/vendor/autoload.php';

$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\UserSchedule;
use Illuminate\Support\Facades\DB;

echo "=== Schedule Save Test ===\n\n";

// Test 1: Check if schedule_initialized column exists
echo "Test 1: Checking database schema...\n";
try {
    $columns = DB::select("SHOW COLUMNS FROM users LIKE 'schedule_initialized'");
    if (count($columns) > 0) {
        echo "✓ schedule_initialized column exists in users table\n";
    } else {
        echo "✗ schedule_initialized column NOT FOUND in users table\n";
        echo "  Run: php artisan migrate\n";
    }
} catch (Exception $e) {
    echo "✗ Error checking schema: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 2: Check if user_schedules table exists
echo "Test 2: Checking user_schedules table...\n";
try {
    $tables = DB::select("SHOW TABLES LIKE 'user_schedules'");
    if (count($tables) > 0) {
        echo "✓ user_schedules table exists\n";
    } else {
        echo "✗ user_schedules table NOT FOUND\n";
        echo "  Run: php artisan migrate\n";
    }
} catch (Exception $e) {
    echo "✗ Error checking table: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 3: Try to find a user
echo "Test 3: Finding test user...\n";
$user = User::first();
if ($user) {
    echo "✓ Found user: {$user->name} (ID: {$user->id})\n";
    echo "  Email: {$user->email}\n";
    echo "  Schedule initialized: " . ($user->schedule_initialized ? 'Yes' : 'No') . "\n";
} else {
    echo "✗ No users found in database\n";
    echo "  Create a user first\n";
    exit(1);
}

echo "\n";

// Test 4: Try to save a test schedule
echo "Test 4: Attempting to save test schedule...\n";
try {
    DB::beginTransaction();
    
    // Delete existing schedules
    UserSchedule::where('user_id', $user->id)->delete();
    echo "  Deleted existing schedules\n";
    
    // Create test schedule
    $testSchedule = [
        [
            'user_id' => $user->id,
            'day' => 'Monday',
            'start_time' => '09:00',
            'end_time' => '10:00',
            'description' => 'Test Class',
            'created_at' => now(),
            'updated_at' => now()
        ]
    ];
    
    UserSchedule::insert($testSchedule);
    echo "  Inserted test schedule\n";
    
    // Update user
    $user->schedule_initialized = true;
    $user->save();
    echo "  Updated user schedule_initialized\n";
    
    DB::commit();
    echo "✓ Test schedule saved successfully!\n";
    
    // Verify
    $savedSchedules = UserSchedule::where('user_id', $user->id)->get();
    echo "  Verified: {$savedSchedules->count()} schedule(s) in database\n";
    
} catch (Exception $e) {
    DB::rollBack();
    echo "✗ Failed to save test schedule\n";
    echo "  Error: " . $e->getMessage() . "\n";
    echo "  File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n";

// Test 5: Check validation
echo "Test 5: Testing time validation...\n";
$testTimes = [
    ['09:00', '10:00', true],
    ['14:30', '15:45', true],
    ['10:00', '09:00', false], // Invalid: start after end
    ['09:00', '09:00', false], // Invalid: same time
];

foreach ($testTimes as [$start, $end, $shouldPass]) {
    $result = $start < $end ? 'Valid' : 'Invalid';
    $expected = $shouldPass ? 'Valid' : 'Invalid';
    $status = $result === $expected ? '✓' : '✗';
    echo "  {$status} {$start} - {$end}: {$result}\n";
}

echo "\n=== Test Complete ===\n";
