<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "Testing Organizational Chart Name Fields\n";
echo "=========================================\n\n";

// Find a test user (Dean or any validated user)
$user = User::where('is_validated', true)
    ->where('role', '!=', 'Admin')
    ->first();

if (!$user) {
    echo "No validated users found to test.\n";
    exit;
}

echo "Test User Found:\n";
echo "ID: {$user->id}\n";
echo "Name: {$user->name}\n";
echo "First Name: " . ($user->first_name ?? 'NULL') . "\n";
echo "Last Name: " . ($user->last_name ?? 'NULL') . "\n";
echo "Email: {$user->email}\n";
echo "Role: {$user->role}\n";
echo "Department: {$user->department}\n\n";

// Test updating with first_name and last_name
echo "Testing update with first_name and last_name...\n";
$originalFirstName = $user->first_name;
$originalLastName = $user->last_name;
$originalName = $user->name;

$user->first_name = 'Test';
$user->last_name = 'User';
$user->name = 'Test User';
$user->save();

echo "Updated successfully!\n";
echo "New First Name: {$user->first_name}\n";
echo "New Last Name: {$user->last_name}\n";
echo "New Name: {$user->name}\n\n";

// Restore original values
echo "Restoring original values...\n";
$user->first_name = $originalFirstName;
$user->last_name = $originalLastName;
$user->name = $originalName;
$user->save();

echo "Restored successfully!\n";
echo "First Name: " . ($user->first_name ?? 'NULL') . "\n";
echo "Last Name: " . ($user->last_name ?? 'NULL') . "\n";
echo "Name: {$user->name}\n\n";

echo "Test completed successfully!\n";
