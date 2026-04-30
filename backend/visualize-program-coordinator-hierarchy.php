<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "╔════════════════════════════════════════════════════════════════════════════╗\n";
echo "║         ORGANIZATIONAL CHART HIERARCHY - PROGRAM COORDINATOR              ║\n";
echo "╚════════════════════════════════════════════════════════════════════════════╝\n\n";

// Get a sample department with all coordinator types
$dept = 'Department of Agriculture and Food Engineering';

echo "Department: $dept\n\n";

// Get users in hierarchy order
$users = DB::table('users')
    ->where('is_validated', true)
    ->where('department', $dept)
    ->whereIn('role', ['Chairperson', 'Program Coordinator', 'Research Coordinator', 'Extension Coordinator', 'GAD Coordinator', 'Faculty Member'])
    ->orderByRaw("FIELD(role, 'Chairperson', 'Program Coordinator', 'Research Coordinator', 'Extension Coordinator', 'GAD Coordinator', 'Faculty Member')")
    ->orderBy('name')
    ->get(['name', 'role']);

$currentRole = null;
$level = 0;

foreach ($users as $user) {
    if ($currentRole !== $user->role) {
        $currentRole = $user->role;
        $level++;

        echo "\n";
        echo str_repeat("─", 80) . "\n";

        // Visual hierarchy indicator
        $indent = str_repeat("  ", $level - 1);

        switch ($user->role) {
            case 'Chairperson':
                echo "{$indent}┌─ LEVEL 1: CHAIRPERSON\n";
                break;
            case 'Program Coordinator':
                echo "{$indent}├─ LEVEL 2: PROGRAM COORDINATOR (Higher Hierarchy)\n";
                break;
            case 'Research Coordinator':
            case 'Extension Coordinator':
            case 'GAD Coordinator':
                if ($user->role === 'Research Coordinator') {
                    echo "{$indent}├─ LEVEL 3: OTHER COORDINATORS\n";
                }
                break;
            case 'Faculty Member':
                echo "{$indent}└─ LEVEL 4: FACULTY MEMBERS\n";
                break;
        }

        echo str_repeat("─", 80) . "\n";
    }

    $indent = str_repeat("  ", $level);
    $roleLabel = str_pad($user->role, 25);
    echo "{$indent}• {$roleLabel} : {$user->name}\n";
}

echo "\n\n";
echo "╔════════════════════════════════════════════════════════════════════════════╗\n";
echo "║                           HIERARCHY SUMMARY                                ║\n";
echo "╠════════════════════════════════════════════════════════════════════════════╣\n";
echo "║  Level 1: Chairperson                                                      ║\n";
echo "║           └─ Heads the department                                          ║\n";
echo "║                                                                            ║\n";
echo "║  Level 2: Program Coordinator ⭐ HIGHER HIERARCHY                          ║\n";
echo "║           └─ Coordinates academic programs                                 ║\n";
echo "║           └─ Reports to Chairperson                                        ║\n";
echo "║           └─ Supervises other coordinators                                 ║\n";
echo "║                                                                            ║\n";
echo "║  Level 3: Research/Extension/GAD Coordinators                              ║\n";
echo "║           └─ Specialized coordinator roles                                 ║\n";
echo "║           └─ Report to Program Coordinator                                 ║\n";
echo "║                                                                            ║\n";
echo "║  Level 4: Faculty Members                                                  ║\n";
echo "║           └─ Teaching and research staff                                   ║\n";
echo "╚════════════════════════════════════════════════════════════════════════════╝\n";
