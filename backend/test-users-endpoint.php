<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing /api/users endpoint...\n\n";

try {
    // Test with select (current implementation)
    echo "=== Test 1: With select() ===\n";
    $membersWithSelect = \App\Models\User::where('role', '!=', 'Admin')
        ->where('is_validated', true)
        ->select('id', 'name', 'email', 'department', 'role', 'is_validated')
        ->orderBy('role')
        ->orderBy('name', 'asc')
        ->limit(3)
        ->get();

    foreach ($membersWithSelect as $member) {
        echo "- {$member->name}: is_validated = ";
        var_dump($member->is_validated);
    }

    echo "\n=== Test 2: Without select() ===\n";
    $membersWithoutSelect = \App\Models\User::where('role', '!=', 'Admin')
        ->where('is_validated', true)
        ->orderBy('role')
        ->orderBy('name', 'asc')
        ->limit(3)
        ->get();

    foreach ($membersWithoutSelect as $member) {
        echo "- {$member->name}: is_validated = ";
        var_dump($member->is_validated);
    }

    echo "\n=== Test 3: Raw query ===\n";
    $raw = \Illuminate\Support\Facades\DB::select("
        SELECT id, name, email, department, role, is_validated
        FROM users
        WHERE role != 'Admin' AND is_validated = 1
        ORDER BY role, name
        LIMIT 3
    ");

    foreach ($raw as $member) {
        echo "- {$member->name}: is_validated = ";
        var_dump($member->is_validated);
    }

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}

