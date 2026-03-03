<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Delete New Event from July 2026 ===\n\n";

try {
    // Find the event
    $event = DB::table('default_events')
        ->where('name', 'New Event')
        ->where('month', 7)
        ->where('school_year', '2025-2026')
        ->first();

    if ($event) {
        echo "Found event:\n";
        echo "ID: {$event->id}\n";
        echo "Name: {$event->name}\n";
        echo "Month: {$event->month}\n";
        echo "School Year: {$event->school_year}\n";
        echo "Date: " . ($event->date ?? 'Not set') . "\n\n";

        // Delete the event
        $deleted = DB::table('default_events')
            ->where('id', $event->id)
            ->delete();

        if ($deleted) {
            echo "✓ Successfully deleted the event!\n";
        } else {
            echo "✗ Failed to delete the event.\n";
        }
    } else {
        echo "No 'New Event' found in July 2026 (school year 2025-2026).\n";
        
        // Show all July 2026 events
        echo "\nAll events in July 2026:\n";
        $julyEvents = DB::table('default_events')
            ->where('month', 7)
            ->where('school_year', '2025-2026')
            ->get();
        
        if ($julyEvents->isEmpty()) {
            echo "No events found in July 2026.\n";
        } else {
            foreach ($julyEvents as $evt) {
                echo "- ID: {$evt->id}, Name: {$evt->name}, Date: " . ($evt->date ?? 'Not set') . "\n";
            }
        }
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Done ===\n";
