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
    }
}
