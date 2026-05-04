<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\User;

echo "=== ANALYTICS API DATA TEST ===\n\n";

// Simulate the analytics controller logic
$now = new DateTime();
$currentYear = (int)$now->format('Y');
$currentMonth = (int)$now->format('m');

// Determine current semester
if ($currentMonth >= 9 || $currentMonth <= 1) {
    $currentSemester = 'first';
    if ($currentMonth >= 9) {
        $start = "{$currentYear}-09-01";
        $end = ($currentYear + 1) . "-01-31";
    } else {
        $start = ($currentYear - 1) . "-09-01";
        $end = "{$currentYear}-01-31";
    }
} elseif ($currentMonth >= 2 && $currentMonth <= 6) {
    $currentSemester = 'second';
    $start = "{$currentYear}-02-01";
    $end = "{$currentYear}-06-30";
} else {
    $currentSemester = 'midyear';
    $start = "{$currentYear}-07-01";
    $end = "{$currentYear}-08-31";
}

echo "Current Semester: $currentSemester\n";
echo "Date Range: $start to $end\n\n";

// Get departments (excluding Administration and System Administration)
$excludedDepartments = ['Administration', 'System Administration'];
$departments = User::select('department')
    ->whereNotNull('department')
    ->whereNotIn('department', $excludedDepartments)
    ->distinct()
    ->pluck('department');

echo "Departments (excluding Admin/System Admin):\n";
foreach ($departments as $dept) {
    echo "  - $dept\n";
}

echo "\n=== ACCEPTED/REJECTED BY DEPARTMENT (Current Semester) ===\n\n";

$acceptedRejectedByDepartment = [];

foreach ($departments as $dept) {
    // Get meetings where members from this department responded
    $accepted = DB::table('event_user')
        ->join('events', 'event_user.event_id', '=', 'events.id')
        ->join('users', 'event_user.user_id', '=', 'users.id')
        ->where('users.department', $dept)
        ->where('event_user.status', 'accepted')
        ->where('events.date', '>=', $start)
        ->where('events.date', '<=', $end)
        ->where('events.is_personal', false)
        ->where('events.event_type', 'meeting')
        ->count();
        
    $rejected = DB::table('event_user')
        ->join('events', 'event_user.event_id', '=', 'events.id')
        ->join('users', 'event_user.user_id', '=', 'users.id')
        ->where('users.department', $dept)
        ->where('event_user.status', 'rejected')
        ->where('events.date', '>=', $start)
        ->where('events.date', '<=', $end)
        ->where('events.is_personal', false)
        ->where('events.event_type', 'meeting')
        ->count();
    
    $acceptedRejectedByDepartment[] = [
        'department' => $dept,
        'accepted' => $accepted,
        'rejected' => $rejected,
    ];
    
    echo "$dept:\n";
    echo "  Accepted: $accepted\n";
    echo "  Rejected: $rejected\n\n";
}

echo "\n=== JSON OUTPUT (What frontend receives) ===\n";
echo json_encode($acceptedRejectedByDepartment, JSON_PRETTY_PRINT);

echo "\n\n=== CHECKING ALL STATUSES ===\n";
$statuses = DB::table('event_user')
    ->join('events', 'event_user.event_id', '=', 'events.id')
    ->where('events.event_type', 'meeting')
    ->where('events.is_personal', false)
    ->where('events.date', '>=', $start)
    ->where('events.date', '<=', $end)
    ->select('event_user.status', DB::raw('count(*) as count'))
    ->groupBy('event_user.status')
    ->get();

echo "Meeting response statuses in current semester:\n";
foreach ($statuses as $status) {
    echo "  {$status->status}: {$status->count}\n";
}

echo "\n=== TEST COMPLETE ===\n";
