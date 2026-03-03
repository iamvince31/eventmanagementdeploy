<?php

/**
 * Delete Test Events in July and August 2026 and 2027
 * 
 * This script removes test academic events created in July (month 7) 
 * and August (month 8) for school years 2025-2026 and 2026-2027.
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\DefaultEvent;

echo "=== Delete July and August Test Events ===\n\n";

// School years to clean
$schoolYears = ['2025-2026', '2026-2027'];
$months = [7, 8]; // July and August

foreach ($schoolYears as $schoolYear) {
    echo "School Year: $schoolYear\n";
    echo str_repeat('-', 50) . "\n";
    
    foreach ($months as $month) {
        $monthName = $month === 7 ? 'July' : 'August';
        
        // Find events for this month and school year
        $events = DefaultEvent::where('month', $month)
            ->where('school_year', $schoolYear)
            ->get();
        
        if ($events->isEmpty()) {
            echo "  $monthName: No events found\n";
            continue;
        }
        
        echo "  $monthName: Found {$events->count()} event(s)\n";
        
        foreach ($events as $event) {
            echo "    - Deleting: {$event->name} (ID: {$event->id})\n";
            $event->delete();
        }
    }
    
    echo "\n";
}

echo "=== Cleanup Complete ===\n\n";

// Verify deletion
echo "Verification:\n";
echo str_repeat('-', 50) . "\n";

foreach ($schoolYears as $schoolYear) {
    foreach ($months as $month) {
        $monthName = $month === 7 ? 'July' : 'August';
        $count = DefaultEvent::where('month', $month)
            ->where('school_year', $schoolYear)
            ->count();
        
        echo "$schoolYear - $monthName: $count event(s) remaining\n";
    }
}

echo "\n✓ Done!\n";
