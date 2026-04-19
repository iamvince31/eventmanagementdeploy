<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminTestEventsSeeder extends Seeder
{
    public function run(): void
    {
        // ---------------------------------------------------------------------------
        // RESOLVE USERS
        // We try to pick users from different roles/departments so the admin Events
        // Management table shows events from a real variety of people.
        // ---------------------------------------------------------------------------
        $roles = [
            'Admin',
            'Dean',
            'CEIT Official',
            'Chairperson',
            'Coordinator',
            'Research Coordinator',
            'Extension Coordinator',
            'GAD Coordinator',
            'Faculty Member',
        ];

        // Collect up to 2 users per role (so we get good coverage without loading everyone)
        $hosts = collect();
        foreach ($roles as $role) {
            $users = User::where('role', $role)->take(2)->get();
            $hosts = $hosts->merge($users);
        }

        if ($hosts->isEmpty()) {
            $this->command->error('❌ No users found. Please run TestUsersSeeder first.');
            return;
        }

        $this->command->info("🔍 Found {$hosts->count()} host users across " . count($roles) . " roles.");

        // ---------------------------------------------------------------------------
        // SHARED DATA POOLS
        // ---------------------------------------------------------------------------
        $locations = [
            'CEIT Auditorium',
            'Main Gymnasium',
            'Conference Room A',
            'Conference Room B',
            'DIT Laboratory',
            'DCEA Building',
            'DAFE Hall',
            'DIET Room 101',
            'DCEEE Seminar Room',
            'Open Grounds',
            'Library AVR',
            'Online (Zoom)',
            'Dean\'s Office',
            'Faculty Lounge',
            'MIS Room',
        ];

        $personalColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

        // ---------------------------------------------------------------------------
        // EVENT DEFINITIONS
        // Format: title, description, date, time, type
        //   type: 'event' | 'meeting' | 'personal'
        // ---------------------------------------------------------------------------
        $eventDefinitions = [

            // ── COLLEGE-WIDE EVENTS ──────────────────────────────────────────────
            ['title' => 'CEIT College Foundation Day', 'description' => 'Annual celebration of the college\'s founding.', 'date' => '2025-09-06', 'time' => '08:00:00', 'type' => 'event'],
            ['title' => 'Engineering Week Opening Ceremony', 'description' => 'Kick-off ceremony for the annual engineering week.', 'date' => '2025-10-13', 'time' => '07:30:00', 'type' => 'event'],
            ['title' => 'Sports Fest Opening', 'description' => 'Opening ceremony of the inter-department sports festival.', 'date' => '2025-10-22', 'time' => '07:00:00', 'type' => 'event'],
            ['title' => 'Alumni Homecoming', 'description' => 'Annual alumni gathering and networking event.', 'date' => '2025-10-29', 'time' => '09:00:00', 'type' => 'event'],
            ['title' => 'Cultural Night', 'description' => 'Showcase of talents and cultural performances.', 'date' => '2025-11-21', 'time' => '17:00:00', 'type' => 'event'],
            ['title' => 'Christmas Party – CEIT', 'description' => 'Annual Christmas celebration for students and faculty.', 'date' => '2025-12-05', 'time' => '14:00:00', 'type' => 'event'],
            ['title' => 'Capstone Project Exhibit', 'description' => 'Public exhibition of graduating students\' capstone projects.', 'date' => '2026-03-11', 'time' => '08:00:00', 'type' => 'event'],
            ['title' => 'Inter-Department Quiz Bee', 'description' => 'Academic quiz competition between all departments.', 'date' => '2026-03-25', 'time' => '13:00:00', 'type' => 'event'],
            ['title' => 'Graduation Ceremony', 'description' => 'Commencement exercises for graduating students.', 'date' => '2026-05-13', 'time' => '08:00:00', 'type' => 'event'],
            ['title' => 'National Heroes Day Program', 'description' => 'Special program in honor of National Heroes Day.', 'date' => '2026-08-31', 'time' => '08:00:00', 'type' => 'event'],

            // ── SEMINARS & WORKSHOPS ─────────────────────────────────────────────
            ['title' => 'Seminar on Cybersecurity Trends', 'description' => 'Guest lecture covering the latest in cybersecurity.', 'date' => '2025-10-17', 'time' => '13:00:00', 'type' => 'event'],
            ['title' => 'Tech Talk: AI in Engineering', 'description' => 'Panel discussion on AI applications in engineering.', 'date' => '2025-11-12', 'time' => '13:00:00', 'type' => 'event'],
            ['title' => 'Seminar on Sustainable Engineering', 'description' => 'Talk on green and sustainable engineering practices.', 'date' => '2026-02-11', 'time' => '13:00:00', 'type' => 'event'],
            ['title' => 'Workshop on Technical Writing', 'description' => 'Hands-on workshop for faculty on technical writing skills.', 'date' => '2026-02-25', 'time' => '09:00:00', 'type' => 'event'],
            ['title' => 'Seminar on IoT Applications', 'description' => 'Seminar exploring real-world Internet of Things use-cases.', 'date' => '2026-04-15', 'time' => '13:00:00', 'type' => 'event'],
            ['title' => 'Workshop on Data Science', 'description' => 'Hands-on data science and analytics workshop.', 'date' => '2026-07-15', 'time' => '13:00:00', 'type' => 'event'],
            ['title' => 'Research Colloquium', 'description' => 'Presentation and peer review of ongoing research.', 'date' => '2025-09-15', 'time' => '13:00:00', 'type' => 'event'],
            ['title' => 'IT Skills Bootcamp', 'description' => 'Intensive hands-on IT skills training for students.', 'date' => '2025-09-20', 'time' => '10:00:00', 'type' => 'event'],
            ['title' => 'Faculty Development Training', 'description' => 'Professional development training program for faculty.', 'date' => '2026-03-18', 'time' => '08:00:00', 'type' => 'event'],
            ['title' => 'Student Leadership Summit', 'description' => 'Leadership training and team-building for student officers.', 'date' => '2025-11-05', 'time' => '08:00:00', 'type' => 'event'],

            // ── ACADEMIC EVENTS ──────────────────────────────────────────────────
            ['title' => 'Orientation for New Students', 'description' => 'Welcome orientation program for incoming freshmen.', 'date' => '2025-09-05', 'time' => '08:00:00', 'type' => 'event'],
            ['title' => 'Thesis Defense – Batch 1', 'description' => 'First batch of four-year thesis oral defenses.', 'date' => '2025-11-18', 'time' => '08:00:00', 'type' => 'event'],
            ['title' => 'Thesis Defense – Batch 2', 'description' => 'Second batch of thesis oral defenses.', 'date' => '2025-12-10', 'time' => '08:00:00', 'type' => 'event'],
            ['title' => 'Thesis Defense – Final Batch', 'description' => 'Final batch of thesis presentations.', 'date' => '2026-05-06', 'time' => '08:00:00', 'type' => 'event'],
            ['title' => 'Research Proposal Defense', 'description' => 'Formal defense of student research proposals.', 'date' => '2026-01-28', 'time' => '08:00:00', 'type' => 'event'],
            ['title' => 'Midterm Exam Week Kickoff', 'description' => 'Briefing and reminders before midterm examinations.', 'date' => '2025-10-06', 'time' => '08:00:00', 'type' => 'event'],
            ['title' => 'Final Exam Orientation', 'description' => 'Student briefing before final examinations.', 'date' => '2026-01-07', 'time' => '08:00:00', 'type' => 'event'],
            ['title' => 'Graduation Rehearsal', 'description' => 'Full rehearsal run for the graduation ceremony.', 'date' => '2026-01-14', 'time' => '08:00:00', 'type' => 'event'],
            ['title' => 'Enrollment Assistance Drive', 'description' => 'Faculty assistance deployment during enrollment period.', 'date' => '2026-02-04', 'time' => '08:00:00', 'type' => 'event'],
            ['title' => 'Student Council Elections', 'description' => 'Official student council election day.', 'date' => '2026-04-22', 'time' => '08:00:00', 'type' => 'event'],

            // ── MEETINGS ─────────────────────────────────────────────────────────
            ['title' => 'Faculty General Assembly', 'description' => 'Semestral general assembly meeting for all faculty.', 'date' => '2025-09-10', 'time' => '09:00:00', 'type' => 'meeting'],
            ['title' => 'Department Meeting – DIT', 'description' => 'Monthly department coordination meeting for DIT.', 'date' => '2025-09-25', 'time' => '14:00:00', 'type' => 'meeting'],
            ['title' => 'Department Meeting – DCEA', 'description' => 'Monthly department coordination meeting for DCEA.', 'date' => '2026-02-20', 'time' => '14:00:00', 'type' => 'meeting'],
            ['title' => 'Department Chairpersons Meeting', 'description' => 'Coordination meeting of all department chairpersons.', 'date' => '2025-11-27', 'time' => '10:00:00', 'type' => 'meeting'],
            ['title' => 'Year-End Faculty Meeting', 'description' => 'End-of-year faculty general assembly and reporting.', 'date' => '2025-12-15', 'time' => '09:00:00', 'type' => 'meeting'],
            ['title' => 'College Academic Council Meeting', 'description' => 'Quarterly review meeting of the academic council.', 'date' => '2026-03-04', 'time' => '09:00:00', 'type' => 'meeting'],
            ['title' => 'Program Accreditation Planning', 'description' => 'Planning session for upcoming accreditation requirements.', 'date' => '2025-10-08', 'time' => '14:00:00', 'type' => 'meeting'],
            ['title' => 'Research Committee Meeting', 'description' => 'Meeting to review ongoing and proposed research projects.', 'date' => '2025-11-03', 'time' => '10:00:00', 'type' => 'meeting'],
            ['title' => 'Extension Services Coordination', 'description' => 'Coordination of community extension service activities.', 'date' => '2025-12-02', 'time' => '09:00:00', 'type' => 'meeting'],
            ['title' => 'GAD Focal Meeting', 'description' => 'Gender and Development focal persons quarterly meeting.', 'date' => '2026-01-15', 'time' => '10:00:00', 'type' => 'meeting'],
            ['title' => 'Curriculum Review Meeting', 'description' => 'Review and update of program curriculum content.', 'date' => '2026-02-18', 'time' => '14:00:00', 'type' => 'meeting'],
            ['title' => 'Grade Submission Deadline Briefing', 'description' => 'Faculty reminder briefing for grade encoding deadlines.', 'date' => '2026-06-10', 'time' => '09:00:00', 'type' => 'meeting'],
            ['title' => 'Mid-Year Enrollment Briefing', 'description' => 'Pre-enrollment coordination meeting for mid-year semester.', 'date' => '2026-07-01', 'time' => '08:00:00', 'type' => 'meeting'],
            ['title' => 'Department Heads Coordination', 'description' => 'Bi-monthly heads coordination and reporting session.', 'date' => '2026-08-05', 'time' => '09:00:00', 'type' => 'meeting'],
            ['title' => 'Faculty Performance Review', 'description' => 'End-of-semester faculty performance evaluation discussion.', 'date' => '2026-06-17', 'time' => '10:00:00', 'type' => 'meeting'],

            // ── PERSONAL EVENTS ──────────────────────────────────────────────────
            ['title' => 'Lesson Planning Session', 'description' => 'Individual time block for lesson plan preparation.', 'date' => '2025-09-12', 'time' => '08:00:00', 'type' => 'personal'],
            ['title' => 'Research Writing Block', 'description' => 'Dedicated personal time for research paper writing.', 'date' => '2025-10-03', 'time' => '13:00:00', 'type' => 'personal'],
            ['title' => 'Consultation Hours', 'description' => 'Scheduled student consultation/advising session.', 'date' => '2025-10-10', 'time' => '14:00:00', 'type' => 'personal'],
            ['title' => 'Module Development', 'description' => 'Personal block for developing course module materials.', 'date' => '2025-11-07', 'time' => '09:00:00', 'type' => 'personal'],
            ['title' => 'Grading Period', 'description' => 'Reserved time for checking and encoding student grades.', 'date' => '2025-11-28', 'time' => '08:00:00', 'type' => 'personal'],
            ['title' => 'Paper Submission Deadline', 'description' => 'Personal reminder for journal paper submission.', 'date' => '2025-12-08', 'time' => '17:00:00', 'type' => 'personal'],
            ['title' => 'Self-Study: Machine Learning', 'description' => 'Personal study session on ML concepts and papers.', 'date' => '2026-01-09', 'time' => '13:00:00', 'type' => 'personal'],
            ['title' => 'Portfolio Update', 'description' => 'Time set aside to update professional teaching portfolio.', 'date' => '2026-01-23', 'time' => '10:00:00', 'type' => 'personal'],
            ['title' => 'Accreditation Document Prep', 'description' => 'Personal time for preparing accreditation documents.', 'date' => '2026-02-06', 'time' => '08:00:00', 'type' => 'personal'],
            ['title' => 'Team Sprint Planning', 'description' => 'Personal sprint planning for ongoing research project.', 'date' => '2026-03-06', 'time' => '09:00:00', 'type' => 'personal'],
            ['title' => 'Exam Paper Checking', 'description' => 'Reserved block for checking midterm examination papers.', 'date' => '2026-04-03', 'time' => '13:00:00', 'type' => 'personal'],
            ['title' => 'Community Extension Prep', 'description' => 'Personal prep work for upcoming extension service.', 'date' => '2026-04-10', 'time' => '08:00:00', 'type' => 'personal'],
            ['title' => 'Valentine Sports Event', 'description' => 'Fun sports activities for Valentine\'s week.', 'date' => '2026-02-13', 'time' => '07:00:00', 'type' => 'personal'],
            ['title' => 'Earth Day Awareness Drive', 'description' => 'Personal participation in Earth Day environmental activities.', 'date' => '2026-04-22', 'time' => '07:00:00', 'type' => 'personal'],
            ['title' => 'Faculty End-of-Year Celebration', 'description' => 'End of academic year faculty celebration hang-out.', 'date' => '2026-05-20', 'time' => '14:00:00', 'type' => 'personal'],
        ];

        // ---------------------------------------------------------------------------
        // CREATE EVENTS
        // We round-robin assign hosts so each user gets a variety of events.
        // ---------------------------------------------------------------------------
        $hostList = $hosts->values();
        $hostCount = $hostList->count();
        $created = 0;
        $locCount = count($locations);
        $colorCount = count($personalColors);

        foreach ($eventDefinitions as $i => $def) {
            $host = $hostList[$i % $hostCount];

            // Derive school year from date
            $year = (int)substr($def['date'], 0, 4);
            $month = (int)substr($def['date'], 5, 2);
            $schoolYear = ($month >= 9)
                ? "{$year}-" . ($year + 1)
                : ($year - 1) . "-{$year}";

            $isPersonal = $def['type'] === 'personal';
            $personalColor = $isPersonal ? $personalColors[$i % $colorCount] : null;

            // Personal events have no location (but the column is NOT NULL, so use empty string)
            $location = $isPersonal ? '' : $locations[$i % $locCount];

            Event::create([
                'title' => $def['title'],
                'description' => $def['description'],
                'location' => $location,
                'date' => $def['date'],
                'time' => $def['time'],
                'school_year' => $schoolYear,
                'host_id' => $host->id,
                'event_type' => $def['type'],
                'is_personal' => $isPersonal,
                'personal_color' => $personalColor,
            ]);

            $created++;
        }

        // ---------------------------------------------------------------------------
        // SUMMARY
        // ---------------------------------------------------------------------------
        $eventCount = collect($eventDefinitions)->where('type', 'event')->count();
        $meetingCount = collect($eventDefinitions)->where('type', 'meeting')->count();
        $personalCount = collect($eventDefinitions)->where('type', 'personal')->count();

        $this->command->info("\n╔══════════════════════════════════════════════════╗");
        $this->command->info("║       ADMIN TEST EVENTS SEEDER – SUMMARY         ║");
        $this->command->info("╚══════════════════════════════════════════════════╝");
        $this->command->info("  Total Events Created : {$created}");
        $this->command->info("    ├─ Events  (event)  : {$eventCount}");
        $this->command->info("    ├─ Meetings (meeting): {$meetingCount}");
        $this->command->info("    └─ Personal (personal): {$personalCount}");
        $this->command->info("  Distributed across   : {$hostCount} users");
        $this->command->info("  Date Range           : Sep 2025 – Aug 2026");
        $this->command->info("\n✅ Done!\n");
    }
}
