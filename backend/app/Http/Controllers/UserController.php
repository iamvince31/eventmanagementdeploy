<?php

namespace App\Http\Controllers;

use App\Models\User;

class UserController extends Controller
{
    public function index()
    {
        // Get all users including the current user
        $users = User::orderBy('name', 'asc')->get();

        return response()->json([
            'members' => $users->map(fn($user) => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
            ]),
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
