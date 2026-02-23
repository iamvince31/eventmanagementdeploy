<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class ResetAdminPassword extends Command
{
    protected $signature = 'admin:reset-password';
    protected $description = 'Reset admin password to admin123';

    public function handle()
    {
        $admin = User::where('email', 'admin@example.com')->first();

        if (!$admin) {
            $this->error('Admin user not found!');
            return 1;
        }

        $admin->password = Hash::make('admin123');
        $admin->email_verified_at = now();
        $admin->save();

        $this->info('Admin password has been reset to: admin123');
        $this->info('Email: admin@example.com');
        $this->info('Password: admin123');
        
        return 0;
    }
}
