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
                ->select('id', 'name', 'email', 'department', 'role as designation', 'is_validated')
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
                'designation' => $user->designation,
                'ceit_officer_type' => $user->ceit_officer_type,
                'designations' => $user->getDesignationsArray(),
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
                'designation' => $user->designation,
                'ceit_officer_type' => $user->ceit_officer_type,
                'designations' => $user->getDesignationsArray(),
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
            'department' => 'nullable|string|max:255',
            'designation' => 'required|in:Admin,Dean,CEIT Official,Chairperson,Department Research Coordinator,Department Extension Coordinator,Faculty Member',
            'ceit_officer_type' => 'nullable|string|max:255',
            'name' => 'required|string|max:255',
        ]);

        // Require department for non-Faculty-Member designations
        if ($validated['designation'] !== 'Faculty Member' && empty($validated['department'])) {
            return response()->json(['errors' => ['department' => ['Department is required for this designation.']]], 422);
        }
        // Create the user
        // Enforce one Chairperson per department
        if ($validated['designation'] === 'Chairperson') {
            $existing = User::where('designation', 'Chairperson')
                ->where('department', $validated['department'])
                ->exists();
            if ($existing) {
                return response()->json([
                    'error' => 'A Chairperson already exists for this department. Only one Chairperson is allowed per department.'
                ], 422);
            }
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'department' => $validated['department'],
            'designation' => $validated['designation'],
            'ceit_officer_type' => $validated['designation'] === 'CEIT Official' ? (is_array($request->ceit_officer_type) ? $request->ceit_officer_type : ($request->ceit_officer_type ? [$request->ceit_officer_type] : null)) : null,
            'is_validated' => true,
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user' => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'designation' => $user->designation,
                'ceit_officer_type' => $user->ceit_officer_type,
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
                'designation' => $user->designation,
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
                'designation' => $user->designation,
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
                'designation' => $user->designation,
                'is_validated' => $user->is_validated,
            ],
        ]);
    }

    public function updateDesignation(Request $request, $id)
    {
        $validated = $request->validate([
            'designations' => 'required|array|min:1|max:5',
            'designations.*' => 'string|max:255',
            'department' => 'nullable|string|max:255',
            'ceit_officer_type' => 'nullable|string|max:255',
        ]);

        // Treat empty string as null
        if (isset($validated['department']) && $validated['department'] === '') {
            $validated['department'] = null;
        }

        $designations = $validated['designations'];
        $allFacultyMember = count(array_filter($designations, fn($d) => $d !== 'Faculty Member')) === 0;

        // Department required unless all designations are Faculty Member
        if (!$allFacultyMember && empty($validated['department'])) {
            return response()->json([
                'errors' => ['department' => ['Department is required for this designation.']]
            ], 422);
        }

        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'You cannot change your own designation.'], 403);
        }

        $department = $validated['department'] ?? $user->department;
        $designations = $validated['designations'];

        // Enforce one Chairperson per department
        if (in_array('Chairperson', $designations)) {
            $existing = User::where('id', '!=', $id)
                ->where('department', $department)
                ->whereJsonContains('designations', 'Chairperson')
                ->exists();
            if (!$existing) {
                // Also check legacy single designation column
                $existing = User::where('id', '!=', $id)
                    ->where('department', $department)
                    ->where('designation', 'Chairperson')
                    ->whereNull('designations')
                    ->exists();
            }
            if ($existing) {
                return response()->json(['error' => 'A Chairperson already exists for this department.'], 422);
            }
        }

        $updateData = [
            'designations' => $designations,
            'designation' => $designations[0], // keep primary for backward compat
        ];
        if (array_key_exists('department', $validated)) {
            $updateData['department'] = $validated['department']; // can be null
        }
        // Only store ceit_officer_type when designation is CEIT Official
        $updateData['ceit_officer_type'] = $validated['designation'] === 'CEIT Official'
            ? (is_array($request->ceit_officer_type) ? $request->ceit_officer_type : ($request->ceit_officer_type ? [$request->ceit_officer_type] : null))
            : null;

        $user->update($updateData);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $this->formatUser($user->fresh()),
        ]);
    }

    public function createDean(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Only admins can create a Dean.'], 403);
        }

        // Enforce single Dean rule
        if (User::where('designation', 'Dean')->exists()) {
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
            'department' => 'CEIT',
            'designation' => 'Dean',
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
                'designation' => $user->designation,
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
            try {
                \Illuminate\Support\Facades\Storage::disk('supabase')->put($filename, $file->get(), 'public');
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Supabase profile upload failed', [
                    'error' => $e->getMessage(),
                    'user_id' => $user->id,
                ]);
                return response()->json([
                    'message' => 'Profile picture upload failed: ' . $e->getMessage()
                ], 500);
            }
            $publicUrl = rtrim(config('filesystems.disks.supabase.public_url'), '/') . '/' . config('filesystems.disks.supabase.bucket') . '/' . $filename;

            $validated['profile_picture'] = $publicUrl;
            $validated['profile_picture_public_id'] = $filename;
        }

        // One-time email change for Admin
        if (isset($validated['email']) && $validated['email'] !== $user->email) {
            if ($user->has_changed_email || $user->designation !== 'Admin') {
                unset($validated['email']);
            } else {
                $validated['has_changed_email'] = true;
            }
        } else {
            unset($validated['email']);
        }

        // Password change (allowed for all users)
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
                'designation' => $user->designation,
                'is_validated' => $user->is_validated,
                'schedule_initialized' => $user->schedule_initialized ?? false,
                'has_changed_credentials' => $user->has_changed_credentials ?? false,
                'has_changed_email' => $user->has_changed_email ?? false,
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
        if ($userToDelete->designation === 'Admin') {
            return response()->json(['error' => 'Admin accounts cannot be deleted.'], 403);
        }

        $userToDelete->delete();

        // Bust cache so the user list refreshes correctly
        Cache::forget('users_list_non_admin');

        return response()->json(['message' => 'User deleted successfully.']);
    }

    private function capitalizeWords($text)
    {
        $words = explode(' ', $text);
        $capitalizedWords = array_map(function ($word) {
            return ucfirst(strtolower(trim($word)));
        }, $words);
        return implode(' ', array_filter($capitalizedWords));
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->name,
            'email' => $user->email,
            'department' => $user->department,
            'designation' => $user->designation,
            'designations' => $user->getDesignationsArray(),
            'is_validated' => $user->is_validated,
            'profile_picture' => $user->profile_picture ?? null,
            'schedule_initialized' => $user->schedule_initialized ?? false,
            'has_changed_credentials' => $user->has_changed_credentials ?? false,
            'has_changed_email' => $user->has_changed_email ?? false,
        ];
    }
}
