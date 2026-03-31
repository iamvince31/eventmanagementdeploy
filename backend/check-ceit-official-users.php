<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "=== Checking CEIT Official Users ===\n\n";

// Check for users with 'CEIT Official' role
$ceitOfficials = User::where('role', 'CEIT Official')->get();
echo "Users with 'CEIT Official' role: " . $ceitOfficials->count() . "\n";
foreach ($ceitOfficials as $user) {
    echo "  - ID: {$user->id}, Name: {$user->name}, Department: {$user->department}, Validated: " . ($user->is_validated ? 'Yes' : 'No') . "\n";
}

echo "\n";

// Check for users with old 'CEIT Staff' role
$ceitStaff = User::where('role', 'CEIT Staff')->get();
echo "Users with old 'CEIT Staff' role: " . $ceitStaff->count() . "\n";
foreach ($ceitStaff as $user) {
    echo "  - ID: {$user->id}, Name: {$user->name}, Department: {$user->department}, Validated: " . ($user->is_validated ? 'Yes' : 'No') . "\n";
}

echo "\n";

// Check all users in College of Engineering and Information Technology
$collegeUsers = User::where('department', 'College of Engineering and Information Technology')
    ->where('role', '!=', 'Admin')
    ->get();
echo "All users in College of Engineering and Information Technology: " . $collegeUsers->count() . "\n";
foreach ($collegeUsers as $user) {
    echo "  - ID: {$user->id}, Name: {$user->name}, Role: {$user->role}, Validated: " . ($user->is_validated ? 'Yes' : 'No') . "\n";
}
