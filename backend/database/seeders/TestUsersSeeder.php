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
     * - College of Engineering and Information Technology: 1 Dean, 10 CEIT Officials, 10 Coordinators
     * - Per Department (5 departments): 1 Chairperson, 10 Faculty Members
     *
     * Email format: firstname.lastname.role[n].dept@cvsu.edu.ph (no spaces anywhere)
     */
    public function run(): void
    {
        $departments = [
            'DAFE'  => 'Department of Agricultural and Food Engineering',
            'DCEEE' => 'Department of Civil and Environmental Engineering and Energy',
            'DCEA'  => 'Department of Computer Engineering and Architecture',
            'DIET'  => 'Department of Industrial and Electrical Technology',
            'DIT'   => 'Department of Information Technology',
        ];

        // Typical weekly schedule blocks used for seeding
        // Each role gets a realistic schedule pattern
        $schedulePatterns = [
            'heavy' => [ // Dean, Chairpersons
                ['day' => 'Monday',    'start' => '07:30', 'end' => '09:00', 'desc' => 'Administrative Meeting'],
                ['day' => 'Monday',    'start' => '10:00', 'end' => '12:00', 'desc' => 'Office Hours'],
                ['day' => 'Tuesday',   'start' => '08:00', 'end' => '10:00', 'desc' => 'Department Meeting'],
                ['day' => 'Tuesday',   'start' => '13:00', 'end' => '15:00', 'desc' => 'Consultation'],
                ['day' => 'Wednesday', 'start' => '07:30', 'end' => '09:30', 'desc' => 'Faculty Meeting'],
                ['day' => 'Wednesday', 'start' => '10:00', 'end' => '12:00', 'desc' => 'Office Hours'],
                ['day' => 'Thursday',  'start' => '08:00', 'end' => '10:00', 'desc' => 'Administrative Tasks'],
                ['day' => 'Thursday',  'start' => '13:00', 'end' => '15:00', 'desc' => 'Consultation'],
                ['day' => 'Friday',    'start' => '07:30', 'end' => '09:00', 'desc' => 'Weekly Review'],
                ['day' => 'Friday',    'start' => '10:00', 'end' => '12:00', 'desc' => 'Office Hours'],
            ],
            'faculty' => [ // Faculty Members
                ['day' => 'Monday',    'start' => '07:30', 'end' => '09:00', 'desc' => 'Class - Lecture'],
                ['day' => 'Monday',    'start' => '10:30', 'end' => '12:00', 'desc' => 'Class - Lab'],
                ['day' => 'Tuesday',   'start' => '08:00', 'end' => '09:30', 'desc' => 'Class - Lecture'],
                ['day' => 'Tuesday',   'start' => '13:00', 'end' => '14:30', 'desc' => 'Class - Lecture'],
                ['day' => 'Wednesday', 'start' => '07:30', 'end' => '09:00', 'desc' => 'Class - Lecture'],
                ['day' => 'Wednesday', 'start' => '10:30', 'end' => '12:00', 'desc' => 'Class - Lab'],
                ['day' => 'Thursday',  'start' => '08:00', 'end' => '09:30', 'desc' => 'Class - Lecture'],
                ['day' => 'Thursday',  'start' => '13:00', 'end' => '14:30', 'desc' => 'Consultation Hours'],
                ['day' => 'Friday',    'start' => '07:30', 'end' => '09:00', 'desc' => 'Class - Lecture'],
                ['day' => 'Friday',    'start' => '10:00', 'end' => '11:30', 'desc' => 'Research / Prep'],
            ],
            'coordinator' => [ // Coordinators, CEIT Officials
                ['day' => 'Monday',    'start' => '08:00', 'end' => '10:00', 'desc' => 'Program Coordination'],
                ['day' => 'Monday',    'start' => '13:00', 'end' => '15:00', 'desc' => 'Office Hours'],
                ['day' => 'Tuesday',   'start' => '09:00', 'end' => '11:00', 'desc' => 'Curriculum Review'],
                ['day' => 'Wednesday', 'start' => '08:00', 'end' => '10:00', 'desc' => 'Program Coordination'],
                ['day' => 'Wednesday', 'start' => '13:00', 'end' => '15:00', 'desc' => 'Office Hours'],
                ['day' => 'Thursday',  'start' => '09:00', 'end' => '11:00', 'desc' => 'Accreditation Tasks'],
                ['day' => 'Friday',    'start' => '08:00', 'end' => '10:00', 'desc' => 'Weekly Coordination'],
            ],
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
            'role' => 'Admin',
            'is_validated' => true,
            'email_verified_at' => now(),
            'schedule_initialized' => true,
            'schedule_pattern' => null,
        ];

        // ========================================
        // 2. DEAN
        // ========================================
        $testUsers[] = [
            'name' => 'Roberto Santos Rodriguez',
            'first_name' => 'Roberto',
            'middle_name' => 'Santos',
            'last_name' => 'Rodriguez',
            'email' => 'dean.rodriguez@cvsu.edu.ph',
            'password' => Hash::make('11111111'),
            'department' => 'College of Engineering and Information Technology',
            'role' => 'Dean',
            'is_validated' => true,
            'email_verified_at' => now(),
            'schedule_initialized' => true,
            'schedule_pattern' => 'heavy',
        ];

        // ========================================
        // 3. CEIT OFFICIALS (10 - College level)
        // ========================================
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
                'role' => 'CEIT Official',
                'is_validated' => true,
                'email_verified_at' => now(),
                'schedule_initialized' => true,
                'schedule_pattern' => 'coordinator',
            ];
        }

        // ========================================
        // 4. COORDINATORS (10 - College level)
        // ========================================
        $coordinators = [
            ['first' => 'Carlos',    'middle' => 'Miguel', 'last' => 'Aquino'],
            ['first' => 'Elena',     'middle' => 'Rose',   'last' => 'Mendoza'],
            ['first' => 'David',     'middle' => 'Luis',   'last' => 'Bautista'],
            ['first' => 'Patricia',  'middle' => 'Joy',    'last' => 'Villanueva'],
            ['first' => 'Ricardo',   'middle' => 'Jose',   'last' => 'Castro'],
            ['first' => 'Lucia',     'middle' => 'Mae',    'last' => 'Morales'],
            ['first' => 'Fernando',  'middle' => 'Pablo',  'last' => 'Navarro'],
            ['first' => 'Gabriela',  'middle' => 'Luz',    'last' => 'Ortiz'],
            ['first' => 'Alejandro', 'middle' => 'Manuel', 'last' => 'Perez'],
            ['first' => 'Valentina', 'middle' => 'Sofia',  'last' => 'Ramirez'],
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
                'role' => 'Coordinator',
                'is_validated' => true,
                'email_verified_at' => now(),
                'schedule_initialized' => true,
                'schedule_pattern' => 'coordinator',
            ];
        }

        // ========================================
        // 8. CHAIRPERSONS (1 per department = 5 total)
        // Each chairperson is ONLY a Chairperson — not also a faculty member
        // ========================================
        $chairpersons = [
            'DAFE'  => ['first' => 'Maria',   'middle' => 'Santos', 'last' => 'Garcia'],
            'DCEEE' => ['first' => 'John',    'middle' => 'Paul',   'last' => 'Rivera'],
            'DCEA'  => ['first' => 'Sarah',   'middle' => 'Anne',   'last' => 'Reyes'],
            'DIET'  => ['first' => 'Michael', 'middle' => 'James',  'last' => 'Cruz'],
            'DIT'   => ['first' => 'Anna',    'middle' => 'Marie',  'last' => 'Delacruz'],
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
                'role' => 'Chairperson',
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
            ['first' => 'Bernard',   'middle' => 'Luis',    'last' => 'Castillo'],
            ['first' => 'Rowena',    'middle' => 'Grace',   'last' => 'Dela Rosa'],
            ['first' => 'Nestor',    'middle' => 'Jose',    'last' => 'Evangelista'],
            ['first' => 'Maribel',   'middle' => 'Anne',    'last' => 'Fajardo'],
            ['first' => 'Gregorio',  'middle' => 'Pablo',   'last' => 'Gutierrez'],
            ['first' => 'Leonora',   'middle' => 'Mae',     'last' => 'Hidalgo'],
            ['first' => 'Arsenio',   'middle' => 'Carlos',  'last' => 'Ignacio'],
            ['first' => 'Perpetua',  'middle' => 'Rosa',    'last' => 'Jacinto'],
            ['first' => 'Wilfredo',  'middle' => 'Angel',   'last' => 'Lacson'],
            ['first' => 'Consolacion','middle' => 'Isabel', 'last' => 'Macapagal'],
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
                'role' => 'Faculty Member',
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
            'Research Coordinator' => [
                'abbrev' => 'rescoord',
                'people' => [
                    'DAFE'  => ['first' => 'Jose',     'middle' => 'Ramon',   'last' => 'Santos'],
                    'DCEEE' => ['first' => 'Maricel',  'middle' => 'Grace',   'last' => 'Flores'],
                    'DCEA'  => ['first' => 'Renato',   'middle' => 'Luis',    'last' => 'Aguilar'],
                    'DIET'  => ['first' => 'Teresita', 'middle' => 'Joy',     'last' => 'Domingo'],
                    'DIT'   => ['first' => 'Danilo',   'middle' => 'Miguel',  'last' => 'Pascual'],
                ],
            ],
            'Extension Coordinator' => [
                'abbrev' => 'extcoord',
                'people' => [
                    'DAFE'  => ['first' => 'Rosario',  'middle' => 'Elena',   'last' => 'Cabrera'],
                    'DCEEE' => ['first' => 'Ernesto',  'middle' => 'Pablo',   'last' => 'Salazar'],
                    'DCEA'  => ['first' => 'Lourdes',  'middle' => 'Mae',     'last' => 'Vargas'],
                    'DIET'  => ['first' => 'Rodrigo',  'middle' => 'Jose',    'last' => 'Medina'],
                    'DIT'   => ['first' => 'Corazon',  'middle' => 'Isabel',  'last' => 'Espinosa'],
                ],
            ],
            'GAD Coordinator' => [
                'abbrev' => 'gadcoord',
                'people' => [
                    'DAFE'  => ['first' => 'Natividad', 'middle' => 'Rose',   'last' => 'Herrera'],
                    'DCEEE' => ['first' => 'Alfredo',   'middle' => 'Carlos', 'last' => 'Ibarra'],
                    'DCEA'  => ['first' => 'Milagros',  'middle' => 'Ana',    'last' => 'Jimenez'],
                    'DIET'  => ['first' => 'Victorino', 'middle' => 'Angel',  'last' => 'Molina'],
                    'DIT'   => ['first' => 'Felicidad', 'middle' => 'Luz',    'last' => 'Ocampo'],
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
                    'role' => $role,
                    'is_validated' => true,
                    'email_verified_at' => now(),
                    'schedule_initialized' => true,
                    'schedule_pattern' => 'coordinator',
                ];
            }
        }

        // ========================================
        // 9. FACULTY MEMBERS (10 per department = 50 total)
        // These are SEPARATE people from the chairpersons
        // ========================================
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
                    'role' => 'Faculty Member',
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

        DB::transaction(function () use (
            $testUsers, $schedulePatterns,
            &$created, &$existing, &$schedulesCreated, $now
        ) {
            foreach ($testUsers as $userData) {
                $pattern = $userData['schedule_pattern'];
                unset($userData['schedule_pattern']);

                $user = User::where('email', $userData['email'])->first();

                if (!$user) {
                    $user = User::create($userData);
                    $created++;
                } else {
                    $existing++;
                }

                // Seed schedules if a pattern is defined and user has none yet
                if ($pattern && UserSchedule::where('user_id', $user->id)->doesntExist()) {
                    $rows = [];
                    foreach ($schedulePatterns[$pattern] as $slot) {
                        $rows[] = [
                            'user_id'    => $user->id,
                            'day'        => $slot['day'],
                            'start_time' => $slot['start'],
                            'end_time'   => $slot['end'],
                            'description' => $slot['desc'],
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
        // SUMMARY OUTPUT
        // ========================================
        $this->command->info("\n╔════════════════════════════════════════════════════════════════╗");
        $this->command->info("║          TEST USERS SEEDER - SUMMARY                           ║");
        $this->command->info("╚════════════════════════════════════════════════════════════════╝");
        $this->command->info("\n📊 STATISTICS:");
        $this->command->info("   • Users Created:    {$created}");
        $this->command->info("   • Already Existing: {$existing}");
        $this->command->info("   • Total Users:      " . count($testUsers));
        $this->command->info("   • Schedule Slots:   {$schedulesCreated}");
        $this->command->info("   • Default Password: 11111111");

        $this->command->info("\n🏛️  COLLEGE LEVEL:");
        $this->command->info("   • 1 Dean:            dean.rodriguez@cvsu.edu.ph");
        $this->command->info("   • 10 CEIT Officials: [firstname].[lastname].ceit[1-10]@cvsu.edu.ph");
        $this->command->info("   • 10 Coordinators:   [firstname].[lastname].coord[1-10]@cvsu.edu.ph");
        $this->command->info("   • 10 CEIT Faculty:   [firstname].[lastname].fac[1-10].CEIT@cvsu.edu.ph");

        $this->command->info("\n🏢 DEPARTMENT LEVEL (5 Departments):");
        foreach ($departments as $code => $name) {
            $this->command->info("   • {$code}: {$name}");
        }

        $this->command->info("\n   Per Department:");
        $this->command->info("   • 1 Chairperson:           [firstname].[lastname].chair.[DEPT]@cvsu.edu.ph");
        $this->command->info("   • 1 Research Coordinator:  [firstname].[lastname].rescoord.[DEPT]@cvsu.edu.ph");
        $this->command->info("   • 1 Extension Coordinator: [firstname].[lastname].extcoord.[DEPT]@cvsu.edu.ph");
        $this->command->info("   • 1 GAD Coordinator:       [firstname].[lastname].gadcoord.[DEPT]@cvsu.edu.ph");
        $this->command->info("   • 10 Faculty Members:      [firstname].[lastname].fac[1-10].[DEPT]@cvsu.edu.ph");

        $this->command->info("\n📧 SAMPLE ACCOUNTS:");
        $this->command->info("   Admin:            admin@cvsu.edu.ph");
        $this->command->info("   Dean:             dean.rodriguez@cvsu.edu.ph");
        $this->command->info("   CEIT Official:    maria.santos.ceit1@cvsu.edu.ph");
        $this->command->info("   Coordinator:      carlos.aquino.coord1@cvsu.edu.ph");
        $this->command->info("   Chair (DIT):      anna.delacruz.chair.DIT@cvsu.edu.ph");
        $this->command->info("   Res. Coord (DIT): danilo.pascual.rescoord.DIT@cvsu.edu.ph");
        $this->command->info("   Ext. Coord (DIT): corazon.espinosa.extcoord.DIT@cvsu.edu.ph");
        $this->command->info("   GAD Coord (DIT):  felicidad.ocampo.gadcoord.DIT@cvsu.edu.ph");
        $this->command->info("   CEIT Faculty:     bernard.castillo.fac1.CEIT@cvsu.edu.ph");

        $this->command->info("\n📅 SCHEDULE PATTERNS:");
        $this->command->info("   • Dean / Chairpersons: 10 slots/week (admin-heavy)");
        $this->command->info("   • CEIT Officials / All Coordinators: 7 slots/week");
        $this->command->info("   • Faculty Members: 10 slots/week (class schedule)");

        $this->command->info("\n✅ Seeding completed successfully!\n");
    }
}
