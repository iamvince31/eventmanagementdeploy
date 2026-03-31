<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "=== Testing Organizational Chart Hierarchy ===\n\n";

// Get all validated users
$users = User::where('is_validated', true)
    ->where('role', '!=', 'Admin')
    ->select('id', 'name', 'email', 'department', 'role')
    ->orderBy('department')
    ->orderByRaw("FIELD(role, 'Dean', 'Chairperson', 'Program Coordinator', 'Research Coordinator', 'Extension Coordinator', 'GAD Coordinator', 'Coordinator', 'CEIT Official', 'Faculty Member')")
    ->get();

echo "Total validated users (excluding Admin): " . $users->count() . "\n\n";

// Group by department
$departments = $users->groupBy('department');

foreach ($departments as $dept => $deptUsers) {
    echo "Department: " . ($dept ?: 'No Department') . "\n";
    echo str_repeat('-', 50) . "\n";
    
    foreach ($deptUsers as $user) {
        echo "  {$user->role}: {$user->name} ({$user->email})\n";
    }
    echo "\n";
}

// Test the API endpoint
echo "\n=== Testing API Response (No Filter) ===\n\n";

$controller = new \App\Http\Controllers\OrganizationalChartController();
$request = new \Illuminate\Http\Request();

try {
    $response = $controller->index($request);
    $data = json_decode($response->getContent(), true);
    
    echo "Dean: " . ($data['dean'] ? $data['dean']['name'] : 'None') . "\n";
    echo "Number of departments: " . count($data['departments']) . "\n\n";
    
    foreach ($data['departments'] as $dept) {
        echo "Department: {$dept['name']}\n";
        echo "  Chairperson: " . ($dept['chairperson'] ? $dept['chairperson']['name'] : 'None') . "\n";
        echo "  Program Coordinator: " . (isset($dept['programCoordinator']) && $dept['programCoordinator'] ? $dept['programCoordinator']['name'] : 'None') . "\n";
        echo "  Coordinators: " . (isset($dept['coordinators']) ? count($dept['coordinators']) : 0) . "\n";
        if (isset($dept['coordinators'])) {
            foreach ($dept['coordinators'] as $coord) {
                echo "    - {$coord['role']}: {$coord['name']}\n";
            }
        }
        echo "  Faculty: " . (isset($dept['faculty']) ? count($dept['faculty']) : 0) . "\n";
        echo "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
