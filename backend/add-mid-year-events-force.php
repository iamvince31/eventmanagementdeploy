<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Adding Mid-Year Semester events...\n\n";

try {
    // Check current events
    $julyEvents = DB::table('default_events')->where('month', 7)->get();
    $augustEvents = DB::table('default_events')->where('month', 8)->get();
    
    echo "Current July events:\n";
    foreach ($julyEvents as $event) {
        echo "  - {$event->name} (order: {$event->order})\n";
    }
    
    echo "\nCurrent August events:\n";
    if (count($augustEvents) === 0) {
        echo "  (No events)\n";
    } else {
        foreach ($augustEvents as $event) {
            echo "  - {$event->name} (order: {$event->order})\n";
        }
    }
    
    echo "\n";
    
    // Get the highest order for July
    $maxJulyOrder = DB::table('default_events')->where('month', 7)->max('order') ?? 0;
    
    // Add July events (Registration Period, Beginning of Classes, Midterm Exam)
    $julyEventsToAdd = [
        'Registration Period',
        'Beginning of Classes',
        'Midterm Exam'
    ];
    
    foreach ($julyEventsToAdd as $index => $eventName) {
        // Check if event already exists
        $exists = DB::table('default_events')
            ->where('month', 7)
            ->where('name', $eventName)
            ->exists();
        
        if (!$exists) {
            DB::table('default_events')->insert([
                'name' => $eventName,
                'month' => 7,
                'order' => $maxJulyOrder + $index + 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            echo "✓ Added: $eventName (July)\n";
        } else {
            echo "- Skipped: $eventName (already exists in July)\n";
        }
    }
    
    // Add August event (Final Exam)
    $augustEventExists = DB::table('default_events')
        ->where('month', 8)
        ->where('name', 'Final Exam')
        ->exists();
    
    if (!$augustEventExists) {
        DB::table('default_events')->insert([
            'name' => 'Final Exam',
            'month' => 8,
            'order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        echo "✓ Added: Final Exam (August)\n";
    } else {
        echo "- Skipped: Final Exam (already exists in August)\n";
    }
    
    echo "\n";
    
    // Verify final state
    $julyEventsAfter = DB::table('default_events')->where('month', 7)->orderBy('order')->get();
    $augustEventsAfter = DB::table('default_events')->where('month', 8)->orderBy('order')->get();
    
    echo "Final July events (" . count($julyEventsAfter) . " total):\n";
    foreach ($julyEventsAfter as $event) {
        echo "  {$event->order}. {$event->name}\n";
    }
    
    echo "\nFinal August events (" . count($augustEventsAfter) . " total):\n";
    foreach ($augustEventsAfter as $event) {
        echo "  {$event->order}. {$event->name}\n";
    }
    
    echo "\n✓ Mid-Year Semester events setup complete!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
