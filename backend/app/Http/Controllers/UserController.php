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
        ]);

        // Map 'username' to 'name' in the database
        if (isset($validated['username'])) {
            $validated['name'] = $validated['username'];
            unset($validated['username']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'role' => $user->role,
                'is_validated' => $user->is_validated,
                'schedule_initialized' => $user->schedule_initialized ?? false,
            ],
        ]);
    }
}
