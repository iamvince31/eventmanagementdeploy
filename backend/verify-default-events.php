<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\DefaultEvent;

echo "=== Default Events Verification ===\n\n";

$total = DefaultEvent::count();
echo "Total events: $total\n\n";

echo "Events by month:\n";
$byMonth = DefaultEvent::selectRaw('month, COUNT(*) as count')
    ->groupBy('month')
    ->orderBy('month')
    ->get();

foreach ($byMonth as $m) {
    echo "Month {$m->month}: {$m->count} events\n";
}

echo "\n=== Sample Events ===\n";
$samples = DefaultEvent::orderBy('month')->orderBy('order')->limit(5)->get();
foreach ($samples as $event) {
    echo "- {$event->name} (Month {$event->month}, Order {$event->order})\n";
}

echo "\n✅ Seeder verification complete!\n";
