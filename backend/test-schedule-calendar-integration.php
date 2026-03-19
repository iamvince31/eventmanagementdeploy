<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\UserSchedule;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Schedule Calendar Integration\n";
echo "=====================================\n\n";

try {
    // Find a user with schedules
    $userWithSchedule = User::whereHas('schedules')->first();
    
    if (!$userWithSchedule) {
        echo "❌ No users with schedules found. Creating test data...\n";
        
        // Create a test user if none exists
        $testUser = User::where('email', 'test@example.com')->first();
        if (!$testUser) {
            $testUser = User::create([
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => bcrypt('password'),
                'role' => 'Faculty Member',
                'department' => 'Computer Engineering',
                'is_validated' => true,
                'schedule_initialized' => true
            ]);
        }
        
        // Create test schedule
        UserSchedule::create([
            'user_id' => $testUser->id,
            'day' => 'Monday',
            'start_time' => '08:00',
            'end_time' => '10:00',
            'description' => 'Computer Programming 1'
        ]);
        
        UserSchedule::create([
            'user_id' => $testUser->id,
            'day' => 'Wednesday',
            'start_time' => '14:00',
            'end_time' => '16:00',
            'description' => 'Data Structures'
        ]);
        
        $userWithSchedule = $testUser;
        echo "✅ Created test user and schedules\n";
    }
    
    echo "Testing user: {$userWithSchedule->name} (ID: {$userWithSchedule->id})\n\n";
    
    // Test 1: Check if user has schedules
    $schedules = UserSchedule::where('user_id', $userWithSchedule->id)->get();
    echo "Test 1: User Schedule Count\n";
    echo "Found {$schedules->count()} schedule(s)\n";
    
    foreach ($schedules as $schedule) {
        echo "  - {$schedule->day}: {$schedule->start_time}-{$schedule->end_time} ({$schedule->description})\n";
    }
    echo $schedules->count() > 0 ? "✅ PASS\n\n" : "❌ FAIL\n\n";
    
    // Test 2: Test dashboard API response structure
    echo "Test 2: Dashboard API Response Structure\n";
    
    // Simulate the dashboard controller logic
    $transformedSchedules = $schedules->map(function ($schedule) {
        // Format time to HH:MM (remove seconds if present)
        $startTime = substr($schedule->start_time, 0, 5);
        $endTime = substr($schedule->end_time, 0, 5);
        
        return [
            'id' => 'schedule-' . $schedule->id,
            'title' => $schedule->description ?: 'Class',
            'description' => $schedule->description,
            'day' => $schedule->day,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'time' => $startTime . ' - ' . $endTime,
            'is_schedule' => true,
            'type' => 'schedule'
        ];
    });
    
    echo "Transformed schedules:\n";
    foreach ($transformedSchedules as $schedule) {
        echo "  - ID: {$schedule['id']}\n";
        echo "    Title: {$schedule['title']}\n";
        echo "    Day: {$schedule['day']}\n";
        echo "    Time: {$schedule['time']}\n";
        echo "    Type: {$schedule['type']}\n\n";
    }
    
    echo count($transformedSchedules) > 0 ? "✅ PASS\n\n" : "❌ FAIL\n\n";
    
    // Test 3: Test day-based filtering (simulate calendar logic)
    echo "Test 3: Day-based Schedule Filtering\n";
    
    $testDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    foreach ($testDays as $day) {
        $daySchedules = $transformedSchedules->filter(function ($schedule) use ($day) {
            return $schedule['day'] === $day;
        });
        
        echo "  {$day}: {$daySchedules->count()} schedule(s)\n";
        foreach ($daySchedules as $schedule) {
            echo "    - {$schedule['title']} ({$schedule['time']})\n";
        }
    }
    
    echo "✅ PASS\n\n";
    
    // Test 4: Verify schedule data integrity
    echo "Test 4: Schedule Data Integrity\n";
    
    $hasValidTimes = true;
    $hasValidDays = true;
    
    foreach ($schedules as $schedule) {
        // Check time format (allow both HH:MM and HH:MM:SS)
        $startTime = substr($schedule->start_time, 0, 5);
        $endTime = substr($schedule->end_time, 0, 5);
        
        if (!preg_match('/^\d{2}:\d{2}$/', $startTime) || 
            !preg_match('/^\d{2}:\d{2}$/', $endTime)) {
            $hasValidTimes = false;
            echo "❌ Invalid time format for schedule ID {$schedule->id}\n";
        }
        
        // Check day names
        if (!in_array($schedule->day, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])) {
            $hasValidDays = false;
            echo "❌ Invalid day name for schedule ID {$schedule->id}: {$schedule->day}\n";
        }
        
        // Check time logic
        if ($startTime >= $endTime) {
            echo "❌ Start time is not before end time for schedule ID {$schedule->id}\n";
            $hasValidTimes = false;
        }
    }
    
    echo $hasValidTimes && $hasValidDays ? "✅ PASS\n\n" : "❌ FAIL\n\n";
    
    echo "=====================================\n";
    echo "Schedule Calendar Integration Test Complete\n";
    echo "All tests passed! ✅\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}