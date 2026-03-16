<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Adding Mid-Year Semester events...\n\n";

try {
    // Check if events already exist
    $julyEvents = DB::table('default_events')->where('month', 7)->count();
    $augustEvents = DB::table('default_events')->where('month', 8)->count();
    
    echo "Current July events: $julyEvents\n";
    echo "Current August events: $augustEvents\n\n";
    
    if ($julyEvents > 0 || $augustEvents > 0) {
        echo "Mid-Year Semester events already exist. Skipping...\n";
        exit(0);
    }
    
    // Add July events
    DB::table('default_events')->insert([
        [
            'name' => 'Registration Period',
            'month' => 7,
            'order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'name' => 'Beginning of Classes',
            'month' => 7,
            'order' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'name' => 'Midterm Exam',
            'month' => 7,
            'order' => 3,
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);
    
    echo "✓ Added 3 events for July (Mid-Year Semester)\n";
    
    // Add August event
    DB::table('default_events')->insert([
        [
            'name' => 'Final Exam',
            'month' => 8,
            'order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);
    
    echo "✓ Added 1 event for August (Mid-Year Semester)\n\n";
    
    // Verify
    $julyEventsAfter = DB::table('default_events')->where('month', 7)->get();
    $augustEventsAfter = DB::table('default_events')->where('month', 8)->get();
    
    echo "July events:\n";
    foreach ($julyEventsAfter as $event) {
        echo "  - {$event->name} (order: {$event->order})\n";
    }
    
    echo "\nAugust events:\n";
    foreach ($augustEventsAfter as $event) {
        echo "  - {$event->name} (order: {$event->order})\n";
    }
    
    echo "\n✓ Mid-Year Semester events added successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
