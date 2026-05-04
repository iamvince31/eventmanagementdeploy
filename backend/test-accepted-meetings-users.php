<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== CHECKING ACCEPTED MEETINGS USERS ===\n\n";

$now = new DateTime();
$currentYear = (int)$now->format('Y');
$currentMonth = (int)$now->format('m');

if ($currentMonth >= 2 && $currentMonth <= 6) {
    $start = "{$currentYear}-02-01";
    $end = "{$currentYear}-06-30";
} else {
    $start = "2026-02-01";
    $end = "2026-06-30";
}

echo "Date Range: $start to $end\n\n";

// Get accepted meetings with user details
$acceptedMeetings = DB::table('event_user')
    ->join('events', 'event_user.event_id', '=', 'events.id')
    ->join('users', 'event_user.user_id', '=', 'users.id')
    ->where('event_user.status', 'accepted')
    ->where('events.event_type', 'meeting')
    ->where('events.is_personal', false)
    ->where('events.date', '>=', $start)
    ->where('events.date', '<=', $end)
    ->select(
        'events.title as event_title',
        'events.date',
        'users.name as user_name',
        'users.email',
        'users.department',
        'users.role'
    )
    ->get();

echo "Accepted meetings in current semester:\n";
echo "Total: " . $acceptedMeetings->count() . "\n\n";

foreach ($acceptedMeetings as $meeting) {
    echo "Event: {$meeting->event_title}\n";
    echo "Date: {$meeting->date}\n";
    echo "User: {$meeting->user_name} ({$meeting->email})\n";
    echo "Department: " . ($meeting->department ?? 'NULL') . "\n";
    echo "Role: {$meeting->role}\n";
    echo "---\n\n";
}

// Check all meetings in semester with their host departments
echo "\n=== MEETINGS IN CURRENT SEMESTER ===\n";
$meetings = DB::table('events')
    ->leftJoin('users', 'events.host_id', '=', 'users.id')
    ->where('events.event_type', 'meeting')
    ->where('events.is_personal', false)
    ->where('events.date', '>=', $start)
    ->where('events.date', '<=', $end)
    ->select(
        'events.id',
        'events.title',
        'events.date',
        'users.name as host_name',
        'users.department as host_department'
    )
    ->get();

echo "Total meetings: " . $meetings->count() . "\n\n";
foreach ($meetings as $meeting) {
    echo "Meeting: {$meeting->title}\n";
    echo "Date: {$meeting->date}\n";
    echo "Host: {$meeting->host_name}\n";
    echo "Host Department: " . ($meeting->host_department ?? 'NULL') . "\n";
    
    // Count responses for this meeting
    $responses = DB::table('event_user')
        ->where('event_id', $meeting->id)
        ->select('status', DB::raw('count(*) as count'))
        ->groupBy('status')
        ->get();
    
    echo "Responses: ";
    foreach ($responses as $resp) {
        echo "{$resp->status}={$resp->count} ";
    }
    echo "\n---\n\n";
}

echo "\n=== TEST COMPLETE ===\n";
