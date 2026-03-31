<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing CEIT Staff Hierarchy ===\n\n";

// First, run the migration to add CEIT Staff role
echo "Step 1: Running migration to add CEIT Staff role...\n";
try {
    DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
        'Admin',
        'Dean',
        'CEIT Staff',
        'Chairperson',
        'Program Coordinator',
        'Coordinator',
        'Research Coordinator',
        'Extension Coordinator',
        'GAD Coordinator',
        'Faculty Member',
        'CEIT Official'
    ) NOT NULL DEFAULT 'Faculty Member'");
    echo "✓ Migration successful\n\n";
} catch (Exception $e) {
    echo "✗ Migration failed: " . $e->getMessage() . "\n\n";
}

// Create a test CEIT Staff user
echo "Step 2: Creating test CEIT Staff user...\n";
try {
    $ceitStaff = DB::table('users')->insertGetId([
        'name' => 'Test CEIT Staff',
        'first_name' => 'Test',
        'last_name' => 'CEIT Staff',
        'email' => 'ceit.staff@cvsu.edu.ph',
        'password' => Hash::make('password123'),
        'department' => 'College of Engineering and Information Technology',
        'role' => 'CEIT Staff',
        'is_validated' => true,
        'email_verified_at' => now(),
        'created_at' => now(),
        'updated_at' => now()
    ]);
    echo "✓ CEIT Staff user created with ID: $ceitStaff\n";
    echo "  Email: ceit.staff@cvsu.edu.ph\n";
    echo "  Password: password123\n\n";
} catch (Exception $e) {
    echo "✗ Failed to create CEIT Staff user: " . $e->getMessage() . "\n\n";
}

// Verify the organizational hierarchy
echo "Step 3: Verifying organizational hierarchy...\n";
try {
    $users = DB::table('users')
        ->where('is_validated', true)
        ->whereIn('role', ['Dean', 'CEIT Staff', 'Chairperson', 'Program Coordinator'])
        ->orderByRaw("FIELD(role, 'Dean', 'CEIT Staff', 'Chairperson', 'Program Coordinator')")
        ->orderBy('name')
        ->select('id', 'name', 'email', 'department', 'role')
        ->get();
    
    echo "\nCurrent Hierarchy (Top Levels):\n";
    echo str_repeat("-", 80) . "\n";
    printf("%-5s %-30s %-35s %-20s %s\n", "ID", "Name", "Email", "Role", "Department");
    echo str_repeat("-", 80) . "\n";
    
    foreach ($users as $user) {
        printf("%-5d %-30s %-35s %-20s %s\n", 
            $user->id, 
            substr($user->name, 0, 30), 
            substr($user->email, 0, 35),
            $user->role,
            substr($user->department, 0, 20)
        );
    }
    echo str_repeat("-", 80) . "\n\n";
    
    // Check hierarchy structure
    $dean = DB::table('users')->where('role', 'Dean')->where('is_validated', true)->first();
    $ceitStaffUsers = DB::table('users')->where('role', 'CEIT Staff')->where('is_validated', true)->get();
    $chairpersons = DB::table('users')->where('role', 'Chairperson')->where('is_validated', true)->get();
    
    echo "Hierarchy Verification:\n";
    echo "✓ Dean: " . ($dean ? $dean->name : 'None') . "\n";
    echo "✓ CEIT Staff: " . $ceitStaffUsers->count() . " member(s)\n";
    foreach ($ceitStaffUsers as $staff) {
        echo "  - " . $staff->name . " (" . $staff->department . ")\n";
    }
    echo "✓ Chairpersons: " . $chairpersons->count() . " member(s)\n";
    foreach ($chairpersons as $chair) {
        echo "  - " . $chair->name . " (" . $chair->department . ")\n";
    }
    echo "\n";
    
} catch (Exception $e) {
    echo "✗ Failed to verify hierarchy: " . $e->getMessage() . "\n\n";
}

// Test the API endpoint
echo "Step 4: Testing organizational chart API...\n";
try {
    // Get an admin or dean token for testing
    $admin = DB::table('users')
        ->where('role', 'Admin')
        ->orWhere('role', 'Dean')
        ->where('is_validated', true)
        ->first();
    
    if ($admin) {
        echo "Note: To test the API endpoint, use this curl command:\n";
        echo "curl -X GET http://localhost:8000/api/organizational-chart \\\n";
        echo "  -H 'Accept: application/json'\n\n";
        
        echo "Expected JSON structure:\n";
        echo "{\n";
        echo "  \"dean\": { ... },\n";
        echo "  \"ceitStaff\": [\n";
        echo "    { \"name\": \"Test CEIT Staff\", \"role\": \"CEIT Staff\", ... }\n";
        echo "  ],\n";
        echo "  \"departments\": [\n";
        echo "    {\n";
        echo "      \"name\": \"Department Name\",\n";
        echo "      \"chairperson\": { ... },\n";
        echo "      \"programCoordinator\": { ... },\n";
        echo "      ...\n";
        echo "    }\n";
        echo "  ]\n";
        echo "}\n\n";
    }
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n\n";
}

echo "=== Test Complete ===\n";
echo "\nTo clean up the test user, run:\n";
echo "DELETE FROM users WHERE email = 'ceit.staff@cvsu.edu.ph';\n";
