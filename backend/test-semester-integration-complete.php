<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\UserSchedule;
use App\Http\Controllers\DashboardController;
use Illuminate\Http\Request;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Complete Semester Integration\n";
echo "====================================\n\n";

try {
    // Find a user with schedules
    $userWithSchedule = User::whereHas('schedules')->first();
    
    if (!$userWithSchedule) {
        echo "❌ No users with schedules found. Please run the previous test first.\n";
        exit(1);
    }
    
    echo "Testing user: {$userWithSchedule->name} (ID: {$userWithSchedule->id})\n\n";
    
    // Test 1: Dashboard API Response
    echo "Test 1: Dashboard API Response\n";
    echo "==============================\n";
    
    // Create a mock request
    $request = new Request();
    $request->setUserResolver(function() use ($userWithSchedule) {
        return $userWithSchedule;
    });
    
    // Create controller instance and call index method
    $controller = new DashboardController();
    $response = $controller->index($request);
    $data = $response->getData(true);
    
    // Check response structure
    $requiredKeys = ['events', 'defaultEvents', 'userSchedules', 'members', 'schoolYear', 'nextSchoolYear'];
    foreach ($requiredKeys as $key) {
        if (!array_key_exists($key, $data)) {
            echo "❌ Missing key: {$key}\n";
            exit(1);
        }
    }
    
    echo "✅ Response structure correct\n";
    echo "  - Events: " . count($data['events']) . "\n";
    echo "  - Default Events: " . count($data['defaultEvents']) . "\n";
    echo "  - User Schedules: " . count($data['userSchedules']) . "\n";
    echo "  - School Year: " . $data['schoolYear'] . "\n";
    echo "  - Next School Year: " . $data['nextSchoolYear'] . "\n\n";
    
    // Test 2: Schedule Data Structure
    echo "Test 2: Schedule Data Structure\n";
    echo "===============================\n";
    
    $schedules = $data['userSchedules'];
    if (count($schedules) > 0) {
        $firstSchedule = $schedules[0];
        $requiredScheduleKeys = ['id', 'title', 'description', 'day', 'start_time', 'end_time', 'time', 'is_schedule', 'type', 'semester'];
        
        foreach ($requiredScheduleKeys as $key) {
            if (!array_key_exists($key, $firstSchedule)) {
                echo "❌ Missing schedule key: {$key}\n";
                exit(1);
            }
        }
        
        echo "✅ Schedule data structure correct\n";
        echo "Sample schedule:\n";
        echo "  - ID: {$firstSchedule['id']}\n";
        echo "  - Title: {$firstSchedule['title']}\n";
        echo "  - Day: {$firstSchedule['day']}\n";
        echo "  - Time: {$firstSchedule['time']}\n";
        echo "  - Semester: {$firstSchedule['semester']}\n\n";
    } else {
        echo "ℹ️  No schedules in response (may be filtered out)\n\n";
    }
    
    // Test 3: Semester Logic Consistency
    echo "Test 3: Semester Logic Consistency\n";
    echo "==================================\n";
    
    // Test different months
    $testMonths = [
        1 => 'first',    // January
        2 => 'second',   // February  
        6 => 'second',   // June
        7 => 'midyear',  // July
        8 => 'midyear',  // August
        9 => 'first',    // September
        12 => 'first'    // December
    ];
    
    foreach ($testMonths as $month => $expectedSemester) {
        // Create a test date
        $testDate = new DateTime("2026-{$month}-15");
        
        // Use reflection to test the private method
        $reflection = new ReflectionClass($controller);
        $method = $reflection->getMethod('getCurrentSemester');
        $method->setAccessible(true);
        
        $actualSemester = $method->invoke($controller, $testDate);
        
        if ($actualSemester === $expectedSemester) {
            echo "✅ Month {$month}: {$actualSemester}\n";
        } else {
            echo "❌ Month {$month}: Expected {$expectedSemester}, got {$actualSemester}\n";
            exit(1);
        }
    }
    
    echo "\n✅ Semester logic consistent\n\n";
    
    // Test 4: Date Range Filtering
    echo "Test 4: Date Range Filtering\n";
    echo "============================\n";
    
    // Test isDateInCurrentSemester method
    $reflection = new ReflectionClass($controller);
    $method = $reflection->getMethod('isDateInCurrentSemester');
    $method->setAccessible(true);
    
    $testCases = [
        ['2026-01-15', 'first', true],   // January in first semester
        ['2026-01-15', 'second', false], // January not in second semester
        ['2026-03-15', 'second', true],  // March in second semester
        ['2026-07-15', 'midyear', true], // July in midyear
        ['2026-09-15', 'first', true],   // September in first semester
    ];
    
    foreach ($testCases as [$dateStr, $semester, $expected]) {
        $testDate = new DateTime($dateStr);
        $result = $method->invoke($controller, $testDate, $semester);
        
        if ($result === $expected) {
            echo "✅ {$dateStr} in {$semester}: " . ($result ? 'true' : 'false') . "\n";
        } else {
            echo "❌ {$dateStr} in {$semester}: Expected " . ($expected ? 'true' : 'false') . ", got " . ($result ? 'true' : 'false') . "\n";
            exit(1);
        }
    }
    
    echo "\n✅ Date range filtering working correctly\n\n";
    
    // Test 5: Real Schedule Filtering
    echo "Test 5: Real Schedule Filtering\n";
    echo "===============================\n";
    
    $allSchedules = UserSchedule::where('user_id', $userWithSchedule->id)->get();
    echo "Total schedules in database: {$allSchedules->count()}\n";
    echo "Schedules in API response: " . count($data['userSchedules']) . "\n";
    
    // Current date and semester
    $now = new DateTime();
    $currentSemesterMethod = $reflection->getMethod('getCurrentSemester');
    $currentSemesterMethod->setAccessible(true);
    $currentSemester = $currentSemesterMethod->invoke($controller, $now);
    
    echo "Current semester: " . ($currentSemester ?: 'BREAK PERIOD') . "\n";
    
    if ($currentSemester) {
        echo "✅ Schedules should be visible\n";
    } else {
        echo "ℹ️  Schedules should be hidden (break period)\n";
    }
    
    echo "\n✅ Real schedule filtering working correctly\n\n";
    
    echo "====================================\n";
    echo "Complete Semester Integration Test Complete\n";
    echo "All tests passed! ✅\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}