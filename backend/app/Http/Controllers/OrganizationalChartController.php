<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class OrganizationalChartController extends Controller
{
    public function index(Request $request)
    {
        $department = $request->query('department');

        $cacheKey = $department ? "org_chart_{$department}" : 'org_chart_all';

        $data = Cache::remember($cacheKey, 600, function () use ($department) {
            // Always get the Dean (handles all departments)
            $dean = User::where('is_validated', true)
                ->where('designation', 'Dean')
                ->select('id', 'name', 'first_name', 'last_name', 'email', 'department', 'designation', 'profile_picture')
                ->first();

            // Check if viewing college level
            $isCollegeLevel = ($department === 'College of Engineering and Information Technology');

            // Get other users filtered by department
            $query = User::where('is_validated', true)
                ->where('designation', '!=', 'Admin')
                ->where('designation', '!=', 'Dean'); // Exclude Dean from this query since we got it separately

            if ($department && !$isCollegeLevel) {
                // For specific department, show everything including Faculty
                $query->where('department', $department);
            } elseif ($isCollegeLevel) {
                // For college level, get CEIT Official, Coordinator, and Faculty Members from college
                $query->where('department', 'College of Engineering and Information Technology')
                    ->whereIn('designation', ['CEIT Official', 'Coordinator', 'Faculty Member']);
            }

            $users = $query->select('id', 'name', 'first_name', 'last_name', 'email', 'department', 'designation', 'profile_picture')
                ->orderByRaw("FIELD(designation, 'CEIT Official', 'Chairperson', 'Program Coordinator', 'Research Coordinator', 'Extension Coordinator', 'GAD Coordinator', 'Faculty Member')")
                ->orderBy('name', 'asc')
                ->get();

            // Add Dean to the beginning of the collection
            if ($dean) {
                $users->prepend($dean);
            }

            return $this->buildHierarchy($users, $department);
        });

        return response()->json($data);
    }

    private function buildHierarchy($users, $department = null)
    {
        $hierarchy = [
            'dean' => null,
            'ceitStaff' => [],
            'ceitCoordinators' => [],
            'facultyMembers' => [],
            'chairpersons' => [],
            'departments' => []
        ];

        // Check if we're viewing the college level
        $isCollegeLevel = ($department === 'College of Engineering and Information Technology');

        // Group users by department
        $departmentGroups = [];

        foreach ($users as $user) {
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'department' => $user->department,
                'designation' => $user->designation,
                'profile_picture' => $user->profile_picture ?? null
            ];

            if ($user->designation === 'Dean') {
                $hierarchy['dean'] = $userData;
            } elseif ($user->designation === 'CEIT Official') {
                // CEIT Officials are always shown at college level (in ceitStaff array)
                $hierarchy['ceitStaff'][] = $userData;
            } elseif ($user->designation === 'Faculty Member' && $isCollegeLevel) {
                // For college level view, show Faculty Members at college level
                $hierarchy['facultyMembers'][] = $userData;
            } elseif ($user->designation === 'Coordinator' && $isCollegeLevel) {
                // For college level view, show Coordinators below CEIT Official
                $hierarchy['ceitCoordinators'][] = $userData;
            } elseif ($user->designation === 'Chairperson') {
                // If viewing college level, show all chairpersons at college level
                // Otherwise, show chairperson within their department
                if ($isCollegeLevel) {
                    $hierarchy['chairpersons'][] = $userData;
                } else {
                    $dept = $user->department;
                    if (!isset($departmentGroups[$dept])) {
                        $departmentGroups[$dept] = [
                            'chairperson' => null,
                            'programCoordinators' => [],
                            'coordinators' => [],
                            'faculty' => []
                        ];
                    }
                    $departmentGroups[$dept]['chairperson'] = $userData;
                }
            } else {
                $dept = $user->department;
                if (!isset($departmentGroups[$dept])) {
                    $departmentGroups[$dept] = [
                        'ceitStaff' => [],
                        'chairperson' => null,
                        'programCoordinators' => [],
                        'coordinators' => [],
                        'faculty' => []
                    ];
                }

                switch ($user->designation) {
                    case 'Program Coordinator':
                        $departmentGroups[$dept]['programCoordinators'][] = $userData;
                        break;
                    case 'Research Coordinator':
                    case 'Extension Coordinator':
                        $departmentGroups[$dept]['coordinators'][] = $userData;
                        break;
                    case 'Faculty Member':
                        $departmentGroups[$dept]['faculty'][] = $userData;
                        break;
                }
            }
        }

        // Convert department groups to array with proper null handling
        foreach ($departmentGroups as $deptName => $deptData) {
            $hierarchy['departments'][] = [
                'name' => $deptName,
                'chairperson' => $deptData['chairperson'] ?? null,
                'programCoordinators' => $deptData['programCoordinators'] ?? [],
                'coordinators' => $deptData['coordinators'] ?? [],
                'faculty' => $deptData['faculty'] ?? []
            ];
        }

        return $hierarchy;
    }

    public function update(Request $request, $id)
    {
        // Only admin or dean can update
        if (!$request->user()->isAdmin() && !$request->user()->isDean()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'department' => 'sometimes|string|max:255',
            'designation' => 'sometimes|in:Dean,CEIT Official,Chairperson,Program Coordinator,Research Coordinator,Extension Coordinator,GAD Coordinator,Coordinator,Faculty Member',
        ]);

        $user = User::findOrFail($id);

        // Update the name field if first_name and last_name are provided
        if (isset($validated['first_name']) && isset($validated['last_name'])) {
            $validated['name'] = trim($validated['first_name'] . ' ' . $validated['last_name']);
        }

        // If the user is a Dean or being changed to Dean, force the department
        if ($user->designation === 'Dean' || (isset($validated['designation']) && $validated['designation'] === 'Dean')) {
            $validated['department'] = 'College of Engineering and Information Technology';
        }

        $user->update($validated);

        // Clear cache
        Cache::forget('org_chart_all');
        Cache::forget("org_chart_{$user->department}");

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    public function destroy(Request $request, $id)
    {
        // Only admin or dean can delete
        if (!$request->user()->isAdmin() && !$request->user()->isDean()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);
        $department = $user->department;
        $user->delete();

        // Clear cache
        Cache::forget('org_chart_all');
        Cache::forget("org_chart_{$department}");

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function departments()
    {
        $departments = Cache::remember('org_chart_departments', 600, function () {
            // Get all department names including the college-level department
            $depts = User::where('is_validated', true)
                ->where('designation', '!=', 'Admin')
                ->where('designation', '!=', 'Dean')
                ->whereNotNull('department')
                ->distinct()
                ->pluck('department')
                ->sort()
                ->values();

            // Ensure "College of Engineering and Information Technology" is at the top
            $depts = $depts->filter(
                function ($dept) {
                    return $dept !== 'College of Engineering and Information Technology';
                }
            )->values();

            $depts->prepend('College of Engineering and Information Technology');

            return $depts;
        });

        return response()->json(['departments' => $departments]);
    }
}
