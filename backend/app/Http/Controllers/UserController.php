<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        // Get all users excluding admins
        $users = User::where('role', '!=', 'admin')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'members' => $users->map(fn($user) => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'role' => $user->role,
            ]),
        ]);
    }

    public function all()
    {
        // Get all users including admins (for admin panel)
        $users = User::orderBy('name', 'asc')->get();

        return response()->json([
            'members' => $users->map(fn($user) => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'role' => $user->role,
            ]),
        ]);
    }

    public function updateRole(Request $request, $id)
    {
        $validated = $request->validate([
            'role' => 'required|in:admin,dean,chairperson,program_coordinator,Faculty',
        ]);

        $user = User::findOrFail($id);
        
        // Prevent changing own role
        if ($user->id === $request->user()->id) {
            return response()->json([
                'error' => 'You cannot change your own role.'
            ], 403);
        }

        $user->update(['role' => $validated['role']]);

        return response()->json([
            'message' => 'User role updated successfully',
            'user' => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'role' => $user->role,
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
                'schedule_initialized' => $user->schedule_initialized ?? false,
            ],
        ]);
    }
}
