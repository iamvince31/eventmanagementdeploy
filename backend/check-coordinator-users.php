<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Users with 'Coordinator' role ===\n\n";

$coordinators = DB::table('users')
    ->where('role', 'Coordinator')
    ->get(['id', 'name', 'email', 'role', 'department']);

if ($coordinators->isEmpty()) {
    echo "No users found with 'Coordinator' role.\n";
} else {
    echo "Found " . $coordinators->count() . " user(s):\n\n";
    foreach ($coordinators as $user) {
        echo "ID: {$user->id}\n";
        echo "Name: {$user->name}\n";
        echo "Email: {$user->email}\n";
        echo "Role: {$user->role}\n";
        echo "Department: {$user->department}\n";
        echo "---\n";
    }
}
