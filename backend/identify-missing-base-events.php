<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\DefaultEvent;

echo "=== Identifying Missing Base Events ===\n\n";

// Expected events from the seeder
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

$missingEvents = [];
$foundEvents = [];

foreach ($expectedEvents as $expected) {
    $exists = DefaultEvent::where('name', $expected['name'])
        ->where('month', $expected['month'])
        ->whereNull('school_year')
        ->first();
    
    if (!$exists) {
        $missingEvents[] = $expected;
        echo "❌ MISSING: {$expected['name']} (Month: {$expected['month']})\n";
        
        // Check if school-year-specific version exists
        $schoolYearVersion = DefaultEvent::where('name', $expected['name'])
            ->where('month', $expected['month'])
            ->whereNotNull('school_year')
            ->get();
        
        if ($schoolYearVersion->count() > 0) {
            echo "   → Found school-year-specific versions:\n";
            foreach ($schoolYearVersion as $syv) {
                echo "      - ID: {$syv->id}, School Year: {$syv->school_year}, Date: " . ($syv->date ?? 'NULL') . "\n";
            }
        }
    } else {
        $foundEvents[] = $expected;
    }
}

echo "\n=== Summary ===\n";
echo "Total expected base events: " . count($expectedEvents) . "\n";
echo "Found base events: " . count($foundEvents) . "\n";
echo "Missing base events: " . count($missingEvents) . "\n";

if (count($missingEvents) > 0) {
    echo "\n=== Missing Events Details ===\n";
    foreach ($missingEvents as $event) {
        echo "- {$event['name']} (Month: {$event['month']}, Order: {$event['order']})\n";
    }
    
    echo "\n=== Migration Code to Restore ===\n";
    echo "Copy this into a migration file:\n\n";
    echo "foreach ([\n";
    foreach ($missingEvents as $event) {
        echo "    ['name' => '{$event['name']}', 'month' => {$event['month']}, 'order' => {$event['order']}],\n";
    }
    echo "] as \$event) {\n";
    echo "    DefaultEvent::create([\n";
    echo "        'name' => \$event['name'],\n";
    echo "        'month' => \$event['month'],\n";
    echo "        'order' => \$event['order'],\n";
    echo "        'date' => null,\n";
    echo "        'school_year' => null,\n";
    echo "    ]);\n";
    echo "}\n";
} else {
    echo "\n✅ All base events are present!\n";
}

echo "\n=== All School-Year-Specific Events ===\n";
$schoolYearEvents = DefaultEvent::whereNotNull('school_year')->orderBy('school_year')->orderBy('month')->get();
echo "Total: " . $schoolYearEvents->count() . "\n";
foreach ($schoolYearEvents as $event) {
    echo "- ID: {$event->id}, Name: {$event->name}, Month: {$event->month}, School Year: {$event->school_year}, Date: " . ($event->date ?? 'NULL') . "\n";
}
