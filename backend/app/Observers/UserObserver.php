<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Support\Facades\Log;

class UserObserver
{
    /**
     * Handle the User "created" event.
     * 
     * When a new Admin user is created (not bootstrap), check if we have
     * enough permanent Admins (2) before removing bootstrap Admin.
     */
    public function created(User $user): void
    {
        // Only proceed if the newly created user is an Admin
        if ($user->designation !== 'Admin') {
            return;
        }

        // Check if this is the bootstrap user (allowed)
        if ($user->is_bootstrap) {
            return;
        }

        // Check if we now have at least 2 permanent Admins
        $permanentAdminCount = User::where('designation', 'Admin')
            ->where('is_bootstrap', false)
            ->count();

        // If this is the only permanent Admin, we need a second one
        if ($permanentAdminCount < 2) {
        // Log warning or notify system owner?
        // For now, we just allow it but it's a known risky state
        }
    }

    /**
     * Handle the User "updated" event.
     * 
     * If a user's designation is changed to Admin, check if we have enough permanent Admins.
     */
    public function updated(User $user): void
    {
        // Check if designation was changed to Admin
        if ($user->wasChanged('designation') && $user->designation === 'Admin' && !$user->is_bootstrap) {
            // Check if we now have at least 2 permanent Admins
            $permanentAdminCount = User::where('designation', 'Admin')
                ->where('is_bootstrap', false)
                ->count();

            if ($permanentAdminCount < 2) {
            // Add a second Admin if needed
            }
        }
    }

    /**
     * Handle the User "deleted" event.
     * 
     * Prevent deleting the last permanent Admin.
     */
    public function deleting(User $user): void
    {
        if ($user->designation === 'Admin' && !$user->is_bootstrap) {
            $permanentAdminCount = User::where('designation', 'Admin')
                ->where('is_bootstrap', false)
                ->count();

            if ($permanentAdminCount <= 1) {
                throw new \Exception('The last permanent Admin account cannot be deleted.');
            }
        }
    }

    /**
     * Remove all bootstrap Admin accounts.
     * 
     * @param User $realAdmin The real Admin that triggered the removal
     */
    private function removeBootstrapAdmins(User $realAdmin): void
    {
        $bootstrapAdmins = User::where('is_bootstrap', true)
            ->where('designation', 'Admin')
            ->where('id', '!=', $realAdmin->id)
            ->get();

        if ($bootstrapAdmins->isEmpty()) {
            return;
        }

        foreach ($bootstrapAdmins as $bootstrapAdmin) {
            Log::info('Removing bootstrap Admin', [
                'bootstrap_admin_id' => $bootstrapAdmin->id,
                'bootstrap_admin_email' => $bootstrapAdmin->email,
                'triggered_by_admin_id' => $realAdmin->id,
                'triggered_by_admin_email' => $realAdmin->email,
            ]);

            // Revoke all tokens for the bootstrap admin
            $bootstrapAdmin->tokens()->delete();

            // Delete the bootstrap admin
            $bootstrapAdmin->delete();
        }

        Log::info('Bootstrap admin cleanup completed', [
            'removed_count' => $bootstrapAdmins->count(),
            'real_admin_id' => $realAdmin->id,
        ]);
    }
}
