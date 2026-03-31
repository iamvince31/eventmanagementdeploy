<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "=== Testing CEIT Staff Department Hierarchy ===\n\n";

// Get all departments
$departments = User::where('is_validated', true)
    ->where('role', '!=', 'Admin')
    ->where('role', '!=', 'Dean')
    ->whereNotNull('department')
    ->where('department', '!=', 'College of Engineering and Information Technology')
    ->distinct()
    ->pluck('department')
    ->sort();

echo "Departments found: " . $departments->count() . "\n";
foreach ($departments as $dept) {
    echo "  - $dept\n";
}

echo "\n=== Hierarchy Structure ===\n\n";

// Get Dean
$dean = User::where('is_validated', true)
    ->where('role', 'Dean')
    ->first();

if ($dean) {
    echo "Dean: {$dean->name} ({$dean->department})\n\n";
}

// For each department, show the hierarchy
foreach ($departments as $dept) {
    echo "Department: $dept\n";
    echo str_repeat('-', 50) . "\n";
    
    // CEIT Staff in this department
    $ceitStaff = User::where('is_validated', true)
        ->where('role', 'CEIT Staff')
        ->where('department', $dept)
        ->get();
    
    if ($ceitStaff->count() > 0) {
        echo "  CEIT Staff:\n";
        foreach ($ceitStaff as $staff) {
            echo "    - {$staff->name} ({$staff->email})\n";
        }
    } else {
        echo "  CEIT Staff: None\n";
    }
    
    // Chairperson
    $chairperson = User::where('is_validated', true)
        ->where('role', 'Chairperson')
        ->where('department', $dept)
        ->first();
    
    if ($chairperson) {
        echo "  Chairperson: {$chairperson->name}\n";
    } else {
        echo "  Chairperson: None\n";
    }
    
    // Program Coordinator
    $programCoord = User::where('is_validated', true)
        ->where('role', 'Program Coordinator')
        ->where('department', $dept)
        ->first();
    
    if ($programCoord) {
        echo "  Program Coordinator: {$programCoord->name}\n";
    }
    
    echo "\n";
}

echo "\n=== Summary ===\n";
echo "Total CEIT Staff members: " . User::where('role', 'CEIT Staff')->where('is_validated', true)->count() . "\n";
echo "CEIT Staff by department:\n";
foreach ($departments as $dept) {
    $count = User::where('role', 'CEIT Staff')
        ->where('is_validated', true)
        ->where('department', $dept)
        ->count();
    echo "  $dept: $count\n";
}
