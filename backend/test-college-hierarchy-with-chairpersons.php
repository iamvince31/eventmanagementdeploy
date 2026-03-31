<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\OrganizationalChartController;

echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║        COLLEGE-LEVEL HIERARCHY WITH CHAIRPERSONS TEST          ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

$controller = new OrganizationalChartController();

// Clear cache first
use Illuminate\Support\Facades\Cache;
Cache::forget('org_chart_all');
Cache::forget('org_chart_College of Engineering and Information Technology');

// Test College Level View
echo "📊 COLLEGE LEVEL VIEW\n";
echo str_repeat('─', 64) . "\n\n";

$request = Request::create('/organizational-chart', 'GET', ['department' => 'College of Engineering and Information Technology']);
$response = $controller->index($request);
$data = json_decode($response->getContent(), true);

echo "1️⃣  DEAN\n";
if ($data['dean']) {
    echo "   • {$data['dean']['name']}\n";
    echo "   • {$data['dean']['department']}\n";
} else {
    echo "   (None)\n";
}
echo "\n";

echo "2️⃣  CEIT STAFF (Should show 2 cards in a row)\n";
echo "   Count: " . count($data['ceitStaff']) . "\n";
if (count($data['ceitStaff']) > 0) {
    foreach ($data['ceitStaff'] as $staff) {
        echo "   • {$staff['name']} ({$staff['department']})\n";
    }
} else {
    echo "   (None - Need to add more CEIT Staff)\n";
}
echo "\n";

echo "3️⃣  CHAIRPERSONS (Should show 3 cards in a row)\n";
echo "   Count: " . count($data['chairpersons']) . "\n";
if (count($data['chairpersons']) > 0) {
    foreach ($data['chairpersons'] as $chair) {
        echo "   • {$chair['name']} - {$chair['department']}\n";
    }
} else {
    echo "   (None)\n";
}
echo "\n";

echo "📁 DEPARTMENTS (Should be empty for college view)\n";
echo "   Count: " . count($data['departments']) . "\n\n";

echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║                      EXPECTED LAYOUT                           ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

echo "Row 1: [Dean Card]\n";
echo "Row 2: [CEIT Staff 1] [CEIT Staff 2]\n";
echo "Row 3: [Chairperson 1] [Chairperson 2] [Chairperson 3]\n\n";

echo "✅ VERIFICATION\n";
echo "   • Dean: " . ($data['dean'] ? '✓' : '✗') . "\n";
echo "   • CEIT Staff count: " . count($data['ceitStaff']) . " (target: 2)\n";
echo "   • Chairpersons count: " . count($data['chairpersons']) . " (target: 3+)\n";
echo "   • Departments shown: " . count($data['departments']) . " (should be 0)\n";
