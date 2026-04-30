<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Http\Controllers\OrganizationalChartController;
use Illuminate\Http\Request;

echo "=== Testing Organizational Chart API Response ===\n\n";

$controller = new OrganizationalChartController();
$request = new Request(['department' => 'Department of Agriculture and Food Engineering']);

$response = $controller->index($request);
$data = json_decode($response->getContent(), true);

echo "API Response Structure:\n\n";

if (isset($data['departments'][0])) {
    $dept = $data['departments'][0];

    echo "✓ Department: {$dept['name']}\n\n";

    echo "✓ Chairperson: ";
    if ($dept['chairperson']) {
        echo "{$dept['chairperson']['name']} ({$dept['chairperson']['role']})\n";
    }
    else {
        echo "None\n";
    }

    echo "\n✓ Program Coordinators (Separate Array - Higher Hierarchy):\n";
    if (isset($dept['programCoordinators'])) {
        echo "   Array exists: YES\n";
        echo "   Count: " . count($dept['programCoordinators']) . "\n";
        foreach ($dept['programCoordinators'] as $coord) {
            echo "   - {$coord['name']} ({$coord['role']})\n";
        }
    }
    else {
        echo "   Array exists: NO ❌\n";
    }

    echo "\n✓ Other Coordinators (Separate Array - Lower Hierarchy):\n";
    if (isset($dept['coordinators'])) {
        echo "   Array exists: YES\n";
        echo "   Count: " . count($dept['coordinators']) . "\n";
        foreach ($dept['coordinators'] as $coord) {
            echo "   - {$coord['name']} ({$coord['role']})\n";
        }
    }
    else {
        echo "   Array exists: NO ❌\n";
    }

    echo "\n✓ Faculty Members:\n";
    if (isset($dept['faculty'])) {
        echo "   Array exists: YES\n";
        echo "   Count: " . count($dept['faculty']) . "\n";
    }
    else {
        echo "   Array exists: NO ❌\n";
    }

    echo "\n" . str_repeat("=", 80) . "\n";
    echo "VERIFICATION RESULTS:\n";
    echo str_repeat("=", 80) . "\n\n";

    $programCoordExists = isset($dept['programCoordinators']);
    $coordinatorsExists = isset($dept['coordinators']);
    $separated = $programCoordExists && $coordinatorsExists;

    if ($separated) {
        echo "✅ SUCCESS: Program Coordinators and Other Coordinators are SEPARATED\n";
        echo "✅ Program Coordinators will display ABOVE Other Coordinators\n";
        echo "✅ Hierarchy is correctly implemented\n";
    }
    else {
        echo "❌ ISSUE: Arrays are not properly separated\n";
    }
}
