<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\UserSchedule;

echo "=== Testing Schedule Color System ===\n\n";

// Find a test user
$user = User::where('email', 'like', '%@%')->first();

if (!$user) {
    echo "❌ No users found in database\n";
    exit(1);
}

echo "✓ Testing with user: {$user->username} ({$user->email})\n\n";

// Check existing schedules
$existingSchedules = UserSchedule::where('user_id', $user->id)->get();
echo "Current schedules: " . $existingSchedules->count() . "\n";

if ($existingSchedules->count() > 0) {
    echo "\nSchedule Details:\n";
    echo str_repeat("-", 80) . "\n";
    printf("%-10s %-15s %-15s %-30s %-10s\n", "Day", "Start Time", "End Time", "Description", "Color");
    echo str_repeat("-", 80) . "\n";
    
    foreach ($existingSchedules as $schedule) {
        printf(
            "%-10s %-15s %-15s %-30s %-10s\n",
            $schedule->day,
            $schedule->start_time,
            $schedule->end_time,
            substr($schedule->description, 0, 28),
            $schedule->color ?? 'NULL'
        );
    }
    echo str_repeat("-", 80) . "\n";
    
    // Check if any schedules are missing colors
    $missingColors = $existingSchedules->filter(function($schedule) {
        return empty($schedule->color);
    });
    
    if ($missingColors->count() > 0) {
        echo "\n⚠️  Found {$missingColors->count()} schedules without colors\n";
        echo "These will be assigned colors automatically on next save\n";
    } else {
        echo "\n✓ All schedules have colors assigned!\n";
    }
    
    // Show color distribution
    $colorCounts = [];
    foreach ($existingSchedules as $schedule) {
        $color = $schedule->color ?? 'NULL';
        $colorCounts[$color] = ($colorCounts[$color] ?? 0) + 1;
    }
    
    echo "\nColor Distribution:\n";
    foreach ($colorCounts as $color => $count) {
        echo "  $color: $count class(es)\n";
    }
}

echo "\n=== Test Complete ===\n";
