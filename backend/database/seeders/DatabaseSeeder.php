<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Admin User
        User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('admin123'),
            'department' => 'Administration',
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        // Create Teacher User
        User::create([
            'name' => 'Teacher',
            'email' => 'teacher@example.com',
            'password' => bcrypt('teacher123'),
            'department' => 'IT',
            'role' => 'teacher',
            'email_verified_at' => now(),
        ]);

        // Seed academic calendar events
        $this->call([
            AcademicCalendarSeeder::class,
        ]);
    }
}
