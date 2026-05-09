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

            // Get other users filtered by department
            $query = User::where('is_validated', true)
                ->where('designation', '!=', 'Admin')
                ->where('designation', '!=', 'Dean'); // Exclude Dean from this query since we got it separately

            if ($department) {
                // For specific department, show everything including Faculty
                $query->where('department', $department);
            }

            $users = $query->select('id', 'name', 'first_name', 'last_name', 'email', 'department', 'designation', 'profile_picture')
                ->orderByRaw("FIELD(designation, 'CEIT Official', 'Chairperson', 'Program Coordinator', 'Department Research Coordinator', 'Department Extension Coordinator', 'GAD Coordinator', 'Faculty Member')")
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
            'departments' => []
        ];

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
                // CEIT Officials are shown at college level
                $hierarchy['ceitStaff'][] = $userData;
            } else {
                // All other users are grouped by department
                $dept = $user->department;
                if (!isset($departmentGroups[$dept])) {
                    $departmentGroups[$dept] = [
                        'chairperson' => null,
                        'programCoordinators' => [],
                        'departmentCoordinators' => [], // Research and Extension coordinators
                        'faculty' => []
                    ];
                }

                switch ($user->designation) {
                    case 'Chairperson':
                        $departmentGroups[$dept]['chairperson'] = $userData;
                        break;
                    case 'Program Coordinator':
                        $departmentGroups[$dept]['programCoordinators'][] = $userData;
                        break;
                    case 'Department Research Coordinator':
                    case 'Department Extension Coordinator':
                        $departmentGroups[$dept]['departmentCoordinators'][] = $userData;
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
                'departmentCoordinators' => $deptData['departmentCoordinators'] ?? [],
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
            'designation' => 'sometimes|in:Dean,CEIT Official,Chairperson,Program Coordinator,Department Research Coordinator,Department Extension Coordinator,Faculty Member',
        ]);

        $user = User::findOrFail($id);

        // Update the name field if first_name and last_name are provided
        if (isset($validated['first_name']) && isset($validated['last_name'])) {
            $validated['name'] = trim($validated['first_name'] . ' ' . $validated['last_name']);
        }

        // If the user is a Dean or being changed to Dean, don't force department

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
            // Get all department names excluding CEIT (college-level)
            $depts = User::where('is_validated', true)
                ->where('designation', '!=', 'Admin')
                ->where('designation', '!=', 'Dean')
                ->whereNotNull('department')
                ->where('department', '!=', 'CEIT') // Exclude CEIT college-level department
                ->distinct()
                ->pluck('department')
                ->sort()
                ->values();

            return $depts;
        });

        return response()->json(['departments' => $departments]);
    }
}
