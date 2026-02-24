<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\DefaultEvent;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration ensures all base events from the seeder exist.
     * It will restore any base events that were accidentally modified
     * when setting dates for school-year-specific versions.
     */
    public function up(): void
    {
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

        $restoredCount = 0;
        
        foreach ($expectedEvents as $event) {
            // Check if base event exists
            $exists = DefaultEvent::where('name', $event['name'])
                ->where('month', $event['month'])
                ->whereNull('school_year')
                ->first();
            
            if (!$exists) {
                // Restore the missing base event
                DefaultEvent::create([
                    'name' => $event['name'],
                    'month' => $event['month'],
                    'order' => $event['order'],
                    'date' => null,
                    'school_year' => null,
                ]);
                
                $restoredCount++;
                echo "Restored base event: {$event['name']} (Month: {$event['month']})\n";
            }
        }
        
        if ($restoredCount > 0) {
            echo "Total base events restored: $restoredCount\n";
        } else {
            echo "All base events are present. No restoration needed.\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is for data restoration only
        // We don't want to delete base events on rollback
        echo "Rollback skipped - base events are preserved for data integrity.\n";
    }
};
