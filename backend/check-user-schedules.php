<?php

/**
 * Check User Schedules from Database
 * 
 * This script directly queries the database to check:
 * 1. All users and their schedule_initialized status
 * 2. All schedule entries in user_schedules table
 * 3. Schedules grouped by user
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "===========================================\n";
echo "USER SCHEDULES DATABASE CHECK\n";
echo "===========================================\n\n";

// Check database connection
try {
    DB::connection()->getPdo();
    echo "✓ Database connection successful\n\n";
} catch (\Exception $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// 1. Check all users and their schedule_initialized status
echo "-------------------------------------------\n";
echo "1. USERS AND SCHEDULE STATUS\n";
echo "-------------------------------------------\n";

$users = DB::table('users')
    ->select('id', 'username', 'email', 'schedule_initialized', 'created_at')
    ->orderBy('id')
    ->get();

if ($users->isEmpty()) {
    echo "No users found in database.\n\n";
} else {
    echo "Total users: " . $users->count() . "\n\n";
    
    foreach ($users as $user) {
        $status = $user->schedule_initialized ? '✓ YES' : '✗ NO';
        echo "User ID: {$user->id}\n";
        echo "  Username: {$user->username}\n";
        echo "  Email: {$user->email}\n";
        echo "  Schedule Initialized: {$status}\n";
        echo "  Created: {$user->created_at}\n";
        echo "\n";
    }
}

// 2. Check all schedule entries
echo "-------------------------------------------\n";
echo "2. ALL SCHEDULE ENTRIES\n";
echo "-------------------------------------------\n";

$schedules = DB::table('user_schedules')
    ->select('id', 'user_id', 'day', 'start_time', 'end_time', 'description', 'created_at')
    ->orderBy('user_id')
    ->orderBy('day')
    ->orderBy('start_time')
    ->get();

if ($schedules->isEmpty()) {
    echo "No schedules found in database.\n\n";
} else {
    echo "Total schedule entries: " . $schedules->count() . "\n\n";
    
    foreach ($schedules as $schedule) {
        echo "Schedule ID: {$schedule->id}\n";
        echo "  User ID: {$schedule->user_id}\n";
        echo "  Day: {$schedule->day}\n";
        echo "  Time: {$schedule->start_time} - {$schedule->end_time}\n";
        echo "  Description: " . ($schedule->description ?: '(no description)') . "\n";
        echo "  Created: {$schedule->created_at}\n";
        echo "\n";
    }
}

// 3. Check schedules grouped by user
echo "-------------------------------------------\n";
echo "3. SCHEDULES GROUPED BY USER\n";
echo "-------------------------------------------\n";

$usersWithSchedules = DB::table('users')
    ->leftJoin('user_schedules', 'users.id', '=', 'user_schedules.user_id')
    ->select(
        'users.id',
        'users.username',
        'users.email',
        'users.schedule_initialized',
        DB::raw('COUNT(user_schedules.id) as schedule_count')
    )
    ->groupBy('users.id', 'users.username', 'users.email', 'users.schedule_initialized')
    ->orderBy('users.id')
    ->get();

foreach ($usersWithSchedules as $user) {
    echo "User: {$user->username} (ID: {$user->id})\n";
    echo "  Email: {$user->email}\n";
    echo "  Schedule Initialized: " . ($user->schedule_initialized ? 'YES' : 'NO') . "\n";
    echo "  Total Classes: {$user->schedule_count}\n";
    
    if ($user->schedule_count > 0) {
        // Get detailed schedule for this user
        $userSchedules = DB::table('user_schedules')
            ->where('user_id', $user->id)
            ->orderBy('day')
            ->orderBy('start_time')
            ->get();
        
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        $scheduleByDay = [];
        
        foreach ($userSchedules as $schedule) {
            if (!isset($scheduleByDay[$schedule->day])) {
                $scheduleByDay[$schedule->day] = [];
            }
            $scheduleByDay[$schedule->day][] = $schedule;
        }
        
        echo "  Weekly Schedule:\n";
        foreach ($days as $day) {
            if (isset($scheduleByDay[$day])) {
                echo "    {$day}:\n";
                foreach ($scheduleByDay[$day] as $class) {
                    $desc = $class->description ?: '(no description)';
                    echo "      • {$class->start_time} - {$class->end_time}: {$desc}\n";
                }
            }
        }
    } else {
        echo "  (No classes scheduled)\n";
    }
    echo "\n";
}

// 4. Check for data inconsistencies
echo "-------------------------------------------\n";
echo "4. DATA CONSISTENCY CHECK\n";
echo "-------------------------------------------\n";

// Users with schedule_initialized = true but no schedules
$inconsistent = DB::table('users')
    ->leftJoin('user_schedules', 'users.id', '=', 'user_schedules.user_id')
    ->select('users.id', 'users.username', 'users.schedule_initialized', DB::raw('COUNT(user_schedules.id) as schedule_count'))
    ->groupBy('users.id', 'users.username', 'users.schedule_initialized')
    ->havingRaw('users.schedule_initialized = 1 AND COUNT(user_schedules.id) = 0')
    ->get();

if ($inconsistent->isEmpty()) {
    echo "✓ No inconsistencies found\n";
} else {
    echo "⚠ Found {$inconsistent->count()} user(s) with schedule_initialized=true but no schedules:\n";
    foreach ($inconsistent as $user) {
        echo "  - User ID {$user->id}: {$user->username}\n";
    }
}

// Users with schedules but schedule_initialized = false
$inconsistent2 = DB::table('users')
    ->leftJoin('user_schedules', 'users.id', '=', 'user_schedules.user_id')
    ->select('users.id', 'users.username', 'users.schedule_initialized', DB::raw('COUNT(user_schedules.id) as schedule_count'))
    ->groupBy('users.id', 'users.username', 'users.schedule_initialized')
    ->havingRaw('users.schedule_initialized = 0 AND COUNT(user_schedules.id) > 0')
    ->get();

if (!$inconsistent2->isEmpty()) {
    echo "\n⚠ Found {$inconsistent2->count()} user(s) with schedules but schedule_initialized=false:\n";
    foreach ($inconsistent2 as $user) {
        echo "  - User ID {$user->id}: {$user->username} ({$user->schedule_count} classes)\n";
    }
}

echo "\n===========================================\n";
echo "CHECK COMPLETE\n";
echo "===========================================\n";
