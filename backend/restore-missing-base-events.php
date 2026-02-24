<?php

/**
 * Maintenance Script: Restore Missing Base Events
 * 
 * This script checks for and restores any missing base events that may have been
 * accidentally modified when setting dates for school-year-specific versions.
 * 
 * Usage: php restore-missing-base-events.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\DefaultEvent;

echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║     Restore Missing Base Events - Maintenance Script          ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

// All expected base events from the seeder
$expectedEvents = [
    // September (month: 9)
    ['name' => 'Beginning of Classes', 'month' => 9, 'order' => 1],
    ['name' => 'Registration Period', 'month' => 9, 'order' => 2],
    ['name' => 'Last Day of Adding/Changing Subjects', 'month' => 9, 'order' => 3],

    // October (month: 10)
    ['name' => 'Last Day of Filing Application for Graduation', 'month' => 10, 'order' => 1],
    ['name' => 'Midterm Exam', 'month' => 10, 'order' => 2],

    // November (month: 11)
    ['name' => 'Student Evaluation for Teachers', 'month' => 11, 'order' => 1],

    // December (month: 12)
    ['name' => 'Last Day for Thesis Final Defense', 'month' => 12, 'order' => 1],
    ['name' => 'Last Day of Settlement of Deficiencies for Grad Students', 'month' => 12, 'order' => 2],
    ['name' => 'Christmas Break', 'month' => 12, 'order' => 3],

    // January (month: 1)
    ['name' => 'Final Exam (Graduating)', 'month' => 1, 'order' => 1],
    ['name' => 'Final Exam (Non-Grad)', 'month' => 1, 'order' => 2],
    ['name' => 'Last Day of Submission and Uploading of Grades', 'month' => 1, 'order' => 3],
    ['name' => 'Removal Examination', 'month' => 1, 'order' => 4],
    ['name' => 'Submission of Graduation Clearance', 'month' => 1, 'order' => 5],
    ['name' => 'Semestral Break', 'month' => 1, 'order' => 6],

    // February (month: 2)
    ['name' => 'Registration Period', 'month' => 2, 'order' => 1],
    ['name' => 'Beginning of Classes', 'month' => 2, 'order' => 2],
    ['name' => 'Last Day of Adding/Changing Subjects', 'month' => 2, 'order' => 3],

    // March (month: 3)
    ['name' => 'College Academic Student Council', 'month' => 3, 'order' => 1],
    ['name' => 'Last day of filing application for graduation', 'month' => 3, 'order' => 2],
    ['name' => 'Submission of Graduation Candidates List', 'month' => 3, 'order' => 3],

    // April (month: 4)
    ['name' => 'Midterm Exam', 'month' => 4, 'order' => 1],
    ['name' => 'Submission of Qualified Candidates for Graduation', 'month' => 4, 'order' => 2],
    ['name' => 'Student Evaluation for Teachers and Classroom Observation', 'month' => 4, 'order' => 3],
    ['name' => 'U-Games', 'month' => 4, 'order' => 4],

    // May (month: 5)
    ['name' => 'Last Day of Settlement of Deficiencies for Graduating Students', 'month' => 5, 'order' => 1],
    ['name' => 'Last Day for Thesis Final Defense', 'month' => 5, 'order' => 2],
    ['name' => 'Final Examination for Graduating', 'month' => 5, 'order' => 3],

    // June (month: 6)
    ['name' => 'Final Examination for Non-Graduating', 'month' => 6, 'order' => 1],
    ['name' => 'Last Day of Submission and Uploading of Grades', 'month' => 6, 'order' => 2],
    ['name' => 'Removal Examination', 'month' => 6, 'order' => 3],
    ['name' => 'Last Day of Submission of Report of Completion', 'month' => 6, 'order' => 4],
    ['name' => 'Submission of Manuscript', 'month' => 6, 'order' => 5],
    ['name' => 'Submission of Graduation Clearance', 'month' => 6, 'order' => 6],
    ['name' => 'College Academic Council Meeting', 'month' => 6, 'order' => 7],
    ['name' => 'Start of Vacation', 'month' => 6, 'order' => 8],
];

echo "Step 1: Checking for missing base events...\n";
echo str_repeat("─", 64) . "\n";

$missingEvents = [];
$restoredEvents = [];

foreach ($expectedEvents as $event) {
    $exists = DefaultEvent::where('name', $event['name'])
        ->where('month', $event['month'])
        ->whereNull('school_year')
        ->first();
    
    if (!$exists) {
        $missingEvents[] = $event;
        echo "❌ Missing: {$event['name']} (Month: {$event['month']})\n";
    }
}

if (count($missingEvents) === 0) {
    echo "✅ All base events are present!\n";
} else {
    echo "\nFound " . count($missingEvents) . " missing base event(s).\n\n";
    
    echo "Step 2: Restoring missing base events...\n";
    echo str_repeat("─", 64) . "\n";
    
    foreach ($missingEvents as $event) {
        try {
            DefaultEvent::create([
                'name' => $event['name'],
                'month' => $event['month'],
                'order' => $event['order'],
                'date' => null,
                'school_year' => null,
            ]);
            
            $restoredEvents[] = $event;
            echo "✅ Restored: {$event['name']} (Month: {$event['month']})\n";
        } catch (\Exception $e) {
            echo "❌ Failed to restore: {$event['name']} - " . $e->getMessage() . "\n";
        }
    }
}

echo "\n" . str_repeat("═", 64) . "\n";
echo "Summary:\n";
echo str_repeat("─", 64) . "\n";
echo "Total expected base events: " . count($expectedEvents) . "\n";
echo "Missing base events found: " . count($missingEvents) . "\n";
echo "Base events restored: " . count($restoredEvents) . "\n";

if (count($restoredEvents) > 0) {
    echo "\n✅ Successfully restored " . count($restoredEvents) . " base event(s)!\n";
} else if (count($missingEvents) === 0) {
    echo "\n✅ No action needed - all base events are present!\n";
} else {
    echo "\n⚠️  Some events could not be restored. Check the errors above.\n";
}

echo "\nStep 3: Verifying school-year-specific events...\n";
echo str_repeat("─", 64) . "\n";

$schoolYearEvents = DefaultEvent::whereNotNull('school_year')
    ->orderBy('school_year')
    ->orderBy('month')
    ->orderBy('order')
    ->get();

if ($schoolYearEvents->count() > 0) {
    echo "Found " . $schoolYearEvents->count() . " school-year-specific event(s):\n\n";
    
    $bySchoolYear = $schoolYearEvents->groupBy('school_year');
    foreach ($bySchoolYear as $schoolYear => $events) {
        echo "School Year: $schoolYear\n";
        foreach ($events as $event) {
            $monthName = date('F', mktime(0, 0, 0, $event->month, 1));
            echo "  • {$event->name} ({$monthName}) - Date: " . ($event->date ? $event->date->format('M d, Y') : 'Not set') . "\n";
        }
        echo "\n";
    }
} else {
    echo "No school-year-specific events found.\n";
}

echo str_repeat("═", 64) . "\n";
echo "✅ Maintenance complete!\n\n";
