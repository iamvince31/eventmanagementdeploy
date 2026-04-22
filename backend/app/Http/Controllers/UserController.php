<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    public function index()
    {
        // Cache for 10 minutes - this is the key optimization
        $members = Cache::remember('users_list_non_admin', 600, function () {
            return User::where('role', '!=', 'Admin')
            ->where('is_validated', true)
            ->select('id', 'name', 'email', 'department', 'role', 'is_validated')
            ->orderBy('role')
            ->orderBy('name', 'asc')
            ->limit(500) // Add limit to prevent huge result sets
            ->get();
        });

        return response()->json([
            'members' => $members->map(fn($user) => [
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
            ->limit(500)
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

    public function store(Request $request)
    {
        // Only admins can create users
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'error' => 'Only admins can create users.'
            ], 403);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'department' => 'required|string|max:255',
            'role' => 'required|in:Admin,Chairperson,Coordinator,Research Coordinator,Extension Coordinator,GAD Coordinator,Faculty Member,CEIT Official',
            'name' => 'required|string|max:255',
        ]);

        // Create the user
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'department' => $validated['department'],
            'role' => $validated['role'],
            'is_validated' => true, // Admin-created users are automatically validated
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user' => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'role' => $user->role,
                'is_validated' => $user->is_validated,
            ],
        ], 201);
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
            'role' => 'required|in:Admin,Chairperson,Coordinator,Research Coordinator,Extension Coordinator,GAD Coordinator,Faculty Member,CEIT Official',
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

    public function createDean(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Only admins can create a Dean.'], 403);
        }

        // Enforce single Dean rule
        if (User::where('role', 'Dean')->exists()) {
            return response()->json(['error' => 'A Dean already exists. Only one Dean is allowed.'], 422);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'name' => 'required|string|max:255',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'department' => 'College of Engineering and Information Technology',
            'role' => 'Dean',
            'is_validated' => true,
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'Dean created successfully',
            'user' => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'role' => $user->role,
                'is_validated' => $user->is_validated,
            ],
        ], 201);
    }

    public function update()
    {
        $user = auth()->user();

        $validated = request()->validate([
            'username' => 'sometimes|string|max:255',
            'profile_picture' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:2048',
            'current_password' => 'sometimes|string',
            'new_password' => 'sometimes|string|min:8',
            'new_password_confirmation' => 'sometimes|string',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
        ]);

        // Map 'username' to 'name' in the database and capitalize each word
        if (isset($validated['username'])) {
            $validated['name'] = $this->capitalizeWords($validated['username']);
            unset($validated['username']);
        }

        // Handle profile picture upload via Supabase Storage
        if (request()->hasFile('profile_picture')) {
            // Delete old Supabase asset if it exists
            if ($user->profile_picture_public_id) {
                \Illuminate\Support\Facades\Storage::disk('supabase')->delete($user->profile_picture_public_id);
            }

            $file = request()->file('profile_picture');
            $filename = 'profiles/profile_' . $user->id . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            \Illuminate\Support\Facades\Storage::disk('supabase')->put($filename, file_get_contents($file->getRealPath()), 'public');
            $publicUrl = rtrim(env('SUPABASE_PUBLIC_URL'), '/') . '/' . env('SUPABASE_S3_BUCKET') . '/' . $filename;

            $validated['profile_picture'] = $publicUrl;
            $validated['profile_picture_public_id'] = $filename;
        }

        // One-time credential change for Admin (email + password)
        if (!$user->has_changed_credentials && $user->role === 'Admin') {
            // Handle email change
            if (isset($validated['email']) && $validated['email'] !== $user->email) {
                $validated['has_changed_credentials'] = true;
            }

            // Handle password change
            if (isset($validated['current_password']) && isset($validated['new_password'])) {
                if (!\Hash::check($validated['current_password'], $user->password)) {
                    return response()->json(['message' => 'Current password is incorrect.'], 422);
                }
                if (($validated['new_password_confirmation'] ?? '') !== $validated['new_password']) {
                    return response()->json(['message' => 'New passwords do not match.'], 422);
                }
                $validated['password'] = \Hash::make($validated['new_password']);
                $validated['has_changed_credentials'] = true;
            }
        }
        else {
            // Not allowed to change email/password after first time
            unset($validated['email']);
        }

        unset($validated['current_password'], $validated['new_password'], $validated['new_password_confirmation']);
        unset($validated['department']);

        $user->update($validated);
        $user->refresh();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'profile_picture' => $user->profile_picture ?? null,
                'role' => $user->role,
                'is_validated' => $user->is_validated,
                'schedule_initialized' => $user->schedule_initialized ?? false,
                'has_changed_credentials' => $user->has_changed_credentials ?? false,
            ],
        ]);
    }

    /**
     * Capitalize the first letter of each word in a string
     * 
     * @param string $text
     * @return string
     */
    public function destroy(Request $request, $id)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Only admins can delete users.'], 403);
        }

        $userToDelete = User::findOrFail($id);

        // Prevent self-deletion
        if ($userToDelete->id === $request->user()->id) {
            return response()->json(['error' => 'You cannot delete your own account.'], 403);
        }

        // Prevent deleting other admins
        if ($userToDelete->role === 'Admin') {
            return response()->json(['error' => 'Admin accounts cannot be deleted.'], 403);
        }

        $userToDelete->delete();

        // Bust cache so the user list refreshes correctly
        Cache::forget('users_list_non_admin');

        return response()->json(['message' => 'User deleted successfully.']);
    }

    private function capitalizeWords($text)
    {
        // Split by spaces and capitalize each word
        $words = explode(' ', $text);
        $capitalizedWords = array_map(function ($word) {
            return ucfirst(strtolower(trim($word)));
        }, $words);

        return implode(' ', array_filter($capitalizedWords));
    }
}
