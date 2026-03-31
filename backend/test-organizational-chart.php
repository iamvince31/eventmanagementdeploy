<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Organizational Chart System ===\n\n";

// Test 1: Check users table structure
echo "1. Checking users table structure...\n";
try {
    $columns = DB::select("DESCRIBE users");
    $hasRole = false;
    $hasDepartment = false;
    
    foreach ($columns as $column) {
        if ($column->Field === 'role') $hasRole = true;
        if ($column->Field === 'department') $hasDepartment = true;
    }
    
    if ($hasRole && $hasDepartment) {
        echo "   ✓ Users table has required columns (role, department)\n";
    } else {
        echo "   ✗ Missing required columns\n";
    }
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Test 2: Count users by role
echo "\n2. Counting users by role...\n";
try {
    $roles = DB::table('users')
        ->select('role', DB::raw('COUNT(*) as count'))
        ->where('is_validated', true)
        ->groupBy('role')
        ->get();
    
    foreach ($roles as $role) {
        echo "   - {$role->role}: {$role->count} user(s)\n";
    }
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Test 3: List departments
echo "\n3. Listing departments...\n";
try {
    $departments = DB::table('users')
        ->select('department')
        ->where('is_validated', true)
        ->whereNotNull('department')
        ->distinct()
        ->get();
    
    if ($departments->count() > 0) {
        foreach ($departments as $dept) {
            echo "   - {$dept->department}\n";
        }
    } else {
        echo "   (No departments found)\n";
    }
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Test 4: Check hierarchy structure
echo "\n4. Checking organizational hierarchy...\n";
try {
    $dean = DB::table('users')
        ->where('role', 'Dean')
        ->where('is_validated', true)
        ->first();
    
    $chairpersons = DB::table('users')
        ->where('role', 'Chairperson')
        ->where('is_validated', true)
        ->count();
    
    $coordinators = DB::table('users')
        ->whereIn('role', ['Coordinator', 'Research Coordinator', 'Extension Coordinator', 'GAD Coordinator', 'CEIT Official'])
        ->where('is_validated', true)
        ->count();
    
    $faculty = DB::table('users')
        ->where('role', 'Faculty Member')
        ->where('is_validated', true)
        ->count();
    
    echo "   Dean: " . ($dean ? "✓ {$dean->name}" : "✗ Not assigned") . "\n";
    echo "   Chairpersons: {$chairpersons}\n";
    echo "   Coordinators: {$coordinators}\n";
    echo "   Faculty Members: {$faculty}\n";
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Test 5: Sample hierarchy by department
echo "\n5. Sample hierarchy by department...\n";
try {
    $sampleDept = DB::table('users')
        ->whereNotNull('department')
        ->where('is_validated', true)
        ->value('department');
    
    if ($sampleDept) {
        echo "   Department: {$sampleDept}\n";
        
        $deptUsers = DB::table('users')
            ->where('department', $sampleDept)
            ->where('is_validated', true)
            ->select('name', 'role')
            ->orderByRaw("FIELD(role, 'Dean', 'Chairperson', 'Coordinator', 'Research Coordinator', 'Extension Coordinator', 'GAD Coordinator', 'CEIT Official', 'Faculty Member')")
            ->get();
        
        foreach ($deptUsers as $user) {
            echo "   - {$user->role}: {$user->name}\n";
        }
    } else {
        echo "   (No departments with users found)\n";
    }
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
