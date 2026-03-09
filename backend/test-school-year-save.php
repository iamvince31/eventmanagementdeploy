<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Event;

echo "Testing School Year in Events Table\n";
echo "====================================\n\n";

// Get the most recent event
$latestEvent = Event::latest()->first();

if ($latestEvent) {
    echo "Latest Event:\n";
    echo "ID: " . $latestEvent->id . "\n";
    echo "Title: " . $latestEvent->title . "\n";
    echo "Date: " . $latestEvent->date . "\n";
    echo "School Year: " . ($latestEvent->school_year ?? 'NULL') . "\n\n";
} else {
    echo "No events found in database.\n\n";
}

// Check if school_year column exists
try {
    $columns = \DB::select("SHOW COLUMNS FROM events LIKE 'school_year'");
    if (count($columns) > 0) {
        echo "✓ school_year column EXISTS in events table\n";
        echo "Column details:\n";
        print_r($columns[0]);
    } else {
        echo "✗ school_year column DOES NOT EXIST in events table\n";
        echo "Please run the migration: php artisan migrate\n";
    }
} catch (\Exception $e) {
    echo "Error checking column: " . $e->getMessage() . "\n";
}

echo "\n";

// Show all events with their school years
echo "All Events with School Years:\n";
echo "-----------------------------\n";
$events = Event::select('id', 'title', 'date', 'school_year')->orderBy('date', 'desc')->limit(10)->get();

if ($events->count() > 0) {
    foreach ($events as $event) {
        echo sprintf(
            "ID: %d | %s | Date: %s | School Year: %s\n",
            $event->id,
            $event->title,
            $event->date,
            $event->school_year ?? 'NULL'
        );
    }
} else {
    echo "No events found.\n";
}
