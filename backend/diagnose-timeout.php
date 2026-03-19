<?php
require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

try {
    // Test database connection
    $pdo = \Illuminate\Support\Facades\DB::connection()->getPdo();
    echo "✓ Database connection OK\n";
    
    // Check if tables exist
    $tables = ['users', 'events', 'event_user', 'user_schedules', 'default_events'];
    foreach ($tables as $table) {
        $result = \Illuminate\Support\Facades\DB::select("SHOW TABLES LIKE '$table'");
        echo ($result ? "✓" : "✗") . " Table '$table' exists\n";
    }
    
    // Check indexes
    echo "\nChecking indexes:\n";
    $indexes = [
        'events' => ['idx_events_host_id', 'idx_events_personal_host'],
        'event_user' => ['idx_event_user_user_event'],
        'user_schedules' => ['idx_user_schedules_user_day'],
        'default_events' => ['idx_default_events_school_year'],
        'users' => ['idx_users_is_validated']
    ];
    
    foreach ($indexes as $table => $indexNames) {
        foreach ($indexNames as $indexName) {
            $result = \Illuminate\Support\Facades\DB::select("SHOW INDEX FROM $table WHERE Key_name = '$indexName'");
            echo ($result ? "✓" : "✗") . " Index '$indexName' on '$table'\n";
        }
    }
    
    // Test a simple query
    echo "\nTesting queries:\n";
    $start = microtime(true);
    $users = \App\Models\User::where('is_validated', true)->limit(10)->get();
    $time = (microtime(true) - $start) * 1000;
    echo "✓ User query: {$time}ms\n";
    
    $start = microtime(true);
    $events = \App\Models\Event::where('host_id', 1)->limit(10)->get();
    $time = (microtime(true) - $start) * 1000;
    echo "✓ Event query: {$time}ms\n";
    
} catch (\Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
