<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "=== Checking Faculty Members in College of Engineering and Information Technology ===\n\n";

$facultyMembers = User::where('department', 'College of Engineering and Information Technology')
    ->where('role', 'Faculty Member')
    ->where('is_validated', true)
    ->get();

echo "Faculty Members: " . $facultyMembers->count() . "\n";
foreach ($facultyMembers as $faculty) {
    echo "  - ID: {$faculty->id}, Name: {$faculty->name}, Role: {$faculty->role}\n";
}

echo "\n";

// Check all roles in the college
$allCollegeUsers = User::where('department', 'College of Engineering and Information Technology')
    ->where('is_validated', true)
    ->get()
    ->groupBy('role');

echo "All users in College by role:\n";
foreach ($allCollegeUsers as $role => $users) {
    echo "  {$role}: {$users->count()}\n";
}
