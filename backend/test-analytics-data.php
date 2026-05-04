<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\User;

echo "=== ANALYTICS DATA TEST ===\n\n";

// Check if event_user table exists and has data
echo "1. Checking event_user table:\n";
$eventUserCount = DB::table('event_user')->count();
echo "   Total event_user records: $eventUserCount\n";

if ($eventUserCount > 0) {
    echo "\n   Sample event_user records:\n";
    $samples = DB::table('event_user')
        ->join('events', 'event_user.event_id', '=', 'events.id')
        ->join('users', 'event_user.user_id', '=', 'users.id')
        ->select(
            'event_user.id',
            'events.title',
            'events.event_type',
            'users.department',
            'event_user.status',
            'events.date'
        )
        ->limit(10)
        ->get();
    
    foreach ($samples as $sample) {
        echo "   - Event: {$sample->title} ({$sample->event_type})\n";
        echo "     Department: {$sample->department}\n";
        echo "     Status: {$sample->status}\n";
        echo "     Date: {$sample->date}\n\n";
    }
}

// Check meetings specifically
echo "\n2. Checking meetings with responses:\n";
$meetingsWithResponses = DB::table('event_user')
    ->join('events', 'event_user.event_id', '=', 'events.id')
    ->where('events.event_type', 'meeting')
    ->where('events.is_personal', false)
    ->count();
echo "   Total meeting responses: $meetingsWithResponses\n";

// Check accepted meetings by department
echo "\n3. Accepted meetings by department:\n";
$excludedDepartments = ['Administration', 'System Administration'];
$departments = User::select('department')
    ->whereNotNull('department')
    ->whereNotIn('department', $excludedDepartments)
    ->distinct()
    ->pluck('department');

foreach ($departments as $dept) {
    $accepted = DB::table('event_user')
        ->join('events', 'event_user.event_id', '=', 'events.id')
        ->join('users', 'event_user.user_id', '=', 'users.id')
        ->where('users.department', $dept)
        ->where('event_user.status', 'accepted')
        ->where('events.is_personal', false)
        ->where('events.event_type', 'meeting')
        ->count();
        
    $rejected = DB::table('event_user')
        ->join('events', 'event_user.event_id', '=', 'events.id')
        ->join('users', 'event_user.user_id', '=', 'users.id')
        ->where('users.department', $dept)
        ->where('event_user.status', 'rejected')
        ->where('events.is_personal', false)
        ->where('events.event_type', 'meeting')
        ->count();
    
    if ($accepted > 0 || $rejected > 0) {
        echo "   $dept:\n";
        echo "     Accepted: $accepted\n";
        echo "     Rejected: $rejected\n";
    }
}

// Check current semester date range
echo "\n4. Current semester info:\n";
$now = new DateTime();
$currentMonth = (int)$now->format('m');
$currentYear = (int)$now->format('Y');

if ($currentMonth >= 9 || $currentMonth <= 1) {
    $semester = 'first';
    if ($currentMonth >= 9) {
        $start = "{$currentYear}-09-01";
        $end = ($currentYear + 1) . "-01-31";
    } else {
        $start = ($currentYear - 1) . "-09-01";
        $end = "{$currentYear}-01-31";
    }
} elseif ($currentMonth >= 2 && $currentMonth <= 6) {
    $semester = 'second';
    $start = "{$currentYear}-02-01";
    $end = "{$currentYear}-06-30";
} else {
    $semester = 'midyear';
    $start = "{$currentYear}-07-01";
    $end = "{$currentYear}-08-31";
}

echo "   Semester: $semester\n";
echo "   Date range: $start to $end\n";

// Check meetings in current semester
echo "\n5. Meetings in current semester:\n";
$meetingsInSemester = DB::table('events')
    ->where('event_type', 'meeting')
    ->where('is_personal', false)
    ->where('date', '>=', $start)
    ->where('date', '<=', $end)
    ->count();
echo "   Total meetings: $meetingsInSemester\n";

$responsesInSemester = DB::table('event_user')
    ->join('events', 'event_user.event_id', '=', 'events.id')
    ->where('events.event_type', 'meeting')
    ->where('events.is_personal', false)
    ->where('events.date', '>=', $start)
    ->where('events.date', '<=', $end)
    ->count();
echo "   Total responses: $responsesInSemester\n";

echo "\n=== TEST COMPLETE ===\n";
