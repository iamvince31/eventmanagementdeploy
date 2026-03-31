<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Updating CEIT Staff Email to @cvsu.edu.ph ===\n\n";

// Update the test user email
try {
    $updated = DB::table('users')
        ->where('email', 'ceit.staff.test@example.com')
        ->update(['email' => 'ceit.staff@cvsu.edu.ph']);
    
    if ($updated > 0) {
        echo "✓ Email updated successfully!\n\n";
        
        // Verify the update
        $user = DB::table('users')
            ->where('email', 'ceit.staff@cvsu.edu.ph')
            ->first();
        
        if ($user) {
            echo "Updated User Details:\n";
            echo "  ID: {$user->id}\n";
            echo "  Name: {$user->name}\n";
            echo "  Email: {$user->email}\n";
            echo "  Role: {$user->role}\n";
            echo "  Department: {$user->department}\n";
            echo "  Password: password123 (unchanged)\n";
        }
    } else {
        echo "⚠ No user found with email: ceit.staff.test@example.com\n";
        echo "Checking if user already has correct email...\n\n";
        
        $user = DB::table('users')
            ->where('email', 'ceit.staff@cvsu.edu.ph')
            ->first();
        
        if ($user) {
            echo "✓ User already has correct email:\n";
            echo "  ID: {$user->id}\n";
            echo "  Name: {$user->name}\n";
            echo "  Email: {$user->email}\n";
            echo "  Role: {$user->role}\n";
        }
    }
} catch (Exception $e) {
    echo "✗ Error updating email: " . $e->getMessage() . "\n";
}

echo "\n=== Update Complete ===\n";
