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

        // Create Faculty User
        User::create([
            'name' => 'Faculty',
            'email' => 'Faculty@example.com',
            'password' => bcrypt('Faculty123'),
            'department' => 'IT',
            'role' => 'Faculty',
            'email_verified_at' => now(),
        ]);

        // Seed academic calendar events
        $this->call([
            AcademicCalendarSeeder::class,
            DefaultEventSeeder::class,
        ]);
    }
}
