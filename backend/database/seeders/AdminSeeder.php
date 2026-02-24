<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Creates a bootstrap admin account ONLY if:
     * 1. No admin users exist in the database
     * 2. Bootstrap credentials are set in .env
     * 
     * This bootstrap admin will be automatically removed when a real admin is created.
     */
    public function run(): void
    {
        // Check if any admin already exists
        $adminExists = User::where('role', 'admin')->exists();

        if ($adminExists) {
            $this->command->info('Admin user already exists. Skipping bootstrap admin creation.');
            Log::info('AdminSeeder: Skipped - Admin already exists');
            return;
        }

        // Get bootstrap credentials from .env
        $name = env('BOOTSTRAP_ADMIN_NAME');
        $email = env('BOOTSTRAP_ADMIN_EMAIL');
        $password = env('BOOTSTRAP_ADMIN_PASSWORD');

        // Validate that all required credentials are set
        if (!$name || !$email || !$password) {
            $this->command->warn('Bootstrap admin credentials not set in .env file. Skipping.');
            Log::warning('AdminSeeder: Bootstrap credentials missing in .env');
            return;
        }

        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->command->error('Invalid bootstrap admin email format in .env');
            Log::error('AdminSeeder: Invalid email format', ['email' => $email]);
            return;
        }

        // Check if bootstrap admin already exists
        $existingBootstrap = User::where('email', $email)
            ->where('is_bootstrap', true)
            ->first();

        if ($existingBootstrap) {
            $this->command->info('Bootstrap admin already exists.');
            return;
        }

        // Create bootstrap admin
        try {
            $admin = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'role' => 'admin',
                'department' => 'System Administration',
                'is_bootstrap' => true,
                'email_verified_at' => now(), // Bootstrap admin is pre-verified
                'schedule_initialized' => true,
            ]);

            $this->command->info('Bootstrap admin created successfully!');
            $this->command->warn('⚠️  This is a TEMPORARY admin account for initial setup.');
            $this->command->warn('⚠️  It will be automatically removed when you create a real admin.');
            
            Log::info('AdminSeeder: Bootstrap admin created', [
                'email' => $email,
                'id' => $admin->id,
            ]);
        } catch (\Exception $e) {
            $this->command->error('Failed to create bootstrap admin: ' . $e->getMessage());
            Log::error('AdminSeeder: Failed to create bootstrap admin', [
                'error' => $e->getMessage(),
                'email' => $email,
            ]);
        }
    }
}
