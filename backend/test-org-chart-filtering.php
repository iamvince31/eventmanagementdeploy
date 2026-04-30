<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Organizational Chart Department Filtering ===\n\n";

$controller = new \App\Http\Controllers\OrganizationalChartController();

// Test 1: College of Engineering and Information Technology (all departments, no faculty)
echo "1. College of Engineering and Information Technology (All Departments, No Faculty)\n";
echo str_repeat('=', 70) . "\n";
$request = new \Illuminate\Http\Request();
$request->merge(['department' => 'College of Engineering and Information Technology']);

try {
    $response = $controller->index($request);
    $data = json_decode($response->getContent(), true);

    echo "Dean: " . ($data['dean'] ? $data['dean']['name'] : 'None') . "\n";
    echo "Number of departments: " . count($data['departments']) . "\n\n";

    foreach ($data['departments'] as $dept) {
        echo "  {$dept['name']}\n";
        echo "    Chairperson: " . ($dept['chairperson'] ? $dept['chairperson']['name'] : 'None') . "\n";
        echo "    Program Coordinator: " . (isset($dept['programCoordinator']) && $dept['programCoordinator'] ? $dept['programCoordinator']['name'] : 'None') . "\n";
        echo "    Coordinators: " . (isset($dept['coordinators']) ? count($dept['coordinators']) : 0) . "\n";
        echo "    Faculty: " . (isset($dept['faculty']) ? count($dept['faculty']) : 0) . " (should be 0)\n";
    }
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n\n";

// Test 2: Specific Department (with faculty)
echo "2. Department of Information Technology (With Faculty)\n";
echo str_repeat('=', 70) . "\n";
$request2 = new \Illuminate\Http\Request();
$request2->merge(['department' => 'Department of Information Technology']);

try {
    $response = $controller->index($request2);
    $data = json_decode($response->getContent(), true);

    echo "Dean: " . ($data['dean'] ? $data['dean']['name'] : 'None') . "\n";
    echo "Number of departments: " . count($data['departments']) . "\n\n";

    foreach ($data['departments'] as $dept) {
        echo "  {$dept['name']}\n";
        echo "    Chairperson: " . ($dept['chairperson'] ? $dept['chairperson']['name'] : 'None') . "\n";
        echo "    Program Coordinator: " . (isset($dept['programCoordinator']) && $dept['programCoordinator'] ? $dept['programCoordinator']['name'] : 'None') . "\n";
        echo "    Coordinators: " . (isset($dept['coordinators']) ? count($dept['coordinators']) : 0) . "\n";
        echo "    Faculty: " . (isset($dept['faculty']) ? count($dept['faculty']) : 0) . " (should be > 0)\n";
        if (isset($dept['faculty']) && count($dept['faculty']) > 0) {
            foreach ($dept['faculty'] as $fac) {
                echo "      - {$fac['name']}\n";
            }
        }
    }
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n\n";

// Test 3: Get departments list
echo "3. Available Departments\n";
echo str_repeat('=', 70) . "\n";
$request3 = new \Illuminate\Http\Request();

try {
    $response = $controller->departments();
    $data = json_decode($response->getContent(), true);

    echo "Total departments: " . count($data['departments']) . "\n";
    foreach ($data['departments'] as $dept) {
        echo "  - {$dept}\n";
    }
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
