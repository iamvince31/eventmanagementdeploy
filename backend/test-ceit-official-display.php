<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\OrganizationalChartController;

echo "=== Testing Organizational Chart API for CEIT Official ===\n\n";

// Create a mock request for College of Engineering and Information Technology
$request = Request::create('/api/organizational-chart', 'GET', [
    'department' => 'College of Engineering and Information Technology'
]);

$controller = new OrganizationalChartController();
$response = $controller->index($request);
$data = json_decode($response->getContent(), true);

echo "Dean: " . ($data['dean'] ? $data['dean']['name'] : 'None') . "\n";
echo "CEIT Officials: " . count($data['ceitStaff']) . "\n";
foreach ($data['ceitStaff'] as $staff) {
    echo "  - {$staff['name']} ({$staff['role']}) - {$staff['department']}\n";
}

echo "\nChairpersons: " . count($data['chairpersons']) . "\n";
foreach ($data['chairpersons'] as $chair) {
    echo "  - {$chair['name']} ({$chair['role']}) - {$chair['department']}\n";
}

echo "\nDepartments: " . count($data['departments']) . "\n";
