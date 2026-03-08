<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Call AdminSeeder to create bootstrap admin if needed
        $this->call([
            AdminSeeder::class,
        ]);

        // Seed test users for development/testing
        if (app()->environment(['local', 'development', 'testing'])) {
            $this->call([
                TestUsersSeeder::class,
            ]);
        }

        // Seed academic calendar events
        $this->call([
            DefaultEventSeeder::class,
        ]);
    }
}
