<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        // Get all users excluding admins, with role filtering
        $users = User::where('role', '!=', 'Admin')
            ->orderBy('role')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'members' => $users->map(fn($user) => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'role' => $user->role,
                'is_validated' => $user->is_validated,
            ]),
        ]);
    }

    public function all()
    {
        // Get all users including admins (for admin panel)
        $users = User::orderBy('role')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'members' => $users->map(fn($user) => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'role' => $user->role,
                'is_validated' => $user->is_validated,
            ]),
        ]);
    }

    public function pendingValidation(Request $request)
    {
        // Only admins can see pending validations
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'error' => 'Only admins can view pending validations.'
            ], 403);
        }

        // Get all unvalidated users
        $pendingUsers = User::where('is_validated', false)
            ->where('email_verified_at', '!=', null) // Only show users who verified their email
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'pending_users' => $pendingUsers->map(fn($user) => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'role' => $user->role,
                'created_at' => $user->created_at,
            ]),
            'count' => $pendingUsers->count(),
        ]);
    }

    public function validateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        // Only admins can validate users
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'error' => 'Only admins can validate users.'
            ], 403);
        }

        $user->update(['is_validated' => true]);

        return response()->json([
            'message' => 'User validated successfully',
            'user' => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'role' => $user->role,
                'is_validated' => $user->is_validated,
            ],
        ]);
    }

    public function revokeValidation(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        // Only admins can revoke validation
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'error' => 'Only admins can revoke user validation.'
            ], 403);
        }

        $user->update(['is_validated' => false]);

        return response()->json([
            'message' => 'User validation revoked successfully',
            'user' => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'role' => $user->role,
                'is_validated' => $user->is_validated,
            ],
        ]);
    }

    public function updateRole(Request $request, $id)
    {
        $validated = $request->validate([
            'role' => 'required|in:Admin,Dean,Chairperson,Coordinator,Faculty Member',
            'department' => 'sometimes|string|max:255',
        ]);

        $user = User::findOrFail($id);
        
        // Prevent changing own role
        if ($user->id === $request->user()->id) {
            return response()->json([
                'error' => 'You cannot change your own role.'
            ], 403);
        }

        $updateData = ['role' => $validated['role']];
        if (isset($validated['department'])) {
            $updateData['department'] = $validated['department'];
        }

        $user->update($updateData);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'role' => $user->role,
                'is_validated' => $user->is_validated,
            ],
        ]);
    }

    public function update()
    {
        $user = auth()->user();
        
        $validated = request()->validate([
            'username' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'department' => 'sometimes|string|max:255',
            'profile_picture' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Map 'username' to 'name' in the database and capitalize each word
        if (isset($validated['username'])) {
            $validated['name'] = $this->capitalizeWords($validated['username']);
            unset($validated['username']);
        }

        // Handle profile picture upload
        if (request()->hasFile('profile_picture')) {
            // Delete old profile picture if exists
            if ($user->profile_picture && file_exists(public_path($user->profile_picture))) {
                unlink(public_path($user->profile_picture));
            }

            $file = request()->file('profile_picture');
            $filename = 'profile_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/profiles'), $filename);
            $validated['profile_picture'] = 'uploads/profiles/' . $filename;
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'profile_picture' => $user->profile_picture ? url($user->profile_picture) : null,
                'role' => $user->role,
                'is_validated' => $user->is_validated,
                'schedule_initialized' => $user->schedule_initialized ?? false,
            ],
        ]);
    }

    /**
     * Capitalize the first letter of each word in a string
     * 
     * @param string $text
     * @return string
     */
    private function capitalizeWords($text)
    {
        // Split by spaces and capitalize each word
        $words = explode(' ', $text);
        $capitalizedWords = array_map(function($word) {
            return ucfirst(strtolower(trim($word)));
        }, $words);
        
        return implode(' ', array_filter($capitalizedWords));
    }
}
