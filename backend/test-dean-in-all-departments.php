<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Dean Inclusion in All Departments ===\n\n";

use App\Models\User;

// Get the Dean
$dean = User::where('is_validated', true)
    ->where('role', 'Dean')
    ->first();

if ($dean) {
    echo "Dean Found:\n";
    echo "  Name: {$dean->name}\n";
    echo "  Department: " . ($dean->department ?? 'N/A') . "\n\n";
} else {
    echo "No Dean found in the system.\n\n";
}

// Get all departments
$departments = User::where('is_validated', true)
    ->where('role', '!=', 'Admin')
    ->whereNotNull('department')
    ->distinct()
    ->pluck('department');

echo "Testing Dean inclusion for each department:\n\n";

foreach ($departments as $dept) {
    echo "Department: {$dept}\n";
    
    // Simulate the controller logic
    $deanQuery = User::where('is_validated', true)
        ->where('role', 'Dean')
        ->first();
    
    $otherUsers = User::where('is_validated', true)
        ->where('role', '!=', 'Admin')
        ->where('role', '!=', 'Dean')
        ->where('department', $dept)
        ->count();
    
    echo "  Dean included: " . ($deanQuery ? "Yes" : "No") . "\n";
    echo "  Other members in dept: {$otherUsers}\n";
    echo "---\n";
}

echo "\n=== Test Complete ===\n";
