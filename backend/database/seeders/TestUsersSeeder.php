<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\UserSchedule;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class TestUsersSeeder extends Seeder
{
    /**
     * Valid roles: Admin, Dean, CEIT Official, Chairperson,
     *              Department Research Coordinator, Department Extension Coordinator,
     *              Faculty Member
     *
     * All users are assigned a random department from the 5 actual departments.
     * No "Administration" or "CEIT" pseudo-departments.
     */

    private $departments = [
        'Department of Information Technology',
        'Department of Industrial Engineering and Technology',
        'Department of Computer, Electronics, and Electrical Engineering',
        'Department of Civil Engineering and Architecture',
        'Department of Agriculture and Food Engineering',
    ];

    private function randomDept(int $seed): string
    {
        return $this->departments[$seed % count($this->departments)];
    }

    private function generateSchedule(string $pattern, int $seed): array
    {
        $offsets = [0, 30, 60];
        $offset = $offsets[$seed % count($offsets)];

        $add = function (string $time, int $mins): string {
            [$h, $m] = explode(':', $time);
            $total = (int)$h * 60 + (int)$m + $mins;
            return sprintf('%02d:%02d', intdiv($total, 60), $total % 60);
        };

        $lectureLabels  = ['Class - Lecture', 'Class - Discussion', 'Class - Recitation', 'Class - Review', 'Class - Seminar'];
        $labLabels      = ['Class - Lab', 'Class - Workshop', 'Class - Practicum', 'Class - Studio', 'Class - Simulation'];
        $consultLabels  = ['Consultation Hours', 'Student Advising', 'Office Consultation', 'Academic Advising', 'Student Mentoring'];
        $researchLabels = ['Research / Prep', 'Research Work', 'Module Preparation', 'Curriculum Dev', 'Academic Research'];
        $adminLabels    = ['Administrative Meeting', 'Admin Coordination', 'Staff Meeting', 'Admin Review', 'Planning Session'];
        $officeLabels   = ['Office Hours', 'Open Office Hours', 'Faculty Office Hours', 'Student Drop-in', 'Office Consultation'];
        $deptLabels     = ['Department Meeting', 'Dept. Coordination', 'Dept. Review', 'Dept. Planning', 'Dept. Assembly'];
        $coordLabels    = ['Program Coordination', 'Program Review', 'Coordination Meeting', 'Program Planning', 'Coord. Session'];
        $currLabels     = ['Curriculum Review', 'Curriculum Planning', 'Accreditation Tasks', 'Program Assessment', 'Curriculum Dev'];
        $weeklyLabels   = ['Weekly Review', 'Weekly Wrap-up', 'End-of-Week Meeting', 'Weekly Summary', 'Weekly Planning'];

        $pick = fn(array $arr) => $arr[$seed % count($arr)];

        $dayRotations = [
            ['Monday', 'Tuesday',   'Wednesday', 'Thursday', 'Friday'],
            ['Monday', 'Wednesday', 'Tuesday',   'Friday',   'Thursday'],
            ['Tuesday', 'Monday',   'Thursday',  'Wednesday','Friday'],
            ['Wednesday','Monday',  'Friday',    'Tuesday',  'Thursday'],
            ['Thursday', 'Tuesday', 'Monday',    'Friday',   'Wednesday'],
        ];
        $days = $dayRotations[$seed % count($dayRotations)];

        if ($pattern === 'heavy') {
            return [
                ['day' => $days[0], 'start' => $add('07:30', $offset), 'end' => $add('09:00', $offset), 'desc' => $pick($admin)],
                ['day' => $days[0], 'start' => $add('10:00', $offset), 'end' => $add('12:00', $offset), 'desc' => $pick($office)],
                ['day' => $days[1], 'start' => $add('08:00', $offset), 'end' => $add('10:00', $offset), 'desc' => $pick($dept)],
                ['day' => $days[1], 'start' => $add('13:00', $offset), 'end' => $add('15:00', $offset), 'desc' => $pick($consult)],
                ['day' => $days[2], 'start' => $add('07:30', $offset), 'end' => $add('09:30', $offset), 'desc' => 'Faculty Meeting'],
                ['day' => $days[2], 'start' => $add('10:00', $offset), 'end' => $add('12:00', $offset), 'desc' => $pick($office)],
                ['day' => $days[3], 'start' => $add('08:00', $offset), 'end' => $add('10:00', $offset), 'desc' => 'Administrative Tasks'],
                ['day' => $days[3], 'start' => $add('13:00', $offset), 'end' => $add('15:00', $offset), 'desc' => $pick($consult)],
                ['day' => $days[4], 'start' => $add('07:30', $offset), 'end' => $add('09:00', $offset), 'desc' => $pick($weekly)],
                ['day' => $days[4], 'start' => $add('10:00', $offset), 'end' => $add('12:00', $offset), 'desc' => $pick($office)],
            ];
        }

        if ($pattern === 'faculty') {
            return [
                ['day' => $days[0], 'start' => $add('07:30', $offset), 'end' => $add('09:00', $offset), 'desc' => $pick($lecture)],
                ['day' => $days[0], 'start' => $add('10:30', $offset), 'end' => $add('12:00', $offset), 'desc' => $pick($lab)],
                ['day' => $days[1], 'start' => $add('08:00', $offset), 'end' => $add('09:30', $offset), 'desc' => $pick($lecture)],
                ['day' => $days[1], 'start' => $add('13:00', $offset), 'end' => $add('14:30', $offset), 'desc' => $pick($lecture)],
                ['day' => $days[2], 'start' => $add('07:30', $offset), 'end' => $add('09:00', $offset), 'desc' => $pick($lecture)],
                ['day' => $days[2], 'start' => $add('10:30', $offset), 'end' => $add('12:00', $offset), 'desc' => $pick($lab)],
                ['day' => $days[3], 'start' => $add('08:00', $offset), 'end' => $add('09:30', $offset), 'desc' => $pick($lecture)],
                ['day' => $days[3], 'start' => $add('13:00', $offset), 'end' => $add('14:30', $offset), 'desc' => $pick($consult)],
                ['day' => $days[4], 'start' => $add('07:30', $offset), 'end' => $add('09:00', $offset), 'desc' => $pick($lecture)],
                ['day' => $days[4], 'start' => $add('10:00', $offset), 'end' => $add('11:30', $offset), 'desc' => $pick($research)],
            ];
        }

        // coordinator
        return [
            ['day' => $days[0], 'start' => $add('08:00', $offset), 'end' => $add('10:00', $offset), 'desc' => $pick($coord)],
            ['day' => $days[0], 'start' => $add('13:00', $offset), 'end' => $add('15:00', $offset), 'desc' => $pick($office)],
            ['day' => $days[1], 'start' => $add('09:00', $offset), 'end' => $add('11:00', $offset), 'desc' => $pick($curr)],
            ['day' => $days[2], 'start' => $add('08:00', $offset), 'end' => $add('10:00', $offset), 'desc' => $pick($coord)],
            ['day' => $days[2], 'start' => $add('13:00', $offset), 'end' => $add('15:00', $offset), 'desc' => $pick($office)],
            ['day' => $days[3], 'start' => $add('09:00', $offset), 'end' => $add('11:00', $offset), 'desc' => $pick($curr)],
            ['day' => $days[4], 'start' => $add('08:00', $offset), 'end' => $add('10:00', $offset), 'desc' => $pick($weekly)],
        ];
    }

    public function run(): void
    {
        $departments = [
            'DAFE'  => 'Department of Agriculture and Food Engineering',
            'DCEEA' => 'Department of Civil Engineering and Architecture',
            'DCEEE' => 'Department of Computer, Electronics, and Electrical Engineering',
            'DIET'  => 'Department of Industrial Engineering and Technology',
            'DIT'   => 'Department of Information Technology',
        ];

        $testUsers = [];

        // ── 1. ADMIN ──────────────────────────────────────────────────────────
        $testUsers[] = [
            'name' => 'System Administrator',
            'first_name' => 'System', 'middle_name' => 'Root', 'last_name' => 'Administrator',
            'email' => 'admin@cvsu.edu.ph',
            'password' => Hash::make('11111111'),
            'department' => $this->randomDept(0),
            'designation' => 'Admin',
            'is_validated' => true, 'email_verified_at' => now(), 'schedule_initialized' => true,
            'schedule_pattern' => null,
        ];

        // ── 2. DEAN (random dept) ─────────────────────────────────────────────
        $testUsers[] = [
            'name' => 'Roberto Santos Rodriguez',
            'first_name' => 'Roberto', 'middle_name' => 'Santos', 'last_name' => 'Rodriguez',
            'email' => 'dean.rodriguez@cvsu.edu.ph',
            'password' => Hash::make('11111111'),
            'department' => $this->randomDept(1),
            'designation' => 'Dean',
            'is_validated' => true, 'email_verified_at' => now(), 'schedule_initialized' => true,
            'schedule_pattern' => 'heavy',
        ];

        // ── 3. CEIT OFFICIALS (10, each gets a random dept) ───────────────────
        $ceitOfficials = [
            ['first' => 'Maria',    'middle' => 'Elena',   'last' => 'Santos'],
            ['first' => 'Juan',     'middle' => 'Carlos',  'last' => 'Delacruz'],
            ['first' => 'Ana',      'middle' => 'Marie',   'last' => 'Reyes'],
            ['first' => 'Pedro',    'middle' => 'Luis',    'last' => 'Garcia'],
            ['first' => 'Sofia',    'middle' => 'Isabel',  'last' => 'Martinez'],
            ['first' => 'Miguel',   'middle' => 'Angel',   'last' => 'Fernandez'],
            ['first' => 'Carmen',   'middle' => 'Rosa',    'last' => 'Lopez'],
            ['first' => 'Diego',    'middle' => 'Jose',    'last' => 'Gonzales'],
            ['first' => 'Isabella', 'middle' => 'Grace',   'last' => 'Torres'],
            ['first' => 'Rafael',   'middle' => 'Antonio', 'last' => 'Ramos'],
        ];
        foreach ($ceitOfficials as $i => $o) {
            $n = $i + 1;
            $testUsers[] = [
                'name' => "{$o['first']} {$o['middle']} {$o['last']}",
                'first_name' => $o['first'], 'middle_name' => $o['middle'], 'last_name' => $o['last'],
                'email' => strtolower("{$o['first']}.{$o['last']}.ceit{$n}@cvsu.edu.ph"),
                'password' => Hash::make('11111111'),
                'department' => $this->randomDept($i + 2),
                'designation' => 'CEIT Official',
                'is_validated' => true, 'email_verified_at' => now(), 'schedule_initialized' => true,
                'schedule_pattern' => 'coordinator',
            ];
        }

        // ── 4. CEIT-LEVEL FACULTY (10, random depts) ─────────────────────────
        $ceitFaculty = [
            ['first' => 'Luzviminda', 'middle' => 'Perez',  'last' => 'Rivera'],
            ['first' => 'Arturo',     'middle' => 'Luis',   'last' => 'Gomez'],
            ['first' => 'Teresa',     'middle' => 'Ann',    'last' => 'Salvador'],
            ['first' => 'Enrique',    'middle' => 'Jose',   'last' => 'Villanueva'],
            ['first' => 'Josefina',   'middle' => 'Marie',  'last' => 'Mendoza'],
            ['first' => 'Rogelio',    'middle' => 'Pedro',  'last' => 'Cabrera'],
            ['first' => 'Beatrice',   'middle' => 'Mae',    'last' => 'Ramos'],
            ['first' => 'Guillermo',  'middle' => 'Juan',   'last' => 'Tolentino'],
            ['first' => 'Clarissa',   'middle' => 'Joy',    'last' => 'Navarro'],
            ['first' => 'Victor',     'middle' => 'Manuel', 'last' => 'Bautista'],
        ];
        foreach ($ceitFaculty as $i => $f) {
            $n = $i + 1;
            $testUsers[] = [
                'name' => "{$f['first']} {$f['middle']} {$f['last']}",
                'first_name' => $f['first'], 'middle_name' => $f['middle'], 'last_name' => $f['last'],
                'email' => strtolower("{$f['first']}.{$f['last']}.ceitfac{$n}@cvsu.edu.ph"),
                'password' => Hash::make('11111111'),
                'department' => $this->randomDept($i + 12),
                'designation' => 'Faculty Member',
                'is_validated' => true, 'email_verified_at' => now(), 'schedule_initialized' => true,
                'schedule_pattern' => 'faculty',
            ];
        }

        // ── 5. CHAIRPERSONS (1 per dept, assigned to that dept) ───────────────
        $chairpersons = [
            0 => ['first' => 'Maria',   'middle' => 'Santos', 'last' => 'Garcia'],
            1 => ['first' => 'John',    'middle' => 'Paul',   'last' => 'Rivera'],
            2 => ['first' => 'Sarah',   'middle' => 'Anne',   'last' => 'Reyes'],
            3 => ['first' => 'Michael', 'middle' => 'James',  'last' => 'Cruz'],
            4 => ['first' => 'Anna',    'middle' => 'Marie',  'last' => 'Delacruz'],
        ];
        foreach ($chairpersons as $deptIdx => $c) {
            $dept = $this->departments[$deptIdx];
            $slug = strtolower(preg_replace('/[^a-zA-Z]/', '', $dept));
            $testUsers[] = [
                'name' => "{$c['first']} {$c['middle']} {$c['last']}",
                'first_name' => $c['first'], 'middle_name' => $c['middle'], 'last_name' => $c['last'],
                'email' => strtolower("{$c['first']}.{$c['last']}.chair.d{$deptIdx}@cvsu.edu.ph"),
                'password' => Hash::make('11111111'),
                'department' => $dept,
                'designation' => 'Chairperson',
                'is_validated' => true, 'email_verified_at' => now(), 'schedule_initialized' => true,
                'schedule_pattern' => 'heavy',
            ];
        }

        // ── 6. DEPT RESEARCH COORDINATORS (1 per dept) ───────────────────────
        $researchCoords = [
            ['first' => 'Jose',      'middle' => 'Ramon', 'last' => 'Santos'],
            ['first' => 'Adoracion', 'middle' => 'Santos','last' => 'Delos Reyes'],
            ['first' => 'Maricel',   'middle' => 'Grace', 'last' => 'Flores'],
            ['first' => 'Teresita',  'middle' => 'Joy',   'last' => 'Domingo'],
            ['first' => 'Danilo',    'middle' => 'Miguel','last' => 'Pascual'],
        ];
        foreach ($researchCoords as $deptIdx => $p) {
            $dept = $this->departments[$deptIdx];
            $testUsers[] = [
                'name' => "{$p['first']} {$p['middle']} {$p['last']}",
                'first_name' => $p['first'], 'middle_name' => $p['middle'], 'last_name' => $p['last'],
                'email' => strtolower("{$p['first']}.{$p['last']}.rescoord.d{$deptIdx}@cvsu.edu.ph"),
                'password' => Hash::make('11111111'),
                'department' => $dept,
                'designation' => 'Department Research Coordinator',
                'is_validated' => true, 'email_verified_at' => now(), 'schedule_initialized' => true,
                'schedule_pattern' => 'coordinator',
            ];
        }

        // ── 7. DEPT EXTENSION COORDINATORS (1 per dept) ──────────────────────
        $extensionCoords = [
            ['first' => 'Rosario',  'middle' => 'Elena', 'last' => 'Cabrera'],
            ['first' => 'Lourdes',  'middle' => 'Mae',   'last' => 'Vargas'],
            ['first' => 'Ernesto',  'middle' => 'Pablo', 'last' => 'Salazar'],
            ['first' => 'Rodrigo',  'middle' => 'Jose',  'last' => 'Medina'],
            ['first' => 'Corazon',  'middle' => 'Isabel','last' => 'Espinosa'],
        ];
        foreach ($extensionCoords as $deptIdx => $p) {
            $dept = $this->departments[$deptIdx];
            $testUsers[] = [
                'name' => "{$p['first']} {$p['middle']} {$p['last']}",
                'first_name' => $p['first'], 'middle_name' => $p['middle'], 'last_name' => $p['last'],
                'email' => strtolower("{$p['first']}.{$p['last']}.extcoord.d{$deptIdx}@cvsu.edu.ph"),
                'password' => Hash::make('11111111'),
                'department' => $dept,
                'designation' => 'Department Extension Coordinator',
                'is_validated' => true, 'email_verified_at' => now(), 'schedule_initialized' => true,
                'schedule_pattern' => 'coordinator',
            ];
        }

        // ── 8. FACULTY MEMBERS (10 per dept = 50 total) ───────────────────────
        $facultyNames = [
            ['first' => 'Jennifer',  'middle' => 'Mae',    'last' => 'Lopez'],
            ['first' => 'Antonio',   'middle' => 'Carlos', 'last' => 'Gonzales'],
            ['first' => 'Lisa',      'middle' => 'Marie',  'last' => 'Villanueva'],
            ['first' => 'Ramon',     'middle' => 'Pedro',  'last' => 'Aquino'],
            ['first' => 'Diana',     'middle' => 'Grace',  'last' => 'Bautista'],
            ['first' => 'Eduardo',   'middle' => 'Luis',   'last' => 'Mendoza'],
            ['first' => 'Cristina',  'middle' => 'Joy',    'last' => 'Castro'],
            ['first' => 'Roberto',   'middle' => 'Jose',   'last' => 'Morales'],
            ['first' => 'Angela',    'middle' => 'Rose',   'last' => 'Navarro'],
            ['first' => 'Francisco', 'middle' => 'Miguel', 'last' => 'Ortiz'],
        ];
        foreach ($this->departments as $deptIdx => $deptName) {
            foreach ($facultyNames as $i => $f) {
                $n = $i + 1;
                $testUsers[] = [
                    'name' => "{$f['first']} {$f['middle']} {$f['last']}",
                    'first_name' => $f['first'], 'middle_name' => $f['middle'], 'last_name' => $f['last'],
                    'email' => strtolower("{$f['first']}.{$f['last']}.fac{$n}.d{$deptIdx}@cvsu.edu.ph"),
                    'password' => Hash::make('11111111'),
                    'department' => $deptName,
                    'designation' => 'Faculty Member',
                    'is_validated' => true, 'email_verified_at' => now(), 'schedule_initialized' => true,
                    'schedule_pattern' => 'faculty',
                ];
            }
        }

        // ── CREATE USERS + SCHEDULES ──────────────────────────────────────────
        $created = 0;
        $existing = 0;
        $schedulesCreated = 0;
        $now = now();

        DB::transaction(function () use ($testUsers, &$created, &$existing, &$schedulesCreated, $now) {
            foreach ($testUsers as $userIndex => $userData) {
                $pattern = $userData['schedule_pattern'];
                unset($userData['schedule_pattern']);

                $user = User::where('email', $userData['email'])->first();
                if (!$user) {
                    $user = User::create($userData);
                    $created++;
                } else {
                    $existing++;
                }

                if ($pattern && UserSchedule::where('user_id', $user->id)->doesntExist()) {
                    $slots = $this->generateSchedule($pattern, $userIndex);
                    $seedMonth = (int)$now->format('m');
                    $seedYear  = (int)$now->format('Y');
                    $seedSchoolYear = $seedMonth >= 9
                        ? "{$seedYear}-" . ($seedYear + 1)
                        : ($seedYear - 1) . "-{$seedYear}";
                    $seedSemester = ($seedMonth >= 9 || $seedMonth <= 1) ? 'first'
                        : (($seedMonth >= 2 && $seedMonth <= 6) ? 'second' : 'midyear');

                    $rows = [];
                    foreach ($slots as $slot) {
                        $rows[] = [
                            'user_id'     => $user->id,
                            'day'         => $slot['day'],
                            'start_time'  => $slot['start'],
                            'end_time'    => $slot['end'],
                            'description' => $slot['desc'],
                            'semester'    => $seedSemester,
                            'school_year' => $seedSchoolYear,
                            'created_at'  => $now,
                            'updated_at'  => $now,
                        ];
                    }
                    UserSchedule::insert($rows);
                    $schedulesCreated += count($rows);
                }
            }
        });

        // ── SUMMARY ───────────────────────────────────────────────────────────
        $total = count($testUsers);
        $this->command->info("\n╔══════════════════════════════════════════════╗");
        $this->command->info("║       TEST USERS SEEDER - SUMMARY            ║");
        $this->command->info("╚══════════════════════════════════════════════╝");
        $this->command->info("  Users Created:    {$created}");
        $this->command->info("  Already Existing: {$existing}");
        $this->command->info("  Total Users:      {$total}");
        $this->command->info("  Schedule Slots:   {$schedulesCreated}");
        $this->command->info("  Default Password: 11111111");
        $this->command->info("\n  Departments (all real, no pseudo-depts):");
        foreach ($this->departments as $d) {
            $this->command->info("    · {$d}");
        }
        $this->command->info("\n  Sample accounts (password: 11111111):");
        $this->command->info("    admin@cvsu.edu.ph  (Admin)");
        $this->command->info("    dean.rodriguez@cvsu.edu.ph  (Dean)");
        $this->command->info("    maria.santos.ceit1@cvsu.edu.ph  (CEIT Official)");
        $this->command->info("    anna.delacruz.chair.d4@cvsu.edu.ph  (Chairperson - DIT)");
        $this->command->info("    danilo.pascual.rescoord.d4@cvsu.edu.ph  (Dept Research Coord - DIT)");
        $this->command->info("    corazon.espinosa.extcoord.d4@cvsu.edu.ph  (Dept Extension Coord - DIT)");
        $this->command->info("    jennifer.lopez.fac1.d4@cvsu.edu.ph  (Faculty - DIT)");
        $this->command->info("\n✅ Done!\n");
    }
}
