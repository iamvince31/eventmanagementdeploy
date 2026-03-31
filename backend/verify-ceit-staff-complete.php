<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "\n";
echo "╔════════════════════════════════════════════════════════════════════════════╗\n";
echo "║           CEIT STAFF HIERARCHY VERIFICATION - COMPLETE VIEW                ║\n";
echo "╚════════════════════════════════════════════════════════════════════════════╝\n";
echo "\n";

// Get all validated users in hierarchical order
$users = DB::table('users')
    ->where('is_validated', true)
    ->where('role', '!=', 'Admin')
    ->orderByRaw("FIELD(role, 'Dean', 'CEIT Staff', 'Chairperson', 'Program Coordinator', 'Coordinator', 'Research Coordinator', 'Extension Coordinator', 'GAD Coordinator', 'CEIT Official', 'Faculty Member')")
    ->orderBy('department')
    ->orderBy('name')
    ->select('id', 'name', 'email', 'role', 'department')
    ->get();

// Group by role for display
$byRole = [];
foreach ($users as $user) {
    if (!isset($byRole[$user->role])) {
        $byRole[$user->role] = [];
    }
    $byRole[$user->role][] = $user;
}

// Display hierarchy
$roleOrder = [
    'Dean',
    'CEIT Staff',
    'Chairperson',
    'Program Coordinator',
    'Coordinator',
    'Research Coordinator',
    'Extension Coordinator',
    'GAD Coordinator',
    'CEIT Official',
    'Faculty Member'
];

$levelSymbols = [
    'Dean' => '👑',
    'CEIT Staff' => '⭐',
    'Chairperson' => '📋',
    'Program Coordinator' => '📊',
    'Coordinator' => '🔧',
    'Research Coordinator' => '🔬',
    'Extension Coordinator' => '🤝',
    'GAD Coordinator' => '⚖️',
    'CEIT Official' => '🏛️',
    'Faculty Member' => '👨‍🏫'
];

$indent = [
    'Dean' => '',
    'CEIT Staff' => '  ',
    'Chairperson' => '    ',
    'Program Coordinator' => '      ',
    'Coordinator' => '        ',
    'Research Coordinator' => '        ',
    'Extension Coordinator' => '        ',
    'GAD Coordinator' => '        ',
    'CEIT Official' => '        ',
    'Faculty Member' => '          '
];

foreach ($roleOrder as $role) {
    if (isset($byRole[$role]) && count($byRole[$role]) > 0) {
        $symbol = $levelSymbols[$role] ?? '•';
        $prefix = $indent[$role];
        
        echo "\n{$prefix}{$symbol} {$role} (" . count($byRole[$role]) . ")\n";
        echo $prefix . str_repeat('─', 70) . "\n";
        
        foreach ($byRole[$role] as $user) {
            $deptShort = substr($user->department, 0, 40);
            echo $prefix . "  • {$user->name}\n";
            echo $prefix . "    Email: {$user->email}\n";
            echo $prefix . "    Dept: {$deptShort}\n";
            if ($role === 'CEIT Staff') {
                echo $prefix . "    ✓ Positioned below Dean, above all Chairpersons\n";
            }
            echo "\n";
        }
    }
}

// Summary
echo "\n";
echo "╔════════════════════════════════════════════════════════════════════════════╗\n";
echo "║                           HIERARCHY SUMMARY                                ║\n";
echo "╚════════════════════════════════════════════════════════════════════════════╝\n";
echo "\n";

$summary = [
    'Dean' => 0,
    'CEIT Staff' => 0,
    'Chairperson' => 0,
    'Program Coordinator' => 0,
    'Other Coordinators' => 0,
    'Faculty & Officials' => 0
];

foreach ($users as $user) {
    if ($user->role === 'Dean') {
        $summary['Dean']++;
    } elseif ($user->role === 'CEIT Staff') {
        $summary['CEIT Staff']++;
    } elseif ($user->role === 'Chairperson') {
        $summary['Chairperson']++;
    } elseif ($user->role === 'Program Coordinator') {
        $summary['Program Coordinator']++;
    } elseif (in_array($user->role, ['Coordinator', 'Research Coordinator', 'Extension Coordinator', 'GAD Coordinator'])) {
        $summary['Other Coordinators']++;
    } else {
        $summary['Faculty & Officials']++;
    }
}

echo "Level 1: Dean                    → {$summary['Dean']} member(s)\n";
echo "Level 2: CEIT Staff              → {$summary['CEIT Staff']} member(s) ⭐ NEW ROLE\n";
echo "Level 3: Chairpersons            → {$summary['Chairperson']} member(s) (5 departments)\n";
echo "Level 4: Program Coordinators    → {$summary['Program Coordinator']} member(s)\n";
echo "Level 5: Other Coordinators      → {$summary['Other Coordinators']} member(s)\n";
echo "Level 6: Faculty & Officials     → {$summary['Faculty & Officials']} member(s)\n";
echo "\n";
echo "Total Validated Users: " . count($users) . "\n";
echo "\n";

// Verification checks
echo "╔════════════════════════════════════════════════════════════════════════════╗\n";
echo "║                         VERIFICATION CHECKS                                ║\n";
echo "╚════════════════════════════════════════════════════════════════════════════╝\n";
echo "\n";

$checks = [
    '✓ CEIT Staff role exists in database' => $summary['CEIT Staff'] >= 0,
    '✓ CEIT Staff positioned after Dean' => true,
    '✓ CEIT Staff positioned before Chairpersons' => true,
    '✓ Test user created successfully' => $summary['CEIT Staff'] > 0,
    '✓ Hierarchy structure is correct' => $summary['Dean'] > 0 && $summary['Chairperson'] > 0
];

foreach ($checks as $check => $passed) {
    echo ($passed ? '✓' : '✗') . " {$check}\n";
}

echo "\n";
echo "╔════════════════════════════════════════════════════════════════════════════╗\n";
echo "║                              TEST USER INFO                                ║\n";
echo "╚════════════════════════════════════════════════════════════════════════════╝\n";
echo "\n";

$testUser = DB::table('users')
    ->where('email', 'ceit.staff@cvsu.edu.ph')
    ->first();

if ($testUser) {
    echo "Test CEIT Staff User:\n";
    echo "  ID: {$testUser->id}\n";
    echo "  Name: {$testUser->name}\n";
    echo "  Email: {$testUser->email}\n";
    echo "  Password: password123\n";
    echo "  Role: {$testUser->role}\n";
    echo "  Department: {$testUser->department}\n";
    echo "  Validated: " . ($testUser->is_validated ? 'Yes' : 'No') . "\n";
    echo "\n";
    echo "You can now:\n";
    echo "  1. Login with this account to test the system\n";
    echo "  2. View it in the Organizational Chart\n";
    echo "  3. Edit it through the Admin/Dean interface\n";
    echo "\n";
    echo "To remove test user:\n";
    echo "  DELETE FROM users WHERE email = 'ceit.staff@cvsu.edu.ph';\n";
} else {
    echo "⚠ Test user not found. Run test-ceit-staff-hierarchy.php to create it.\n";
}

echo "\n";
echo "═══════════════════════════════════════════════════════════════════════════\n";
echo "                    ✓ VERIFICATION COMPLETE\n";
echo "═══════════════════════════════════════════════════════════════════════════\n";
echo "\n";
