<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "=== Testing Profile Pictures ===\n\n";

// Check Gabriel Ian De Leon
$user = User::where('name', 'Gabriel Ian De Leon')->first();

if ($user) {
    echo "User: {$user->name}\n";
    echo "Profile Picture (raw): " . ($user->profile_picture ?? 'NULL') . "\n";
    echo "Profile Picture (url): " . ($user->profile_picture ? url($user->profile_picture) : 'NULL') . "\n";
    echo "\n";
} else {
    echo "User not found\n";
}

// Check a few other users
$users = User::where('is_validated', true)
    ->whereNotNull('profile_picture')
    ->limit(5)
    ->get();

echo "Users with profile pictures:\n";
foreach ($users as $u) {
    echo "  {$u->name}: {$u->profile_picture}\n";
}

echo "\n";

// Test the API response
echo "=== Testing API Response ===\n\n";
$controller = new \App\Http\Controllers\OrganizationalChartController();
$request = new \Illuminate\Http\Request();
$request->merge(['department' => 'Department of Information Technology']);

try {
    $response = $controller->index($request);
    $data = json_decode($response->getContent(), true);
    
    foreach ($data['departments'] as $dept) {
        if (isset($dept['faculty'])) {
            foreach ($dept['faculty'] as $fac) {
                if ($fac['name'] === 'Gabriel Ian De Leon') {
                    echo "Gabriel Ian De Leon in API:\n";
                    echo "  Profile Picture: " . ($fac['profile_picture'] ?? 'NULL') . "\n";
                }
            }
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
