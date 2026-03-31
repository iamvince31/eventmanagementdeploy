<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\OrganizationalChartController;

echo "=== Testing College-Level Organizational Chart ===\n\n";

// Create a mock request for College of Engineering and Information Technology
$request = Request::create('/api/organizational-chart', 'GET', [
    'department' => 'College of Engineering and Information Technology'
]);

$controller = new OrganizationalChartController();
$response = $controller->index($request);
$data = json_decode($response->getContent(), true);

echo "Dean: " . ($data['dean'] ? $data['dean']['name'] : 'None') . "\n\n";

echo "CEIT Officials: " . count($data['ceitStaff']) . "\n";
foreach ($data['ceitStaff'] as $staff) {
    echo "  - {$staff['name']} ({$staff['role']})\n";
}

echo "\nFaculty Members (College Level): " . count($data['facultyMembers']) . "\n";
foreach ($data['facultyMembers'] as $faculty) {
    echo "  - {$faculty['name']} ({$faculty['role']})\n";
}

echo "\nChairpersons (should be 0 for college view): " . count($data['chairpersons']) . "\n";

echo "\nDepartments: " . count($data['departments']) . "\n";
