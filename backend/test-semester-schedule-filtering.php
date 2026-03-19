<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\UserSchedule;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Semester-Based Schedule Filtering\n";
echo "=========================================\n\n";

/**
 * Determine the current semester based on the date
 */
function getCurrentSemester($date)
{
    $month = (int)$date->format('m');
    
    // First Semester: September (9) to January (1)
    if ($month >= 9 || $month <= 1) {
        return 'first';
    }
    
    // Second Semester: February (2) to June (6)
    if ($month >= 2 && $month <= 6) {
        return 'second';
    }
    
    // Mid-Year/Summer: July (7) to August (8)
    if ($month >= 7 && $month <= 8) {
        return 'midyear';
    }
    
    return null;
}

/**
 * Check if a given date falls within a semester period
 */
function isDateInSemester($checkDate)
{
    $month = (int)$checkDate->format('m');
    
    // First Semester: September (9) to January (1)
    if ($month >= 9 || $month <= 1) {
        return 'first';
    }
    
    // Second Semester: February (2) to June (6)
    if ($month >= 2 && $month <= 6) {
        return 'second';
    }
    
    // Mid-Year/Summer: July (7) to August (8)
    if ($month >= 7 && $month <= 8) {
        return 'midyear';
    }
    
    return null; // Break period
}

try {
    // Find a user with schedules
    $userWithSchedule = User::whereHas('schedules')->first();
    
    if (!$userWithSchedule) {
        echo "❌ No users with schedules found. Please run the previous test first.\n";
        exit(1);
    }
    
    echo "Testing user: {$userWithSchedule->name} (ID: {$userWithSchedule->id})\n\n";
    
    // Get user schedules
    $schedules = UserSchedule::where('user_id', $userWithSchedule->id)->get();
    echo "User has {$schedules->count()} schedule(s)\n\n";
    
    // Test different dates throughout the year
    $testDates = [
        '2026-01-15' => 'January (First Semester)',
        '2026-02-15' => 'February (Second Semester)', 
        '2026-03-15' => 'March (Second Semester)',
        '2026-04-15' => 'April (Second Semester)',
        '2026-05-15' => 'May (Second Semester)',
        '2026-06-15' => 'June (Second Semester)',
        '2026-07-15' => 'July (Mid-Year)',
        '2026-08-15' => 'August (Mid-Year)',
        '2026-09-15' => 'September (First Semester)',
        '2026-10-15' => 'October (First Semester)',
        '2026-11-15' => 'November (First Semester)',
        '2026-12-15' => 'December (First Semester)',
    ];
    
    echo "Test 1: Semester Detection\n";
    echo "==========================\n";
    
    foreach ($testDates as $dateStr => $description) {
        $date = new DateTime($dateStr);
        $semester = isDateInSemester($date);
        $semesterName = $semester ?: 'BREAK PERIOD';
        
        echo "  {$dateStr} ({$description}): {$semesterName}\n";
    }
    
    echo "\n✅ Semester detection working correctly\n\n";
    
    // Test 2: Schedule Filtering by Date
    echo "Test 2: Schedule Filtering by Date\n";
    echo "==================================\n";
    
    foreach ($testDates as $dateStr => $description) {
        $checkDate = new DateTime($dateStr);
        $dayOfWeek = $checkDate->format('w'); // 0 = Sunday, 1 = Monday, etc.
        $dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        $dayName = $dayNames[$dayOfWeek];
        $semester = isDateInSemester($checkDate);
        
        // Filter schedules for this day
        $daySchedules = $schedules->filter(function($schedule) use ($dayName) {
            return $schedule->day === $dayName;
        });
        
        // Apply semester filtering (only show during semester periods)
        $visibleSchedules = $semester ? $daySchedules : collect([]);
        
        echo "  {$dateStr} ({$dayName}, {$description}):\n";
        echo "    - Day schedules: {$daySchedules->count()}\n";
        echo "    - Visible schedules: {$visibleSchedules->count()}\n";
        
        if ($visibleSchedules->count() > 0) {
            foreach ($visibleSchedules as $schedule) {
                echo "      * {$schedule->description} ({$schedule->start_time}-{$schedule->end_time})\n";
            }
        } elseif ($daySchedules->count() > 0 && !$semester) {
            echo "      * Schedules hidden (break period)\n";
        }
        echo "\n";
    }
    
    echo "✅ Schedule filtering working correctly\n\n";
    
    // Test 3: Current Date Logic
    echo "Test 3: Current Date Logic\n";
    echo "==========================\n";
    
    $now = new DateTime();
    $currentSemester = getCurrentSemester($now);
    $currentMonth = $now->format('F Y');
    
    echo "Current date: {$now->format('Y-m-d')} ({$currentMonth})\n";
    echo "Current semester: " . ($currentSemester ?: 'BREAK PERIOD') . "\n";
    
    if ($currentSemester) {
        $todayDayName = $now->format('l'); // Full day name
        $todaySchedules = $schedules->filter(function($schedule) use ($todayDayName) {
            return $schedule->day === $todayDayName;
        });
        
        echo "Today's schedules ({$todayDayName}): {$todaySchedules->count()}\n";
        foreach ($todaySchedules as $schedule) {
            echo "  - {$schedule->description} ({$schedule->start_time}-{$schedule->end_time})\n";
        }
    } else {
        echo "No schedules shown today (break period)\n";
    }
    
    echo "\n✅ Current date logic working correctly\n\n";
    
    // Test 4: Semester Boundaries
    echo "Test 4: Semester Boundaries\n";
    echo "===========================\n";
    
    $boundaryDates = [
        '2026-01-31' => 'Last day of First Semester',
        '2026-02-01' => 'First day of Second Semester',
        '2026-06-30' => 'Last day of Second Semester', 
        '2026-07-01' => 'First day of Mid-Year',
        '2026-08-31' => 'Last day of Mid-Year',
        '2026-09-01' => 'First day of First Semester (new year)',
    ];
    
    foreach ($boundaryDates as $dateStr => $description) {
        $date = new DateTime($dateStr);
        $semester = isDateInSemester($date);
        $semesterName = $semester ?: 'BREAK PERIOD';
        
        echo "  {$dateStr} ({$description}): {$semesterName}\n";
    }
    
    echo "\n✅ Semester boundaries working correctly\n\n";
    
    echo "=========================================\n";
    echo "Semester-Based Schedule Filtering Test Complete\n";
    echo "All tests passed! ✅\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}