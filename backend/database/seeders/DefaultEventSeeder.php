<?php

namespace Database\Seeders;

use App\Models\DefaultEvent;
use Illuminate\Database\Seeder;

class DefaultEventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $events = [
            // September (month: 9) - 3 events
            ['name' => 'Beginning of Classes', 'month' => 9, 'order' => 1],
            ['name' => 'Registration Period', 'month' => 9, 'order' => 2],
            ['name' => 'Last Day of Adding/Changing Subjects', 'month' => 9, 'order' => 3],

            // October (month: 10) - 2 events
            ['name' => 'Last Day of Filing Application for Graduation', 'month' => 10, 'order' => 1],
            ['name' => 'Midterm Exam', 'month' => 10, 'order' => 2],

            // November (month: 11) - 1 event
            ['name' => 'Student Evaluation for Teachers', 'month' => 11, 'order' => 1],

            // December (month: 12) - 3 events
            ['name' => 'Last Day for Thesis Final Defense', 'month' => 12, 'order' => 1],
            ['name' => 'Last Day of Settlement of Deficiencies for Grad Students', 'month' => 12, 'order' => 2],
            ['name' => 'Christmas Break', 'month' => 12, 'order' => 3],

            // January (month: 1) - 6 events
            ['name' => 'Final Exam (Graduating)', 'month' => 1, 'order' => 1],
            ['name' => 'Final Exam (Non-Grad)', 'month' => 1, 'order' => 2],
            ['name' => 'Last Day of Submission and Uploading of Grades', 'month' => 1, 'order' => 3],
            ['name' => 'Removal Examination', 'month' => 1, 'order' => 4],
            ['name' => 'Submission of Graduation Clearance', 'month' => 1, 'order' => 5],
            ['name' => 'Semestral Break', 'month' => 1, 'order' => 6],

            // February (month: 2) - 3 events
            ['name' => 'Registration Period', 'month' => 2, 'order' => 1],
            ['name' => 'Beginning of Classes', 'month' => 2, 'order' => 2],
            ['name' => 'Last Day of Adding/Changing Subjects', 'month' => 2, 'order' => 3],

            // March (month: 3) - 3 events
            ['name' => 'College Academic Student Council', 'month' => 3, 'order' => 1],
            ['name' => 'Last day of filing application for graduation', 'month' => 3, 'order' => 2],
            ['name' => 'Submission of Graduation Candidates List', 'month' => 3, 'order' => 3],

            // April (month: 4) - 4 events
            ['name' => 'Midterm Exam', 'month' => 4, 'order' => 1],
            ['name' => 'Submission of Qualified Candidates for Graduation', 'month' => 4, 'order' => 2],
            ['name' => 'Student Evaluation for Teachers and Classroom Observation', 'month' => 4, 'order' => 3],
            ['name' => 'U-Games', 'month' => 4, 'order' => 4],

            // May (month: 5) - 3 events
            ['name' => 'Last Day of Settlement of Deficiencies for Graduating Students', 'month' => 5, 'order' => 1],
            ['name' => 'Last Day for Thesis Final Defense', 'month' => 5, 'order' => 2],
            ['name' => 'Final Examination for Graduating', 'month' => 5, 'order' => 3],

            // June (month: 6) - 8 events
            ['name' => 'Final Examination for Non-Graduating', 'month' => 6, 'order' => 1],
            ['name' => 'Last Day of Submission and Uploading of Grades', 'month' => 6, 'order' => 2],
            ['name' => 'Removal Examination', 'month' => 6, 'order' => 3],
            ['name' => 'Last Day of Submission of Report of Completion', 'month' => 6, 'order' => 4],
            ['name' => 'Submission of Manuscript', 'month' => 6, 'order' => 5],
            ['name' => 'Submission of Graduation Clearance', 'month' => 6, 'order' => 6],
            ['name' => 'College Academic Council Meeting', 'month' => 6, 'order' => 7],
            ['name' => 'Start of Vacation', 'month' => 6, 'order' => 8],

            // July (month: 7) - Mid-Year Semester - 3 events
            ['name' => 'Registration Period', 'month' => 7, 'order' => 1],
            ['name' => 'Beginning of Classes', 'month' => 7, 'order' => 2],
            ['name' => 'Midterm Exam', 'month' => 7, 'order' => 3],

            // August (month: 8) - Mid-Year Semester - 1 event
            ['name' => 'Final Exam', 'month' => 8, 'order' => 1],
        ];

        foreach ($events as $event) {
            DefaultEvent::create($event);
        }
    }
}
