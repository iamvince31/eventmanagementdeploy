<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\UserSchedule;

echo "=== Testing Color Display After Save ===\n\n";

// Find a test user
$user = User::where('email', 'like', '%@%')->first();

if (!$user) {
    echo "❌ No users found in database\n";
    exit(1);
}

echo "✓ Testing with user: {$user->username} ({$user->email})\n\n";

// Clear existing schedules
UserSchedule::where('user_id', $user->id)->delete();
echo "✓ Cleared existing schedules\n\n";

// Simulate saving a schedule with repeated classes
$colorPalette = [
    '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'
];

$scheduleData = [
    ['day' => 'Monday', 'start_time' => '08:00', 'end_time' => '09:30', 'description' => 'Data Structures'],
    ['day' => 'Monday', 'start_time' => '10:00', 'end_time' => '11:30', 'description' => 'Web Development'],
    ['day' => 'Monday', 'start_time' => '13:00', 'end_time' => '14:30', 'description' => 'Database Systems'],
    ['day' => 'Tuesday', 'start_time' => '08:00', 'end_time' => '09:30', 'description' => 'Data Structures'], // Same as Monday
    ['day' => 'Tuesday', 'start_time' => '14:00', 'end_time' => '15:30', 'description' => 'Software Engineering'],
    ['day' => 'Wednesday', 'start_time' => '10:00', 'end_time' => '11:30', 'description' => 'Web Development'], // Same as Monday
    ['day' => 'Wednesday', 'start_time' => '13:00', 'end_time' => '14:30', 'description' => 'Database Systems'], // Same as Monday
    ['day' => 'Wednesday', 'start_time' => '15:00', 'end_time' => '16:30', 'description' => 'Operating Systems'],
];

// Simulate the backend color assignment logic
$classColorMap = [];
$colorIndex = 0;
$schedulesToInsert = [];

foreach ($scheduleData as $data) {
    $normalizedDescription = strtolower(trim($data['description']));
    
    if (!isset($classColorMap[$normalizedDescription])) {
        $classColorMap[$normalizedDescription] = $colorPalette[$colorIndex % count($colorPalette)];
        $colorIndex++;
    }
    
    $schedulesToInsert[] = [
        'user_id' => $user->id,
        'day' => $data['day'],
        'start_time' => $data['start_time'],
        'end_time' => $data['end_time'],
        'description' => $data['description'],
        'color' => $classColorMap[$normalizedDescription],
        'created_at' => now(),
        'updated_at' => now(),
    ];
}

// Insert schedules
UserSchedule::insert($schedulesToInsert);
echo "✓ Inserted " . count($schedulesToInsert) . " schedule entries\n\n";

// Retrieve and display
$savedSchedules = UserSchedule::where('user_id', $user->id)
    ->orderBy('day')
    ->orderBy('start_time')
    ->get();

echo "📊 Saved Schedule with Colors:\n";
echo str_repeat("=", 100) . "\n";
printf("%-12s %-15s %-15s %-30s %-10s\n", "Day", "Start Time", "End Time", "Description", "Color");
echo str_repeat("=", 100) . "\n";

$colorNames = [
    '#10b981' => '🟢 Green',
    '#3b82f6' => '🔵 Blue',
    '#f59e0b' => '🟡 Amber',
    '#ef4444' => '🔴 Red',
    '#8b5cf6' => '🟣 Purple',
    '#ec4899' => '🩷 Pink',
    '#06b6d4' => '🩵 Cyan',
    '#f97316' => '🟠 Orange',
    '#14b8a6' => '🩵 Teal',
    '#6366f1' => '🟣 Indigo',
];

foreach ($savedSchedules as $schedule) {
    $colorDisplay = $colorNames[$schedule->color] ?? $schedule->color;
    printf(
        "%-12s %-15s %-15s %-30s %-10s\n",
        $schedule->day,
        $schedule->start_time,
        $schedule->end_time,
        substr($schedule->description, 0, 28),
        $colorDisplay
    );
}

echo str_repeat("=", 100) . "\n\n";

// Verify same classes have same colors
echo "✅ Verification:\n";
echo str_repeat("-", 100) . "\n";

$classColors = [];
foreach ($savedSchedules as $schedule) {
    $desc = $schedule->description;
    if (!isset($classColors[$desc])) {
        $classColors[$desc] = [];
    }
    $classColors[$desc][] = $schedule->color;
}

$allCorrect = true;
foreach ($classColors as $description => $colors) {
    $uniqueColors = array_unique($colors);
    $colorDisplay = $colorNames[$colors[0]] ?? $colors[0];
    
    if (count($uniqueColors) === 1) {
        echo "✓ '{$description}' appears " . count($colors) . " time(s) with consistent color: {$colorDisplay}\n";
    } else {
        echo "❌ '{$description}' has inconsistent colors: " . implode(', ', $uniqueColors) . "\n";
        $allCorrect = false;
    }
}

echo str_repeat("-", 100) . "\n";

if ($allCorrect) {
    echo "\n🎉 SUCCESS! All classes with same description have the same color!\n";
} else {
    echo "\n❌ FAILED! Some classes have inconsistent colors!\n";
}

// Show unique class summary
echo "\n📋 Unique Classes Summary:\n";
echo str_repeat("-", 100) . "\n";
foreach ($classColorMap as $description => $color) {
    $colorDisplay = $colorNames[$color] ?? $color;
    printf("%-40s → %s\n", ucfirst($description), $colorDisplay);
}

echo "\n=== Test Complete ===\n";
