<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\OrganizationalChartController;
use Illuminate\Support\Facades\Cache;

Cache::forget('org_chart_College of Engineering and Information Technology');

$controller = new OrganizationalChartController();
$request = Request::create('/organizational-chart', 'GET', ['department' => 'College of Engineering and Information Technology']);
$response = $controller->index($request);
$data = json_decode($response->getContent(), true);

echo "\n";
echo "╔══════════════════════════════════════════════════════════════════════════╗\n";
echo "║           COLLEGE-LEVEL ORGANIZATIONAL CHART VISUALIZATION               ║\n";
echo "╚══════════════════════════════════════════════════════════════════════════╝\n\n";

// Row 1: Dean
echo "ROW 1 - DEAN\n";
echo str_repeat('─', 76) . "\n";
if ($data['dean']) {
    $name = str_pad($data['dean']['name'], 30, ' ', STR_PAD_BOTH);
    echo "                    ┌────────────────────────────────┐\n";
    echo "                    │{$name}│\n";
    echo "                    │         Dean - CEIT            │\n";
    echo "                    └────────────────────────────────┘\n";
}
echo "\n";

// Row 2: CEIT Staff
echo "ROW 2 - CEIT STAFF (2 cards in a row)\n";
echo str_repeat('─', 76) . "\n";
$ceitCount = count($data['ceitStaff']);
if ($ceitCount > 0) {
    $staff1 = $data['ceitStaff'][0];
    $name1 = str_pad(substr($staff1['name'], 0, 18), 18, ' ', STR_PAD_BOTH);
    
    if ($ceitCount > 1) {
        $staff2 = $data['ceitStaff'][1];
        $name2 = str_pad(substr($staff2['name'], 0, 18), 18, ' ', STR_PAD_BOTH);
        echo "      ┌────────────────────┐      ┌────────────────────┐\n";
        echo "      │{$name1}│      │{$name2}│\n";
        echo "      │    CEIT Staff      │      │    CEIT Staff      │\n";
        echo "      └────────────────────┘      └────────────────────┘\n";
    } else {
        echo "      ┌────────────────────┐      ┌────────────────────┐\n";
        echo "      │{$name1}│      │   (Add another)    │\n";
        echo "      │    CEIT Staff      │      │    CEIT Staff      │\n";
        echo "      └────────────────────┘      └────────────────────┘\n";
    }
} else {
    echo "      (No CEIT Staff assigned to college level)\n";
}
echo "\n";

// Row 3+: Chairpersons
echo "ROW 3+ - CHAIRPERSONS (3 cards per row)\n";
echo str_repeat('─', 76) . "\n";
$chairCount = count($data['chairpersons']);
if ($chairCount > 0) {
    $rows = ceil($chairCount / 3);
    for ($row = 0; $row < $rows; $row++) {
        $start = $row * 3;
        $end = min($start + 3, $chairCount);
        
        // Top border
        for ($i = $start; $i < $end; $i++) {
            echo "┌──────────────────┐  ";
        }
        echo "\n";
        
        // Name line
        for ($i = $start; $i < $end; $i++) {
            $chair = $data['chairpersons'][$i];
            $name = str_pad(substr($chair['name'], 0, 16), 16, ' ', STR_PAD_BOTH);
            echo "│{$name}│  ";
        }
        echo "\n";
        
        // Role line
        for ($i = $start; $i < $end; $i++) {
            echo "│  Chairperson     │  ";
        }
        echo "\n";
        
        // Department line
        for ($i = $start; $i < $end; $i++) {
            $chair = $data['chairpersons'][$i];
            $dept = substr($chair['department'], 0, 16);
            $dept = str_pad($dept, 16, ' ', STR_PAD_BOTH);
            echo "│{$dept}│  ";
        }
        echo "\n";
        
        // Bottom border
        for ($i = $start; $i < $end; $i++) {
            echo "└──────────────────┘  ";
        }
        echo "\n\n";
    }
} else {
    echo "(No chairpersons found)\n\n";
}

echo "╔══════════════════════════════════════════════════════════════════════════╗\n";
echo "║                              SUMMARY                                     ║\n";
echo "╚══════════════════════════════════════════════════════════════════════════╝\n\n";

echo "✓ Dean: " . ($data['dean'] ? '1' : '0') . "\n";
echo "✓ CEIT Staff: " . count($data['ceitStaff']) . " (target: 2)\n";
echo "✓ Chairpersons: " . count($data['chairpersons']) . " (showing in rows of 3)\n";
echo "✓ Layout: Dean → CEIT Staff (2 per row) → Chairpersons (3 per row)\n\n";

if (count($data['ceitStaff']) < 2) {
    echo "💡 TIP: Add one more CEIT Staff member to complete the layout\n";
    echo "   Assign them to: College of Engineering and Information Technology\n\n";
}
