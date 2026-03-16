<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Checking Mid-Year Semester events...\n\n";

// Check July events
$julyEvents = DB::table('default_events')->where('month', 7)->get();
echo "July (Month 7) - " . count($julyEvents) . " events:\n";
foreach ($julyEvents as $event) {
    echo "  - {$event->name} (order: {$event->order}, id: {$event->id})\n";
}

echo "\n";

// Check August events
$augustEvents = DB::table('default_events')->where('month', 8)->get();
echo "August (Month 8) - " . count($augustEvents) . " events:\n";
foreach ($augustEvents as $event) {
    echo "  - {$event->name} (order: {$event->order}, id: {$event->id})\n";
}

if (count($augustEvents) === 0) {
    echo "  (No events)\n";
}
