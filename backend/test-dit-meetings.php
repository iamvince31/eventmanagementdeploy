<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== DEPARTMENT OF INFORMATION TECHNOLOGY MEETINGS ===\n\n";

$department = 'Department of Information Technology';

// Current semester
$start = "2026-02-01";
$end = "2026-06-30";

echo "Checking for: $department\n";
echo "Date Range: $start to $end\n\n";

// Check all users in this department
echo "1. Users in Department of Information Technology:\n";
$users = DB::table('users')
    ->where('department', $department)
    ->select('id', 'name', 'email', 'role')
    ->get();

echo "Total users: " . $users->count() . "\n";
foreach ($users as $user) {
    echo "  - {$user->name} ({$user->email}) - {$user->role}\n";
}

// Check their meeting responses
echo "\n2. Meeting responses from DIT users (current semester):\n";
$responses = DB::table('event_user')
    ->join('events', 'event_user.event_id', '=', 'events.id')
    ->join('users', 'event_user.user_id', '=', 'users.id')
    ->where('users.department', $department)
    ->where('events.event_type', 'meeting')
    ->where('events.is_personal', false)
    ->where('events.date', '>=', $start)
    ->where('events.date', '<=', $end)
    ->select(
        'events.title',
        'events.date',
        'users.name as user_name',
        'event_user.status'
    )
    ->get();

echo "Total responses: " . $responses->count() . "\n\n";

$statusCounts = [
    'accepted' => 0,
    'rejected' => 0,
    'pending' => 0
];

foreach ($responses as $response) {
    echo "  Meeting: {$response->title}\n";
    echo "  Date: {$response->date}\n";
    echo "  User: {$response->user_name}\n";
    echo "  Status: {$response->status}\n";
    echo "  ---\n";
    
    if (isset($statusCounts[$response->status])) {
        $statusCounts[$response->status]++;
    }
}

echo "\nStatus Summary:\n";
echo "  Accepted: {$statusCounts['accepted']}\n";
echo "  Rejected: {$statusCounts['rejected']}\n";
echo "  Pending: {$statusCounts['pending']}\n";

// Check using the exact analytics query
echo "\n3. Using exact analytics query:\n";
$accepted = DB::table('event_user')
    ->join('events', 'event_user.event_id', '=', 'events.id')
    ->join('users', 'event_user.user_id', '=', 'users.id')
    ->where('users.department', $department)
    ->where('event_user.status', 'accepted')
    ->where('events.date', '>=', $start)
    ->where('events.date', '<=', $end)
    ->where('events.is_personal', false)
    ->where('events.event_type', 'meeting')
    ->count();
    
$rejected = DB::table('event_user')
    ->join('events', 'event_user.event_id', '=', 'events.id')
    ->join('users', 'event_user.user_id', '=', 'users.id')
    ->where('users.department', $department)
    ->where('event_user.status', 'rejected')
    ->where('events.date', '>=', $start)
    ->where('events.date', '<=', $end)
    ->where('events.is_personal', false)
    ->where('events.event_type', 'meeting')
    ->count();

echo "Analytics Query Results:\n";
echo "  Accepted: $accepted\n";
echo "  Rejected: $rejected\n";

// Check ALL meeting responses (not just current semester)
echo "\n4. ALL meeting responses from DIT users (any date):\n";
$allResponses = DB::table('event_user')
    ->join('events', 'event_user.event_id', '=', 'events.id')
    ->join('users', 'event_user.user_id', '=', 'users.id')
    ->where('users.department', $department)
    ->where('events.event_type', 'meeting')
    ->where('events.is_personal', false)
    ->select('event_user.status', DB::raw('count(*) as count'))
    ->groupBy('event_user.status')
    ->get();

foreach ($allResponses as $status) {
    echo "  {$status->status}: {$status->count}\n";
}

echo "\n=== TEST COMPLETE ===\n";
