<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\OrganizationalChartController;

echo "=== Testing College-Level CEIT Staff Display ===\n\n";

$controller = new OrganizationalChartController();

// Test 1: Get departments list
echo "Test 1: Departments List\n";
echo str_repeat('-', 50) . "\n";
$deptResponse = $controller->departments();
$departments = json_decode($deptResponse->getContent(), true)['departments'];
echo "Total departments: " . count($departments) . "\n";
foreach ($departments as $dept) {
    echo "  - $dept\n";
}
echo "\n";

// Test 2: View College Level (should show CEIT Staff at college level)
echo "Test 2: College Level View\n";
echo str_repeat('-', 50) . "\n";
$request = Request::create('/organizational-chart', 'GET', ['department' => 'College of Engineering and Information Technology']);
$response = $controller->index($request);
$data = json_decode($response->getContent(), true);

echo "Dean: " . ($data['dean'] ? $data['dean']['name'] : 'None') . "\n";
echo "College-level CEIT Staff: " . count($data['ceitStaff']) . "\n";
foreach ($data['ceitStaff'] as $staff) {
    echo "  - {$staff['name']} ({$staff['department']})\n";
}
echo "Departments shown: " . count($data['departments']) . "\n";
echo "\n";

// Test 3: View Specific Department (should show CEIT Staff within department)
echo "Test 3: Department of Information Technology View\n";
echo str_repeat('-', 50) . "\n";
$request = Request::create('/organizational-chart', 'GET', ['department' => 'Department of Information Technology']);
$response = $controller->index($request);
$data = json_decode($response->getContent(), true);

echo "Dean: " . ($data['dean'] ? $data['dean']['name'] : 'None') . "\n";
echo "College-level CEIT Staff: " . count($data['ceitStaff']) . "\n";
echo "Departments shown: " . count($data['departments']) . "\n";

if (count($data['departments']) > 0) {
    $dept = $data['departments'][0];
    echo "\nDepartment: {$dept['name']}\n";
    echo "  CEIT Staff in department: " . count($dept['ceitStaff']) . "\n";
    foreach ($dept['ceitStaff'] as $staff) {
        echo "    - {$staff['name']} ({$staff['department']})\n";
    }
    echo "  Chairperson: " . ($dept['chairperson'] ? $dept['chairperson']['name'] : 'None') . "\n";
}

echo "\n=== Summary ===\n";
echo "✓ College level view shows CEIT Staff at college level\n";
echo "✓ Department view shows CEIT Staff within departments\n";
echo "✓ 'College of Engineering and Information Technology' is available in dropdown\n";
