<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Users with 'Program Coordinator' role ===\n\n";

$coordinators = DB::table('users')
    ->where('role', 'Program Coordinator')
    ->get(['id', 'name', 'email', 'role', 'department']);

if ($coordinators->isEmpty()) {
    echo "No users found with 'Program Coordinator' role.\n";
} else {
    echo "Found " . $coordinators->count() . " user(s):\n\n";
    foreach ($coordinators as $user) {
        echo "ID: {$user->id}\n";
        echo "Name: {$user->name}\n";
        echo "Email: {$user->email}\n";
        echo "Role: {$user->role}\n";
        echo "Department: {$user->department}\n";
        echo "---\n";
    }
}

echo "\n=== Organizational Chart Hierarchy Test ===\n\n";

// Test the hierarchy ordering
$users = DB::table('users')
    ->where('is_validated', true)
    ->where('role', '!=', 'Admin')
    ->whereIn('role', ['Dean', 'CEIT Official', 'Chairperson', 'Program Coordinator', 'Research Coordinator', 'Extension Coordinator', 'GAD Coordinator'])
    ->orderByRaw("FIELD(role, 'Dean', 'CEIT Official', 'Chairperson', 'Program Coordinator', 'Research Coordinator', 'Extension Coordinator', 'GAD Coordinator')")
    ->orderBy('name')
    ->get(['name', 'role', 'department']);

echo "Hierarchy Order (Dean -> CEIT Official -> Chairperson -> Program Coordinator -> Research/Extension/GAD Coordinators):\n\n";

foreach ($users as $user) {
    echo "{$user->role}: {$user->name} ({$user->department})\n";
}
