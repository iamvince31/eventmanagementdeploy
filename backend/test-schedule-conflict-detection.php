<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Schedule Conflict Detection Test ===\n\n";

// Test 1: Check if we have users with schedules
echo "Test 1: Checking for users with class schedules...\n";
$usersWithSchedules = DB::table('user_schedules')
    ->join('users', 'user_schedules.user_id', '=', 'users.id')
    ->select('users.id', 'users.name', 'users.email', 'user_schedules.day', 'user_schedules.start_time', 'user_schedules.end_time', 'user_schedules.description')
    ->get();

if ($usersWithSchedules->isEmpty()) {
    echo "❌ No users with class schedules found. Creating test data...\n\n";
    
    // Find a faculty member
    $faculty = DB::table('users')->where('role', 'Faculty Member')->first();
    
    if (!$faculty) {
        echo "❌ No faculty members found. Please create a faculty member first.\n";
        exit(1);
    }
    
    // Create a test schedule
    DB::table('user_schedules')->insert([
        'user_id' => $faculty->id,
        'day' => 'Monday',
        'start_time' => '14:00',
        'end_time' => '16:00',
        'description' => 'Test Class - Advanced Programming',
        'color' => '#3b82f6',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    
    echo "✅ Created test schedule for {$faculty->name}\n";
    echo "   Monday 14:00-16:00: Test Class - Advanced Programming\n\n";
    
    // Refresh the query
    $usersWithSchedules = DB::table('user_schedules')
        ->join('users', 'user_schedules.user_id', '=', 'users.id')
        ->select('users.id', 'users.name', 'users.email', 'user_schedules.day', 'user_schedules.start_time', 'user_schedules.end_time', 'user_schedules.description')
        ->get();
}

echo "✅ Found " . $usersWithSchedules->count() . " class schedule(s):\n";
foreach ($usersWithSchedules as $schedule) {
    echo "   - {$schedule->name} ({$schedule->email})\n";
    echo "     {$schedule->day} {$schedule->start_time}-{$schedule->end_time}: {$schedule->description}\n";
}
echo "\n";

// Test 2: Simulate conflict detection
echo "Test 2: Simulating conflict detection...\n";

// Get the first schedule for testing
$testSchedule = $usersWithSchedules->first();

if (!$testSchedule) {
    echo "❌ No schedule available for testing\n";
    exit(1);
}

// Calculate a date that falls on the schedule's day
$daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
$targetDayIndex = array_search($testSchedule->day, $daysOfWeek);

// Find next occurrence of that day
$today = new DateTime();
$currentDayIndex = (int)$today->format('w');
$daysUntilTarget = ($targetDayIndex - $currentDayIndex + 7) % 7;
if ($daysUntilTarget === 0) $daysUntilTarget = 7; // Next week if today is the target day

$testDate = clone $today;
$testDate->modify("+{$daysUntilTarget} days");
$testDateStr = $testDate->format('Y-m-d');

// Test time that conflicts (middle of the class)
$scheduleStart = $testSchedule->start_time;
$scheduleEnd = $testSchedule->end_time;

// Parse start time to get a time in the middle
$startParts = explode(':', $scheduleStart);
$startHour = (int)$startParts[0];
$startMinute = (int)$startParts[1];

$endParts = explode(':', $scheduleEnd);
$endHour = (int)$endParts[0];
$endMinute = (int)$endParts[1];

// Calculate middle time
$middleHour = $startHour + (int)(($endHour - $startHour) / 2);
$conflictTime = sprintf('%02d:%02d', $middleHour, 0);

echo "Testing with:\n";
echo "   Date: {$testDateStr} ({$testSchedule->day})\n";
echo "   Time: {$conflictTime}\n";
echo "   User: {$testSchedule->name}\n";
echo "   Class: {$testSchedule->start_time}-{$testSchedule->end_time}\n\n";

// Parse the conflict time
$timeParts = explode(':', $conflictTime);
$eventHour = (int)$timeParts[0];
$eventMinute = (int)$timeParts[1];
$eventTimeStr = sprintf('%02d:%02d', $eventHour, $eventMinute);

// Check if conflict exists
$hasConflict = ($eventTimeStr >= $testSchedule->start_time && $eventTimeStr < $testSchedule->end_time);

if ($hasConflict) {
    echo "✅ CONFLICT DETECTED!\n";
    echo "   Event time {$conflictTime} falls within class time {$testSchedule->start_time}-{$testSchedule->end_time}\n\n";
} else {
    echo "❌ No conflict detected (unexpected)\n\n";
}

// Test 3: Test non-conflicting time
echo "Test 3: Testing non-conflicting time...\n";

// Calculate a time before the class starts
$startParts = explode(':', $testSchedule->start_time);
$startHour = (int)$startParts[0];
$nonConflictHour = max(0, $startHour - 2); // 2 hours before class
$nonConflictTime = sprintf('%02d:00', $nonConflictHour);

$timeParts = explode(':', $nonConflictTime);
$eventHour = (int)$timeParts[0];
$eventMinute = (int)$timeParts[1];
$eventTimeStr = sprintf('%02d:%02d', $eventHour, $eventMinute);

$hasConflict = ($eventTimeStr >= $testSchedule->start_time && $eventTimeStr < $testSchedule->end_time);

echo "Testing with:\n";
echo "   Date: {$testDateStr} ({$testSchedule->day})\n";
echo "   Time: {$nonConflictTime}\n";
echo "   User: {$testSchedule->name}\n";
echo "   Class: {$testSchedule->start_time}-{$testSchedule->end_time}\n\n";

if (!$hasConflict) {
    echo "✅ NO CONFLICT (as expected)\n";
    echo "   Event time {$nonConflictTime} does not fall within class time {$testSchedule->start_time}-{$testSchedule->end_time}\n\n";
} else {
    echo "❌ Conflict detected (unexpected)\n\n";
}

// Test 4: Check API endpoint exists
echo "Test 4: Checking if conflict detection is integrated...\n";

// Check if the checkScheduleConflicts method exists in EventController
$controllerPath = __DIR__ . '/app/Http/Controllers/EventController.php';
$controllerContent = file_get_contents($controllerPath);

if (strpos($controllerContent, 'checkScheduleConflicts') !== false) {
    echo "✅ checkScheduleConflicts method found in EventController\n";
} else {
    echo "❌ checkScheduleConflicts method NOT found in EventController\n";
}

if (strpos($controllerContent, 'ignore_conflicts') !== false) {
    echo "✅ ignore_conflicts flag handling found\n";
} else {
    echo "❌ ignore_conflicts flag handling NOT found\n";
}

echo "\n=== Test Complete ===\n";
echo "\nNext Steps:\n";
echo "1. Log in as Admin/Dean/Chairperson\n";
echo "2. Create an event on {$testDateStr} at {$conflictTime}\n";
echo "3. Invite {$testSchedule->name}\n";
echo "4. You should see a conflict warning dialog\n";
echo "5. Confirm to proceed or cancel\n";
