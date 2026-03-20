<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class PositionSeeder extends Seeder
{
    /**
     * Run the database seeder.
     * Updates existing users to have proper roles and validation status.
     */
    public function run(): void
    {
        // Update existing admin users to be validated
        User::where('role', 'Admin')->update([
            'is_validated' => true
        ]);

        // Update users with old role values to new enum values
        $roleMapping = [
            'admin' => 'Admin',
            'dean' => 'Dean',
            'chairperson' => 'Chairperson',
            'program_coordinator' => 'Coordinator',
            'faculty' => 'Faculty Member',
            'teacher' => 'Faculty Member'
        ];

        foreach ($roleMapping as $oldRole => $newRole) {
            User::where('role', $oldRole)->update([
                'role' => $newRole,
                'is_validated' => $newRole === 'Admin' ? true : false
            ]);
        }

        // Set default role for users without a proper role
        User::whereNotIn('role', [
            'Admin', 'Dean', 'Chairperson', 'Coordinator',
            'Research Coordinator', 'Extension Coordinator', 'GAD Coordinator',
            'Faculty Member', 'CEIT Official',
        ])->orWhereNull('role')
          ->update(['role' => 'Faculty Member', 'is_validated' => false]);
    }
}