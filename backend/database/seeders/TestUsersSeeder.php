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
     * Structure:
     * - College of Engineering and Information Technology (CEIT):
     *     1 Dean, 10 CEIT Officials, 10 Coordinators
     * - Per Department (5 departments):
     *     1 Chairperson
     *     1 Research Coordinator
     *     1 Extension Coordinator
     *     1 GAD Coordinator
     *     10 Faculty Members
     *
     * Valid roles: Admin, Dean, CEIT Official, Chairperson,
     *              Coordinator, Research Coordinator, Extension Coordinator,
     *              GAD Coordinator, Faculty Member
     */

    private function generateSchedule(string $pattern, int $seed): array
    {
        // Time offset pool: 0, 30, 60 minutes — cycles through based on seed
        $offsets = [0, 30, 60]; // minutes
        $offset = $offsets[$seed % count($offsets)];

        $addMinutes = function (string $time, int $mins): string {
            [$h, $m] = explode(':', $time);
            $total = (int)$h * 60 + (int)$m + $mins;
            return sprintf('%02d:%02d', intdiv($total, 60), $total % 60);
        };

        // Rotate label variants so descriptions differ per user
        $lectureLabels = ['Class - Lecture', 'Class - Discussion', 'Class - Recitation', 'Class - Review', 'Class - Seminar'];
        $labLabels = ['Class - Lab', 'Class - Workshop', 'Class - Practicum', 'Class - Studio', 'Class - Simulation'];
        $consultLabels = ['Consultation Hours', 'Student Advising', 'Office Consultation', 'Academic Advising', 'Student Mentoring'];
        $researchLabels = ['Research / Prep', 'Research Work', 'Module Preparation', 'Curriculum Dev', 'Academic Research'];
        $adminLabels = ['Administrative Meeting', 'Admin Coordination', 'Staff Meeting', 'Admin Review', 'Planning Session'];
        $officeLabels = ['Office Hours', 'Open Office Hours', 'Faculty Office Hours', 'Student Drop-in', 'Office Consultation'];
        $deptLabels = ['Department Meeting', 'Dept. Coordination', 'Dept. Review', 'Dept. Planning', 'Dept. Assembly'];
        $coordLabels = ['Program Coordination', 'Program Review', 'Coordination Meeting', 'Program Planning', 'Coord. Session'];
        $currLabels = ['Curriculum Review', 'Curriculum Planning', 'Accreditation Tasks', 'Program Assessment', 'Curriculum Dev'];
        $weeklyLabels = ['Weekly Review', 'Weekly Wrap-up', 'End-of-Week Meeting', 'Weekly Summary', 'Weekly Planning'];

        $pick = fn(array $arr) => $arr[$seed % count($arr)];

        $dayRotations = [
            [0 => 'Monday', 1 => 'Tuesday', 2 => 'Wednesday', 3 => 'Thursday', 4 => 'Friday'],
            [0 => 'Monday', 1 => 'Wednesday', 2 => 'Tuesday', 3 => 'Friday', 4 => 'Thursday'],
            [0 => 'Tuesday', 1 => 'Monday', 2 => 'Thursday', 3 => 'Wednesday', 4 => 'Friday'],
            [0 => 'Wednesday', 1 => 'Monday', 2 => 'Friday', 3 => 'Tuesday', 4 => 'Thursday'],
            [0 => 'Thursday', 1 => 'Tuesday', 2 => 'Monday', 3 => 'Friday', 4 => 'Wednesday'],
        ];
        $days = $dayRotations[$seed % count($dayRotations)];

        if ($pattern === 'heavy') {
            return [
                ['day' => $days[0], 'start' => $addMinutes('07:30', $offset), 'end' => $addMinutes('09:00', $offset), 'desc' => $pick($adminLabels)],
                ['day' => $days[0], 'start' => $addMinutes('10:00', $offset), 'end' => $addMinutes('12:00', $offset), 'desc' => $pick($officeLabels)],
                ['day' => $days[1], 'start' => $addMinutes('08:00', $offset), 'end' => $addMinutes('10:00', $offset), 'desc' => $pick($deptLabels)],
                ['day' => $days[1], 'start' => $addMinutes('13:00', $offset), 'end' => $addMinutes('15:00', $offset), 'desc' => $pick($consultLabels)],
                ['day' => $days[2], 'start' => $addMinutes('07:30', $offset), 'end' => $addMinutes('09:30', $offset), 'desc' => 'Faculty Meeting'],
                ['day' => $days[2], 'start' => $addMinutes('10:00', $offset), 'end' => $addMinutes('12:00', $offset), 'desc' => $pick($officeLabels)],
                ['day' => $days[3], 'start' => $addMinutes('08:00', $offset), 'end' => $addMinutes('10:00', $offset), 'desc' => 'Administrative Tasks'],
                ['day' => $days[3], 'start' => $addMinutes('13:00', $offset), 'end' => $addMinutes('15:00', $offset), 'desc' => $pick($consultLabels)],
                ['day' => $days[4], 'start' => $addMinutes('07:30', $offset), 'end' => $addMinutes('09:00', $offset), 'desc' => $pick($weeklyLabels)],
                ['day' => $days[4], 'start' => $addMinutes('10:00', $offset), 'end' => $addMinutes('12:00', $offset), 'desc' => $pick($officeLabels)],
            ];
        }

        if ($pattern === 'faculty') {
            return [
                ['day' => $days[0], 'start' => $addMinutes('07:30', $offset), 'end' => $addMinutes('09:00', $offset), 'desc' => $pick($lectureLabels)],
                ['day' => $days[0], 'start' => $addMinutes('10:30', $offset), 'end' => $addMinutes('12:00', $offset), 'desc' => $pick($labLabels)],
                ['day' => $days[1], 'start' => $addMinutes('08:00', $offset), 'end' => $addMinutes('09:30', $offset), 'desc' => $pick($lectureLabels)],
                ['day' => $days[1], 'start' => $addMinutes('13:00', $offset), 'end' => $addMinutes('14:30', $offset), 'desc' => $pick($lectureLabels)],
                ['day' => $days[2], 'start' => $addMinutes('07:30', $offset), 'end' => $addMinutes('09:00', $offset), 'desc' => $pick($lectureLabels)],
                ['day' => $days[2], 'start' => $addMinutes('10:30', $offset), 'end' => $addMinutes('12:00', $offset), 'desc' => $pick($labLabels)],
                ['day' => $days[3], 'start' => $addMinutes('08:00', $offset), 'end' => $addMinutes('09:30', $offset), 'desc' => $pick($lectureLabels)],
                ['day' => $days[3], 'start' => $addMinutes('13:00', $offset), 'end' => $addMinutes('14:30', $offset), 'desc' => $pick($consultLabels)],
                ['day' => $days[4], 'start' => $addMinutes('07:30', $offset), 'end' => $addMinutes('09:00', $offset), 'desc' => $pick($lectureLabels)],
                ['day' => $days[4], 'start' => $addMinutes('10:00', $offset), 'end' => $addMinutes('11:30', $offset), 'desc' => $pick($researchLabels)],
            ];
        }

        // coordinator
        return [
            ['day' => $days[0], 'start' => $addMinutes('08:00', $offset), 'end' => $addMinutes('10:00', $offset), 'desc' => $pick($coordLabels)],
            ['day' => $days[0], 'start' => $addMinutes('13:00', $offset), 'end' => $addMinutes('15:00', $offset), 'desc' => $pick($officeLabels)],
            ['day' => $days[1], 'start' => $addMinutes('09:00', $offset), 'end' => $addMinutes('11:00', $offset), 'desc' => $pick($currLabels)],
            ['day' => $days[2], 'start' => $addMinutes('08:00', $offset), 'end' => $addMinutes('10:00', $offset), 'desc' => $pick($coordLabels)],
            ['day' => $days[2], 'start' => $addMinutes('13:00', $offset), 'end' => $addMinutes('15:00', $offset), 'desc' => $pick($officeLabels)],
            ['day' => $days[3], 'start' => $addMinutes('09:00', $offset), 'end' => $addMinutes('11:00', $offset), 'desc' => $pick($currLabels)],
            ['day' => $days[4], 'start' => $addMinutes('08:00', $offset), 'end' => $addMinutes('10:00', $offset), 'desc' => $pick($weeklyLabels)],
        ];
    }

    public function run(): void
    {
        $departments = [
            'DAFE' => 'Department of Agriculture and Food Engineering',
            'DCEA' => 'Department of Civil Engineering',
            'DCEEE' => 'Department of Computer, Electronics, and Electrical Engineering',
            'DIET' => 'Department of Industrial Engineering and Technology',
            'DIT' => 'Department of Information Technology',
        ];


        $testUsers = [];

        // ========================================
        // 1. ADMIN
        // ========================================
        $testUsers[] = [
            'name' => 'System Administrator',
            'first_name' => 'System',
            'middle_name' => 'Root',
            'last_name' => 'Administrator',
            'email' => 'admin@cvsu.edu.ph',
            'password' => Hash::make('11111111'),
            'department' => 'Administration',
            'designation' => 'Admin',
            'is_validated' => true,
            'email_verified_at' => now(),
            'schedule_initialized' => true,
            'schedule_pattern' => null,
        ];

        // ========================================
        // 2. DEAN (1 - College level)
        // ========================================
        $testUsers[] = [
            'name' => 'Roberto Santos Rodriguez',
            'first_name' => 'Roberto',
            'middle_name' => 'Santos',
            'last_name' => 'Rodriguez',
            'email' => 'dean.rodriguez@cvsu.edu.ph',
            'password' => Hash::make('11111111'),
            'department' => 'College of Engineering and Information Technology',
            'designation' => 'Dean',
            'is_validated' => true,
            'email_verified_at' => now(),
            'schedule_initialized' => true,
            'schedule_pattern' => 'heavy',
        ];

        // ========================================
        // 3. CEIT OFFICIALS (10 - College level)
        // ========================================
        $ceitOfficials = [
            ['first' => 'Maria', 'middle' => 'Elena', 'last' => 'Santos'],
            ['first' => 'Juan', 'middle' => 'Carlos', 'last' => 'Delacruz'],
            ['first' => 'Ana', 'middle' => 'Marie', 'last' => 'Reyes'],
            ['first' => 'Pedro', 'middle' => 'Luis', 'last' => 'Garcia'],
            ['first' => 'Sofia', 'middle' => 'Isabel', 'last' => 'Martinez'],
            ['first' => 'Miguel', 'middle' => 'Angel', 'last' => 'Fernandez'],
            ['first' => 'Carmen', 'middle' => 'Rosa', 'last' => 'Lopez'],
            ['first' => 'Diego', 'middle' => 'Jose', 'last' => 'Gonzales'],
            ['first' => 'Isabella', 'middle' => 'Grace', 'last' => 'Torres'],
            ['first' => 'Rafael', 'middle' => 'Antonio', 'last' => 'Ramos'],
        ];

        foreach ($ceitOfficials as $index => $official) {
            $n = $index + 1;
            $testUsers[] = [
                'name' => "{$official['first']} {$official['middle']} {$official['last']}",
                'first_name' => $official['first'],
                'middle_name' => $official['middle'],
                'last_name' => $official['last'],
                'email' => strtolower("{$official['first']}.{$official['last']}.ceit{$n}@cvsu.edu.ph"),
                'password' => Hash::make('11111111'),
                'department' => 'College of Engineering and Information Technology',
                'designation' => 'CEIT Official',
                'is_validated' => true,
                'email_verified_at' => now(),
                'schedule_initialized' => true,
                'schedule_pattern' => 'coordinator',
            ];
        }

        // ========================================
        // 4. COORDINATORS (10 - College level, role = 'Coordinator')
        // ========================================
        $coordinators = [
            ['first' => 'Carlos', 'middle' => 'Miguel', 'last' => 'Aquino'],
            ['first' => 'Elena', 'middle' => 'Rose', 'last' => 'Mendoza'],
            ['first' => 'David', 'middle' => 'Luis', 'last' => 'Bautista'],
            ['first' => 'Patricia', 'middle' => 'Joy', 'last' => 'Villanueva'],
            ['first' => 'Ricardo', 'middle' => 'Jose', 'last' => 'Castro'],
            ['first' => 'Lucia', 'middle' => 'Mae', 'last' => 'Morales'],
            ['first' => 'Fernando', 'middle' => 'Pablo', 'last' => 'Navarro'],
            ['first' => 'Gabriela', 'middle' => 'Luz', 'last' => 'Ortiz'],
            ['first' => 'Alejandro', 'middle' => 'Manuel', 'last' => 'Perez'],
            ['first' => 'Valentina', 'middle' => 'Sofia', 'last' => 'Ramirez'],
        ];

        foreach ($coordinators as $index => $coordinator) {
            $n = $index + 1;
            $testUsers[] = [
                'name' => "{$coordinator['first']} {$coordinator['middle']} {$coordinator['last']}",
                'first_name' => $coordinator['first'],
                'middle_name' => $coordinator['middle'],
                'last_name' => $coordinator['last'],
                'email' => strtolower("{$coordinator['first']}.{$coordinator['last']}.coord{$n}@cvsu.edu.ph"),
                'password' => Hash::make('11111111'),
                'department' => 'College of Engineering and Information Technology',
                'designation' => 'Coordinator',
                'is_validated' => true,
                'email_verified_at' => now(),
                'schedule_initialized' => true,
                'schedule_pattern' => 'coordinator',
            ];
        }

        // ========================================
        // 4.5. CEIT FACULTY MEMBERS (10 - College level, role = 'Faculty Member')
        // ========================================
        $ceitFaculty = [
            ['first' => 'Luzviminda', 'middle' => 'Perez', 'last' => 'Rivera'],
            ['first' => 'Arturo', 'middle' => 'Luis', 'last' => 'Gomez'],
            ['first' => 'Teresa', 'middle' => 'Ann', 'last' => 'Salvador'],
            ['first' => 'Enrique', 'middle' => 'Jose', 'last' => 'Villanueva'],
            ['first' => 'Josefina', 'middle' => 'Marie', 'last' => 'Mendoza'],
            ['first' => 'Rogelio', 'middle' => 'Pedro', 'last' => 'Cabrera'],
            ['first' => 'Beatrice', 'middle' => 'Mae', 'last' => 'Ramos'],
            ['first' => 'Guillermo', 'middle' => 'Juan', 'last' => 'Tolentino'],
            ['first' => 'Clarissa', 'middle' => 'Joy', 'last' => 'Navarro'],
            ['first' => 'Victor', 'middle' => 'Manuel', 'last' => 'Bautista'],
        ];

        foreach ($ceitFaculty as $index => $faculty) {
            $n = $index + 1;
            $testUsers[] = [
                'name' => "{$faculty['first']} {$faculty['middle']} {$faculty['last']}",
                'first_name' => $faculty['first'],
                'middle_name' => $faculty['middle'],
                'last_name' => $faculty['last'],
                'email' => strtolower("{$faculty['first']}.{$faculty['last']}.ceitfac{$n}@cvsu.edu.ph"),
                'password' => Hash::make('11111111'),
                'department' => 'College of Engineering and Information Technology',
                'designation' => 'Faculty Member',
                'is_validated' => true,
                'email_verified_at' => now(),
                'schedule_initialized' => true,
                'schedule_pattern' => 'faculty',
            ];
        }

        // ========================================
        // 5. CHAIRPERSONS (1 per department = 5 total)
        // ========================================
        $chairpersons = [
            'DAFE' => ['first' => 'Maria', 'middle' => 'Santos', 'last' => 'Garcia'],
            'DCEEE' => ['first' => 'John', 'middle' => 'Paul', 'last' => 'Rivera'],
            'DCEA' => ['first' => 'Sarah', 'middle' => 'Anne', 'last' => 'Reyes'],
            'DIET' => ['first' => 'Michael', 'middle' => 'James', 'last' => 'Cruz'],
            'DIT' => ['first' => 'Anna', 'middle' => 'Marie', 'last' => 'Delacruz'],
        ];

        foreach ($chairpersons as $deptCode => $chair) {
            $testUsers[] = [
                'name' => "{$chair['first']} {$chair['middle']} {$chair['last']}",
                'first_name' => $chair['first'],
                'middle_name' => $chair['middle'],
                'last_name' => $chair['last'],
                'email' => strtolower("{$chair['first']}.{$chair['last']}.chair.{$deptCode}@cvsu.edu.ph"),
                'password' => Hash::make('11111111'),
                'department' => $departments[$deptCode],
                'designation' => 'Chairperson',
                'is_validated' => true,
                'email_verified_at' => now(),
                'schedule_initialized' => true,
                'schedule_pattern' => 'heavy',
            ];
        }

        // ========================================
        // 6. CEIT FACULTY MEMBERS (10 - College level)
        // ========================================
        $ceitFaculty = [
            ['first' => 'Bernard', 'middle' => 'Luis', 'last' => 'Castillo'],
            ['first' => 'Rowena', 'middle' => 'Grace', 'last' => 'Dela Rosa'],
            ['first' => 'Nestor', 'middle' => 'Jose', 'last' => 'Evangelista'],
            ['first' => 'Maribel', 'middle' => 'Anne', 'last' => 'Fajardo'],
            ['first' => 'Gregorio', 'middle' => 'Pablo', 'last' => 'Gutierrez'],
            ['first' => 'Leonora', 'middle' => 'Mae', 'last' => 'Hidalgo'],
            ['first' => 'Arsenio', 'middle' => 'Carlos', 'last' => 'Ignacio'],
            ['first' => 'Perpetua', 'middle' => 'Rosa', 'last' => 'Jacinto'],
            ['first' => 'Wilfredo', 'middle' => 'Angel', 'last' => 'Lacson'],
            ['first' => 'Consolacion', 'middle' => 'Isabel', 'last' => 'Macapagal'],
        ];

        foreach ($ceitFaculty as $index => $faculty) {
            $n = $index + 1;
            $testUsers[] = [
                'name' => "{$faculty['first']} {$faculty['middle']} {$faculty['last']}",
                'first_name' => $faculty['first'],
                'middle_name' => $faculty['middle'],
                'last_name' => $faculty['last'],
                'email' => strtolower("{$faculty['first']}.{$faculty['last']}.fac{$n}.CEIT@cvsu.edu.ph"),
                'password' => Hash::make('11111111'),
                'department' => 'College of Engineering and Information Technology',
                'designation' => 'Faculty Member',
                'is_validated' => true,
                'email_verified_at' => now(),
                'schedule_initialized' => true,
                'schedule_pattern' => 'faculty',
            ];
        }

        // ========================================
        // 7. DEPARTMENT COORDINATORS (3 types × 5 departments = 15 total)
        // Research Coordinator, Extension Coordinator, GAD Coordinator
        // ========================================
        $deptCoordinators = [
            'Program Coordinator' => [
                'abbrev' => 'progcoord',
                'people' => [
                    'DAFE' => ['first' => 'Herminia', 'middle' => 'Cruz', 'last' => 'Buenaventura'],
                    'DCEEE' => ['first' => 'Simplicio', 'middle' => 'Reyes', 'last' => 'Catalan'],
                    'DCEA' => ['first' => 'Adoracion', 'middle' => 'Santos', 'last' => 'Delos Reyes'],
                    'DIET' => ['first' => 'Prudencio', 'middle' => 'Garcia', 'last' => 'Enriquez'],
                    'DIT' => ['first' => 'Filomena', 'middle' => 'Lopez', 'last' => 'Fuentes'],
                ],
            ],
            'Research Coordinator' => [
                'abbrev' => 'rescoord',
                'people' => [
                    'DAFE' => ['first' => 'Jose', 'middle' => 'Ramon', 'last' => 'Santos'],
                    'DCEEE' => ['first' => 'Maricel', 'middle' => 'Grace', 'last' => 'Flores'],
                    'DCEA' => ['first' => 'Renato', 'middle' => 'Luis', 'last' => 'Aguilar'],
                    'DIET' => ['first' => 'Teresita', 'middle' => 'Joy', 'last' => 'Domingo'],
                    'DIT' => ['first' => 'Danilo', 'middle' => 'Miguel', 'last' => 'Pascual'],
                ],
            ],
            'Extension Coordinator' => [
                'abbrev' => 'extcoord',
                'people' => [
                    'DAFE' => ['first' => 'Rosario', 'middle' => 'Elena', 'last' => 'Cabrera'],
                    'DCEEE' => ['first' => 'Ernesto', 'middle' => 'Pablo', 'last' => 'Salazar'],
                    'DCEA' => ['first' => 'Lourdes', 'middle' => 'Mae', 'last' => 'Vargas'],
                    'DIET' => ['first' => 'Rodrigo', 'middle' => 'Jose', 'last' => 'Medina'],
                    'DIT' => ['first' => 'Corazon', 'middle' => 'Isabel', 'last' => 'Espinosa'],
                ],
            ],
            'GAD Coordinator' => [
                'abbrev' => 'gadcoord',
                'people' => [
                    'DAFE' => ['first' => 'Natividad', 'middle' => 'Rose', 'last' => 'Herrera'],
                    'DCEEE' => ['first' => 'Alfredo', 'middle' => 'Carlos', 'last' => 'Ibarra'],
                    'DCEA' => ['first' => 'Milagros', 'middle' => 'Ana', 'last' => 'Jimenez'],
                    'DIET' => ['first' => 'Victorino', 'middle' => 'Angel', 'last' => 'Molina'],
                    'DIT' => ['first' => 'Felicidad', 'middle' => 'Luz', 'last' => 'Ocampo'],
                ],
            ],
        ];

        foreach ($deptCoordinators as $role => $roleData) {
            foreach ($roleData['people'] as $deptCode => $person) {
                $testUsers[] = [
                    'name' => "{$person['first']} {$person['middle']} {$person['last']}",
                    'first_name' => $person['first'],
                    'middle_name' => $person['middle'],
                    'last_name' => $person['last'],
                    'email' => strtolower("{$person['first']}.{$person['last']}.{$roleData['abbrev']}.{$deptCode}@cvsu.edu.ph"),
                    'password' => Hash::make('11111111'),
                    'department' => $departments[$deptCode],
                    'designation' => $role,
                    'is_validated' => true,
                    'email_verified_at' => now(),
                    'schedule_initialized' => true,
                    'schedule_pattern' => 'coordinator',
                ];
            }
        }

        // ========================================
        // 7. FACULTY MEMBERS (10 per department = 50 total)
        // ========================================
        $facultyNames = [
            ['first' => 'Jennifer', 'middle' => 'Mae', 'last' => 'Lopez'],
            ['first' => 'Antonio', 'middle' => 'Carlos', 'last' => 'Gonzales'],
            ['first' => 'Lisa', 'middle' => 'Marie', 'last' => 'Villanueva'],
            ['first' => 'Ramon', 'middle' => 'Pedro', 'last' => 'Aquino'],
            ['first' => 'Diana', 'middle' => 'Grace', 'last' => 'Bautista'],
            ['first' => 'Eduardo', 'middle' => 'Luis', 'last' => 'Mendoza'],
            ['first' => 'Cristina', 'middle' => 'Joy', 'last' => 'Castro'],
            ['first' => 'Roberto', 'middle' => 'Jose', 'last' => 'Morales'],
            ['first' => 'Angela', 'middle' => 'Rose', 'last' => 'Navarro'],
            ['first' => 'Francisco', 'middle' => 'Miguel', 'last' => 'Ortiz'],
        ];

        foreach ($departments as $deptCode => $deptName) {
            foreach ($facultyNames as $index => $faculty) {
                $n = $index + 1;
                $testUsers[] = [
                    'name' => "{$faculty['first']} {$faculty['middle']} {$faculty['last']}",
                    'first_name' => $faculty['first'],
                    'middle_name' => $faculty['middle'],
                    'last_name' => $faculty['last'],
                    'email' => strtolower("{$faculty['first']}.{$faculty['last']}.fac{$n}.{$deptCode}@cvsu.edu.ph"),
                    'password' => Hash::make('11111111'),
                    'department' => $deptName,
                    'designation' => 'Faculty Member',
                    'is_validated' => true,
                    'email_verified_at' => now(),
                    'schedule_initialized' => true,
                    'schedule_pattern' => 'faculty',
                ];
            }
        }

        // ========================================
        // CREATE USERS + SCHEDULES
        // ========================================
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
                }
                else {
                    $existing++;
                }

                if ($pattern && UserSchedule::where('user_id', $user->id)->doesntExist()) {
                    $slots = $this->generateSchedule($pattern, $userIndex);
                    $seedMonth = (int)$now->format('m');
                    $seedYear = (int)$now->format('Y');
                    $seedSchoolYear = $seedMonth >= 9 ? "{$seedYear}-" . ($seedYear + 1) : ($seedYear - 1) . "-{$seedYear}";
                    $seedSemester = ($seedMonth >= 9 || $seedMonth <= 1) ? 'first' : (($seedMonth >= 2 && $seedMonth <= 6) ? 'second' : 'midyear');
                    $rows = [];
                    foreach ($slots as $slot) {
                        $rows[] = [
                            'user_id' => $user->id,
                            'day' => $slot['day'],
                            'start_time' => $slot['start'],
                            'end_time' => $slot['end'],
                            'description' => $slot['desc'],
                            'semester' => $seedSemester,
                            'school_year' => $seedSchoolYear,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                    UserSchedule::insert($rows);
                    $schedulesCreated += count($rows);
                }
            }
        });

        // ========================================
        // SUMMARY
        // ========================================
        $total = count($testUsers);
        $this->command->info("\n╔══════════════════════════════════════════════╗");
        $this->command->info("║       TEST USERS SEEDER - SUMMARY            ║");
        $this->command->info("╚══════════════════════════════════════════════╝");
        $this->command->info("  Users Created:    {$created}");
        $this->command->info("  Already Existing: {$existing}");
        $this->command->info("  Total Users:      {$total}");
        $this->command->info("  Schedule Slots:   {$schedulesCreated}");
        $this->command->info("  Default Password: 11111111");
        $this->command->info("\n  CEIT Level:");
        $this->command->info("    1 Dean, 10 CEIT Officials, 10 Coordinators, 10 Faculty Members");
        $this->command->info("\n  Per Department (5 depts):");
        $this->command->info("    1 Chairperson, 1 Program Coord, 1 Research Coord, 1 Extension Coord, 1 GAD Coord, 10 Faculty");
        $this->command->info("\n  Sample accounts (password: 11111111):");
        $this->command->info("    admin@cvsu.edu.ph");
        $this->command->info("    dean.rodriguez@cvsu.edu.ph");
        $this->command->info("    carlos.aquino.coord1@cvsu.edu.ph  (Coordinator)");
        $this->command->info("    anna.delacruz.chair.DIT@cvsu.edu.ph  (Chairperson)");
        $this->command->info("    danilo.pascual.rescoord.DIT@cvsu.edu.ph  (Research Coordinator)");
        $this->command->info("    jennifer.lopez.fac1.DIT@cvsu.edu.ph  (Faculty Member)");
        $this->command->info("\n✅ Done!\n");
    }
}
