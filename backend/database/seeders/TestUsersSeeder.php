<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            'Computer Science',
            'Information Technology',
            'Computer Engineering',
            'Electrical Engineering',
            'Mechanical Engineering',
        ];

        $testUsers = [
            // 1 Admin
            [
                'name' => 'Admin User',
                'first_name' => 'Admin',
                'middle_name' => 'System',
                'last_name' => 'User',
                'email' => 'admin@cvsu.edu.ph',
                'password' => Hash::make('11111111'),
                'department' => 'Administration',
                'role' => 'Admin',
                'is_validated' => true,
                'email_verified_at' => now(),
                'schedule_initialized' => true,
            ],
            // 1 Dean
            [
                'name' => 'Dean Rodriguez',
                'first_name' => 'Roberto',
                'middle_name' => 'Santos',
                'last_name' => 'Rodriguez',
                'email' => 'dean.rodriguez@cvsu.edu.ph',
                'password' => Hash::make('11111111'),
                'department' => 'College of Engineering',
                'role' => 'Dean',
                'is_validated' => true,
                'email_verified_at' => now(),
                'schedule_initialized' => true,
            ],
        ];

        // 1 Chairperson per department
        $chairpersons = [
            [
                'name' => 'Maria Santos Garcia',
                'first_name' => 'Maria',
                'middle_name' => 'Santos',
                'last_name' => 'Garcia',
                'email' => 'maria.garcia@cvsu.edu.ph',
                'department' => 'Computer Science',
            ],
            [
                'name' => 'John Paul Rivera',
                'first_name' => 'John',
                'middle_name' => 'Paul',
                'last_name' => 'Rivera',
                'email' => 'john.rivera@cvsu.edu.ph',
                'department' => 'Information Technology',
            ],
            [
                'name' => 'Sarah Anne Reyes',
                'first_name' => 'Sarah',
                'middle_name' => 'Anne',
                'last_name' => 'Reyes',
                'email' => 'sarah.reyes@cvsu.edu.ph',
                'department' => 'Computer Engineering',
            ],
            [
                'name' => 'Michael James Cruz',
                'first_name' => 'Michael',
                'middle_name' => 'James',
                'last_name' => 'Cruz',
                'email' => 'michael.cruz@cvsu.edu.ph',
                'department' => 'Electrical Engineering',
            ],
            [
                'name' => 'Anna Marie Dela Cruz',
                'first_name' => 'Anna',
                'middle_name' => 'Marie',
                'last_name' => 'Dela Cruz',
                'email' => 'anna.delacruz@cvsu.edu.ph',
                'department' => 'Mechanical Engineering',
            ],
        ];

        foreach ($chairpersons as $chair) {
            $testUsers[] = [
                'name' => $chair['name'],
                'first_name' => $chair['first_name'],
                'middle_name' => $chair['middle_name'],
                'last_name' => $chair['last_name'],
                'email' => $chair['email'],
                'password' => Hash::make('11111111'),
                'department' => $chair['department'],
                'role' => 'Chairperson',
                'is_validated' => true,
                'email_verified_at' => now(),
                'schedule_initialized' => true,
            ];
        }

        // 5 Coordinators per department
        $coordinatorNames = [
            ['first' => 'Carlos', 'middle' => 'Miguel', 'last' => 'Santos'],
            ['first' => 'Elena', 'middle' => 'Rose', 'last' => 'Mendoza'],
            ['first' => 'David', 'middle' => 'Luis', 'last' => 'Fernandez'],
            ['first' => 'Patricia', 'middle' => 'Joy', 'last' => 'Ramos'],
            ['first' => 'Ricardo', 'middle' => 'Jose', 'last' => 'Torres'],
        ];

        foreach ($departments as $dept) {
            foreach ($coordinatorNames as $index => $name) {
                $deptShort = strtolower(str_replace(' ', '', $dept));
                $testUsers[] = [
                    'name' => "{$name['first']} {$name['middle']} {$name['last']}",
                    'first_name' => $name['first'],
                    'middle_name' => $name['middle'],
                    'last_name' => $name['last'],
                    'email' => strtolower("{$name['first']}.{$name['last']}.coord{$index}.{$deptShort}@cvsu.edu.ph"),
                    'password' => Hash::make('11111111'),
                    'department' => $dept,
                    'role' => 'Coordinator',
                    'is_validated' => true,
                    'email_verified_at' => now(),
                    'schedule_initialized' => true,
                ];
            }
        }

        // 5 Faculty Members per department
        $facultyNames = [
            ['first' => 'Jennifer', 'middle' => 'Mae', 'last' => 'Lopez'],
            ['first' => 'Antonio', 'middle' => 'Carlos', 'last' => 'Gonzales'],
            ['first' => 'Lisa', 'middle' => 'Marie', 'last' => 'Villanueva'],
            ['first' => 'Ramon', 'middle' => 'Pedro', 'last' => 'Aquino'],
            ['first' => 'Diana', 'middle' => 'Grace', 'last' => 'Bautista'],
        ];

        foreach ($departments as $dept) {
            foreach ($facultyNames as $index => $name) {
                $deptShort = strtolower(str_replace(' ', '', $dept));
                $testUsers[] = [
                    'name' => "{$name['first']} {$name['middle']} {$name['last']}",
                    'first_name' => $name['first'],
                    'middle_name' => $name['middle'],
                    'last_name' => $name['last'],
                    'email' => strtolower("{$name['first']}.{$name['last']}.fac{$index}.{$deptShort}@cvsu.edu.ph"),
                    'password' => Hash::make('11111111'),
                    'department' => $dept,
                    'role' => 'Faculty Member',
                    'is_validated' => true,
                    'email_verified_at' => now(),
                    'schedule_initialized' => true,
                ];
            }
        }

        foreach ($testUsers as $userData) {
            // Check if user already exists
            $existingUser = User::where('email', $userData['email'])->first();
            
            if (!$existingUser) {
                User::create($userData);
                $this->command->info("Created test user: {$userData['email']}");
            } else {
                $this->command->info("User already exists: {$userData['email']}");
            }
        }

        $this->command->info("\n=== Test Accounts Created ===");
        $this->command->info("All passwords: 11111111\n");
        $this->command->info("Total users created: " . count($testUsers));
        $this->command->info("\nKey Accounts:");
        $this->command->info("Admin:  admin@cvsu.edu.ph");
        $this->command->info("Dean:   dean.rodriguez@cvsu.edu.ph");
        $this->command->info("\nChairpersons (1 per department):");
        $this->command->info("  CS:  maria.garcia@cvsu.edu.ph");
        $this->command->info("  IT:  john.rivera@cvsu.edu.ph");
        $this->command->info("  CE:  sarah.reyes@cvsu.edu.ph");
        $this->command->info("  EE:  michael.cruz@cvsu.edu.ph");
        $this->command->info("  ME:  anna.delacruz@cvsu.edu.ph");
        $this->command->info("\n5 Coordinators per department (25 total)");
        $this->command->info("5 Faculty Members per department (25 total)");
        $this->command->info("\nEmail format:");
        $this->command->info("  Coordinators: firstname.lastname.coord#.department@cvsu.edu.ph");
        $this->command->info("  Faculty:      firstname.lastname.fac#.department@cvsu.edu.ph");
    }
}
