<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class SetupAdminController extends Controller
{
    /**
     * Create a permanent admin account.
     * Only accessible by bootstrap admin.
     */
    public function createPermanentAdmin(Request $request)
    {
        // Verify that the current user is a bootstrap admin
        $currentUser = $request->user();
        
        if (!$currentUser || !$currentUser->is_bootstrap) {
            return response()->json([
                'message' => 'Unauthorized. Only bootstrap admin can create permanent admins.',
            ], 403);
        }

        // Validate request
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'unique:users',
                'regex:/^[a-zA-Z0-9._%+-]+@cvsu\.edu\.ph$/i'
            ],
            'password' => 'required|string|min:8|confirmed',
            'department' => 'required|string|max:255',
        ], [
            'email.regex' => 'Only @cvsu.edu.ph email addresses are allowed.',
            'email.unique' => 'This email is already registered.',
            'password.confirmed' => 'Password confirmation does not match.',
        ]);

        try {
            // Create permanent admin
            $admin = User::create([
                'name' => $request->name,
                'email' => strtolower(trim($request->email)),
                'password' => Hash::make($request->password),
                'department' => $request->department,
                'role' => 'admin',
                'is_bootstrap' => false, // This is a REAL admin
                'email_verified_at' => now(), // Pre-verified by bootstrap admin
                'schedule_initialized' => true,
            ]);

            // Count permanent admins
            $permanentAdminCount = User::where('role', 'admin')
                ->where('is_bootstrap', false)
                ->count();

            $bootstrapRemoved = $permanentAdminCount >= 2;

            Log::info('Permanent admin created by bootstrap admin', [
                'new_admin_id' => $admin->id,
                'new_admin_email' => $admin->email,
                'created_by_bootstrap_id' => $currentUser->id,
                'created_by_bootstrap_email' => $currentUser->email,
                'permanent_admin_count' => $permanentAdminCount,
                'bootstrap_will_be_removed' => $bootstrapRemoved,
            ]);

            $message = $bootstrapRemoved 
                ? 'Permanent admin account created successfully! You now have 2 admins. Bootstrap admin will be removed automatically.'
                : 'Permanent admin account created successfully! You can create 1 more admin before bootstrap is removed.';

            return response()->json([
                'message' => $message,
                'admin' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'department' => $admin->department,
                    'role' => $admin->role,
                ],
                'permanent_admin_count' => $permanentAdminCount,
                'bootstrap_removed' => $bootstrapRemoved,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to create permanent admin', [
                'error' => $e->getMessage(),
                'bootstrap_admin_id' => $currentUser->id,
            ]);

            return response()->json([
                'message' => 'Failed to create admin account. Please try again.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check if current user is bootstrap admin
     */
    public function checkBootstrapStatus(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'is_bootstrap' => $user ? $user->is_bootstrap : false,
        ]);
    }
}
