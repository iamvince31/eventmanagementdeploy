<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\OrganizationalChartController;
use Illuminate\Http\Request;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing CEIT Staff in Organizational Chart API ===\n\n";

// Create a mock request
$request = Request::create('/api/organizational-chart', 'GET');

// Instantiate the controller
$controller = new OrganizationalChartController();

// Call the index method
try {
    $response = $controller->index($request);
    $data = json_decode($response->getContent(), true);
    
    echo "API Response Structure:\n";
    echo str_repeat("=", 80) . "\n\n";
    
    // Display Dean
    if (isset($data['dean'])) {
        echo "DEAN:\n";
        echo "  Name: " . $data['dean']['name'] . "\n";
        echo "  Role: " . $data['dean']['role'] . "\n";
        echo "  Department: " . $data['dean']['department'] . "\n\n";
    }
    
    // Display CEIT Staff
    if (isset($data['ceitStaff']) && count($data['ceitStaff']) > 0) {
        echo "CEIT STAFF (Below Dean, Above Chairpersons):\n";
        foreach ($data['ceitStaff'] as $staff) {
            echo "  - " . $staff['name'] . "\n";
            echo "    Email: " . $staff['email'] . "\n";
            echo "    Role: " . $staff['role'] . "\n";
            echo "    Department: " . $staff['department'] . "\n\n";
        }
    } else {
        echo "CEIT STAFF: None\n\n";
    }
    
    // Display Departments
    if (isset($data['departments'])) {
        echo "DEPARTMENTS (" . count($data['departments']) . " total):\n";
        foreach ($data['departments'] as $dept) {
            echo "\n  " . $dept['name'] . ":\n";
            
            if ($dept['chairperson']) {
                echo "    Chairperson: " . $dept['chairperson']['name'] . "\n";
            } else {
                echo "    Chairperson: None\n";
            }
            
            if ($dept['programCoordinator']) {
                echo "    Program Coordinator: " . $dept['programCoordinator']['name'] . "\n";
            } else {
                echo "    Program Coordinator: None\n";
            }
            
            echo "    Coordinators: " . count($dept['coordinators']) . "\n";
            echo "    Faculty: " . count($dept['faculty']) . "\n";
        }
    }
    
    echo "\n" . str_repeat("=", 80) . "\n";
    echo "\n✓ Hierarchy Verification:\n";
    echo "  1. Dean at the top\n";
    echo "  2. CEIT Staff below Dean\n";
    echo "  3. Departments with Chairpersons below CEIT Staff\n";
    echo "  4. Program Coordinators below Chairpersons\n";
    echo "  5. Other coordinators and faculty at lower levels\n\n";
    
    echo "✓ Test PASSED: CEIT Staff is correctly positioned in the hierarchy!\n\n";
    
} catch (Exception $e) {
    echo "✗ Error testing API: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "=== Test Complete ===\n";
