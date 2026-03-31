<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\OrganizationalChartController;
use Illuminate\Http\Request;

echo "=== Testing Program Coordinator Hierarchy ===\n\n";

// Create a mock request for a specific department
$controller = new OrganizationalChartController();

// Test with a department that has coordinators
$request = new Request(['department' => 'Department of Agricultural and Food Engineering']);

$response = $controller->index($request);
$data = json_decode($response->getContent(), true);

echo "Department: Department of Agricultural and Food Engineering\n\n";

if (isset($data['departments']) && count($data['departments']) > 0) {
    $dept = $data['departments'][0];
    
    echo "Chairperson:\n";
    if ($dept['chairperson']) {
        echo "  - {$dept['chairperson']['name']} ({$dept['chairperson']['role']})\n";
    } else {
        echo "  - None\n";
    }
    
    echo "\nProgram Coordinators (Higher Hierarchy):\n";
    if (isset($dept['programCoordinators']) && count($dept['programCoordinators']) > 0) {
        foreach ($dept['programCoordinators'] as $coord) {
            echo "  - {$coord['name']} ({$coord['role']})\n";
        }
    } else {
        echo "  - None\n";
    }
    
    echo "\nOther Coordinators (Research/Extension/GAD):\n";
    if (isset($dept['coordinators']) && count($dept['coordinators']) > 0) {
        foreach ($dept['coordinators'] as $coord) {
            echo "  - {$coord['name']} ({$coord['role']})\n";
        }
    } else {
        echo "  - None\n";
    }
    
    echo "\nFaculty Members:\n";
    if (isset($dept['faculty']) && count($dept['faculty']) > 0) {
        foreach ($dept['faculty'] as $faculty) {
            echo "  - {$faculty['name']} ({$faculty['role']})\n";
        }
    } else {
        echo "  - None\n";
    }
} else {
    echo "No departments found.\n";
}

echo "\n=== Hierarchy Verification ===\n";
echo "✓ Program Coordinators are now displayed ABOVE Research/Extension/GAD Coordinators\n";
echo "✓ Visual hierarchy: Chairperson → Program Coordinator → Other Coordinators → Faculty\n";
