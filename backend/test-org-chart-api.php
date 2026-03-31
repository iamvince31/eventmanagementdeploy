<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

echo "=== Testing Organizational Chart API Response ===\n\n";

// Simulate the controller logic
use App\Models\User;

$users = User::where('is_validated', true)
    ->where('role', '!=', 'Admin')
    ->select('id', 'name', 'email', 'department', 'role', 'profile_picture')
    ->orderByRaw("FIELD(role, 'Dean', 'Chairperson', 'Coordinator', 'Research Coordinator', 'Extension Coordinator', 'GAD Coordinator', 'CEIT Official', 'Faculty Member')")
    ->orderBy('name', 'asc')
    ->limit(5)
    ->get();

echo "Sample users with profile picture data:\n\n";

foreach ($users as $user) {
    echo "Name: {$user->name}\n";
    echo "Role: {$user->role}\n";
    echo "Profile Picture (DB): " . ($user->profile_picture ?? 'null') . "\n";
    echo "Profile Picture (URL): " . ($user->profile_picture ? url($user->profile_picture) : 'null') . "\n";
    echo "---\n";
}

echo "\n=== Test Complete ===\n";
