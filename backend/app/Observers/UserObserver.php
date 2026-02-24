<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Support\Facades\Log;

class UserObserver
{
    /**
     * Handle the User "created" event.
     * 
     * When a new admin user is created (not bootstrap), check if we have
     * enough permanent admins (2) before removing bootstrap admin.
     */
    public function created(User $user): void
    {
        // Only proceed if the newly created user is an admin
        if ($user->role !== 'admin') {
            return;
        }

        // Only proceed if this is NOT a bootstrap admin
        if ($user->is_bootstrap) {
            return;
        }

        // Check if we now have at least 2 permanent admins
        $permanentAdminCount = User::where('role', 'admin')
            ->where('is_bootstrap', false)
            ->count();

        // Only remove bootstrap admin if we have 2 or more permanent admins
        if ($permanentAdminCount >= 2) {
            $this->removeBootstrapAdmins($user);
        } else {
            Log::info('Permanent admin created, but keeping bootstrap admin', [
                'new_admin_id' => $user->id,
                'new_admin_email' => $user->email,
                'permanent_admin_count' => $permanentAdminCount,
                'bootstrap_removal_threshold' => 2,
            ]);
        }
    }

    /**
     * Handle the User "updated" event.
     * 
     * If a user's role is changed to admin, check if we have enough permanent admins.
     */
    public function updated(User $user): void
    {
        // Check if role was changed to admin
        if ($user->wasChanged('role') && $user->role === 'admin' && !$user->is_bootstrap) {
            // Check if we now have at least 2 permanent admins
            $permanentAdminCount = User::where('role', 'admin')
                ->where('is_bootstrap', false)
                ->count();

            // Only remove bootstrap admin if we have 2 or more permanent admins
            if ($permanentAdminCount >= 2) {
                $this->removeBootstrapAdmins($user);
            }
        }
    }

    /**
     * Remove all bootstrap admin accounts.
     * 
     * @param User $realAdmin The real admin that triggered the removal
     */
    private function removeBootstrapAdmins(User $realAdmin): void
    {
        $bootstrapAdmins = User::where('is_bootstrap', true)
            ->where('role', 'admin')
            ->where('id', '!=', $realAdmin->id)
            ->get();

        if ($bootstrapAdmins->isEmpty()) {
            return;
        }

        foreach ($bootstrapAdmins as $bootstrapAdmin) {
            Log::info('Removing bootstrap admin', [
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
