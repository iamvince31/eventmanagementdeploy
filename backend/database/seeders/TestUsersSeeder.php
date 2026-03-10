<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Structure:
     * - College of Engineering and Information Technology: 1 Dean, 10 CEIT Officers, 10 Coordinators
     * - Per Department (5 departments): 1 Chairperson, 10 Faculty Members, 10 Staff
     */
    public function run(): void
    {
        // Department definitions matching admin panel
        $departments = [
            'DAFE' => 'Department of Agricultural and Food Engineering',
            'DCEEE' => 'Department of Civil and Environmental Engineering and Energy',
            'DCEA' => 'Department of Computer Engineering and Architecture',
            'DIET' => 'Department of Industrial and Electrical Technology',
            'DIT' => 'Department of Information Technology',
        ];

        $testUsers = [];

        // ========================================
        // 1. ADMIN (1 user)
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
        ];

        // ========================================
        // 2. DEAN (1 user - College level)
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
        ];

        // ========================================
        // 3. CEIT OFFICIALS (10 users - College level)
        // ========================================
        $ceitOfficials = [
            ['first' => 'Maria', 'middle' => 'Elena', 'last' => 'Santos'],
            ['first' => 'Juan', 'middle' => 'Carlos', 'last' => 'Dela Cruz'],
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
            $testUsers[] = [
                'name' => "{$official['first']} {$official['middle']} {$official['last']}",
                'first_name' => $official['first'],
                'middle_name' => $official['middle'],
                'last_name' => $official['last'],
                'email' => strtolower("{$official['first']}.{$official['last']}.ceit" . ($index + 1) . "@cvsu.edu.ph"),
                'password' => Hash::make('11111111'),
                'department' => 'College of Engineering and Information Technology',
                'role' => 'CEIT Official',
                'is_validated' => true,
                'email_verified_at' => now(),
                'schedule_initialized' => true,
            ];
        }

        // ========================================
        // 4. COORDINATORS (10 users - College level)
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
            $testUsers[] = [
                'name' => "{$coordinator['first']} {$coordinator['middle']} {$coordinator['last']}",
                'first_name' => $coordinator['first'],
                'middle_name' => $coordinator['middle'],
                'last_name' => $coordinator['last'],
                'email' => strtolower("{$coordinator['first']}.{$coordinator['last']}.coord" . ($index + 1) . "@cvsu.edu.ph"),
                'password' => Hash::make('11111111'),
                'department' => 'College of Engineering and Information Technology',
                'role' => 'Coordinator',
                'is_validated' => true,
                'email_verified_at' => now(),
                'schedule_initialized' => true,
            ];
        }

        // ========================================
        // 5. DEPARTMENT CHAIRPERSONS (1 per department = 5 total)
        // ========================================
        $chairpersons = [
            'DAFE' => ['first' => 'Maria', 'middle' => 'Santos', 'last' => 'Garcia'],
            'DCEEE' => ['first' => 'John', 'middle' => 'Paul', 'last' => 'Rivera'],
            'DCEA' => ['first' => 'Sarah', 'middle' => 'Anne', 'last' => 'Reyes'],
            'DIET' => ['first' => 'Michael', 'middle' => 'James', 'last' => 'Cruz'],
            'DIT' => ['first' => 'Anna', 'middle' => 'Marie', 'last' => 'Dela Cruz'],
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
            ];
        }

        // ========================================
        // 6. FACULTY MEMBERS (10 per department = 50 total)
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
                $testUsers[] = [
                    'name' => "{$faculty['first']} {$faculty['middle']} {$faculty['last']}",
                    'first_name' => $faculty['first'],
                    'middle_name' => $faculty['middle'],
                    'last_name' => $faculty['last'],
                    'email' => strtolower("{$faculty['first']}.{$faculty['last']}.fac" . ($index + 1) . ".{$deptCode}@cvsu.edu.ph"),
                    'password' => Hash::make('11111111'),
                    'department' => $deptName,
                    'role' => 'Faculty Member',
                    'is_validated' => true,
                    'email_verified_at' => now(),
                    'schedule_initialized' => true,
                ];
            }
        }

        // ========================================
        // 7. STAFF (10 per department = 50 total)
        // ========================================
        $staffNames = [
            ['first' => 'Gloria', 'middle' => 'Santos', 'last' => 'Perez'],
            ['first' => 'Manuel', 'middle' => 'Cruz', 'last' => 'Ramirez'],
            ['first' => 'Teresa', 'middle' => 'Luna', 'last' => 'Silva'],
            ['first' => 'Jorge', 'middle' => 'Reyes', 'last' => 'Vargas'],
            ['first' => 'Beatriz', 'middle' => 'Garcia', 'last' => 'Herrera'],
            ['first' => 'Alberto', 'middle' => 'Lopez', 'last' => 'Jimenez'],
            ['first' => 'Rosa', 'middle' => 'Martinez', 'last' => 'Flores'],
            ['first' => 'Enrique', 'middle' => 'Fernandez', 'last' => 'Diaz'],
            ['first' => 'Margarita', 'middle' => 'Torres', 'last' => 'Ruiz'],
            ['first' => 'Victor', 'middle' => 'Ramos', 'last' => 'Moreno'],
        ];

        foreach ($departments as $deptCode => $deptName) {
            foreach ($staffNames as $index => $staff) {
                $testUsers[] = [
                    'name' => "{$staff['first']} {$staff['middle']} {$staff['last']}",
                    'first_name' => $staff['first'],
                    'middle_name' => $staff['middle'],
                    'last_name' => $staff['last'],
                    'email' => strtolower("{$staff['first']}.{$staff['last']}.staff" . ($index + 1) . ".{$deptCode}@cvsu.edu.ph"),
                    'password' => Hash::make('11111111'),
                    'department' => $deptName,
                    'role' => 'Staff',
                    'is_validated' => true,
                    'email_verified_at' => now(),
                    'schedule_initialized' => true,
                ];
            }
        }

        // ========================================
        // CREATE USERS
        // ========================================
        $created = 0;
        $existing = 0;

        foreach ($testUsers as $userData) {
            $existingUser = User::where('email', $userData['email'])->first();
            
            if (!$existingUser) {
                User::create($userData);
                $created++;
            } else {
                $existing++;
            }
        }

        // ========================================
        // SUMMARY OUTPUT
        // ========================================
        $this->command->info("\n╔════════════════════════════════════════════════════════════════╗");
        $this->command->info("║          TEST USERS SEEDER - SUMMARY                           ║");
        $this->command->info("╚════════════════════════════════════════════════════════════════╝");
        $this->command->info("\n📊 STATISTICS:");
        $this->command->info("   • Users Created: {$created}");
        $this->command->info("   • Already Existing: {$existing}");
        $this->command->info("   • Total Users: " . count($testUsers));
        $this->command->info("   • Default Password: 11111111");
        
        $this->command->info("\n🏛️  COLLEGE LEVEL (College of Engineering and Information Technology):");
        $this->command->info("   • 1 Dean:           dean.rodriguez@cvsu.edu.ph");
        $this->command->info("   • 10 CEIT Officials: [firstname].[lastname].ceit[1-10]@cvsu.edu.ph");
        $this->command->info("   • 10 Coordinators:   [firstname].[lastname].coord[1-10]@cvsu.edu.ph");
        
        $this->command->info("\n🏢 DEPARTMENT LEVEL (5 Departments):");
        $this->command->info("   Departments:");
        foreach ($departments as $code => $name) {
            $this->command->info("   • {$code}: {$name}");
        }
        
        $this->command->info("\n   Per Department:");
        $this->command->info("   • 1 Chairperson:     [firstname].[lastname].chair.[DEPT]@cvsu.edu.ph");
        $this->command->info("   • 10 Faculty Members: [firstname].[lastname].fac[1-10].[DEPT]@cvsu.edu.ph");
        $this->command->info("   • 10 Staff:          [firstname].[lastname].staff[1-10].[DEPT]@cvsu.edu.ph");
        
        $this->command->info("\n📧 SAMPLE ACCOUNTS:");
        $this->command->info("   Admin:       admin@cvsu.edu.ph");
        $this->command->info("   Dean:        dean.rodriguez@cvsu.edu.ph");
        $this->command->info("   CEIT:        maria.santos.ceit1@cvsu.edu.ph");
        $this->command->info("   Coordinator: carlos.aquino.coord1@cvsu.edu.ph");
        $this->command->info("   Chair (DIT): anna.delacruz.chair.DIT@cvsu.edu.ph");
        $this->command->info("   Faculty:     jennifer.lopez.fac1.DIT@cvsu.edu.ph");
        $this->command->info("   Staff:       gloria.perez.staff1.DIT@cvsu.edu.ph");
        
        $this->command->info("\n✅ Seeding completed successfully!\n");
    }
}
