<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\DefaultEvent;

echo "=== Testing Query for School Year 2026-2027 ===\n";
$schoolYear = '2026-2027';

$allEvents = DefaultEvent::where(function($q) use ($schoolYear) {
    $q->where('school_year', $schoolYear)
      ->orWhereNull('school_year');
})
->orderByRaw('CASE WHEN school_year IS NULL THEN 1 ELSE 0 END')
->orderBy('month')
->orderBy('order')
->get(['id', 'name', 'month', 'order', 'date', 'school_year']);

echo "Total events returned: " . $allEvents->count() . "\n\n";

echo "Events in February:\n";
foreach ($allEvents as $event) {
    if ($event->month == 2) {
        echo "  - ID: {$event->id}, Name: {$event->name}, School Year: " . ($event->school_year ?? 'NULL') . ", Date: " . ($event->date ?? 'NULL') . "\n";
    }
}

echo "\n=== All Base Events (school_year = NULL) ===\n";
$baseEvents = DefaultEvent::whereNull('school_year')->orderBy('month')->orderBy('order')->get();
echo "Total base events: " . $baseEvents->count() . "\n";

echo "\nBase events in February:\n";
foreach ($baseEvents as $event) {
    if ($event->month == 2) {
        echo "  - ID: {$event->id}, Name: {$event->name}\n";
    }
}

echo "\n=== All Events with school_year = 2025-2026 ===\n";
$sy2025Events = DefaultEvent::where('school_year', '2025-2026')->get();
echo "Total: " . $sy2025Events->count() . "\n";
foreach ($sy2025Events as $event) {
    echo "  - ID: {$event->id}, Name: {$event->name}, Month: {$event->month}\n";
}
