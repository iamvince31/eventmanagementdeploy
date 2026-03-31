<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Profile Pictures ===\n\n";

// Check users with profile pictures
$usersWithPictures = DB::table('users')
    ->whereNotNull('profile_picture')
    ->select('id', 'name', 'profile_picture')
    ->get();

echo "Users with profile pictures: " . $usersWithPictures->count() . "\n\n";

foreach ($usersWithPictures as $user) {
    echo "ID: {$user->id}\n";
    echo "Name: {$user->name}\n";
    echo "Profile Picture Path: {$user->profile_picture}\n";
    echo "Full URL: " . url($user->profile_picture) . "\n";
    echo "File exists: " . (file_exists(public_path($user->profile_picture)) ? 'Yes' : 'No') . "\n";
    echo "---\n";
}

echo "\n=== Test Complete ===\n";
