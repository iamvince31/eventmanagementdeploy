<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    public function index()
    {
        $settings = \Illuminate\Support\Facades\Cache::remember('system_settings_all', 600, function () {
            // Define default values for each setting key
            $defaults = [
                'departments' => [
                    'Department of Information Technology',
                    'Department of Industrial Engineering and Technology',
                    'Department of Computer, Electronics, and Electrical Engineering',
                    'Department of Civil Engineering and Architecture',
                    'Department of Agriculture and Food Engineering',
                ],
                'designations' => ['Dean', 'CEIT Official', 'Faculty Member', 'Chairperson', 'Department Research Coordinator', 'Department Extension Coordinator'],
                'ceit_officer_types' => [] // No defaults for this
            ];

            // Get settings from database
            $dbSettings = \App\Models\SystemSetting::all()->pluck('value', 'key')->toArray();

            // Merge defaults with database values
            $settings = [];
            foreach ($defaults as $key => $defaultValue) {
                $dbValue = $dbSettings[$key] ?? [];
                // Merge defaults with database values, remove duplicates
                $mergedValue = array_values(array_unique(array_merge($defaultValue, $dbValue)));
                $settings[$key] = $mergedValue;
            }

            // Also include any settings in database that aren't in defaults
            foreach ($dbSettings as $key => $value) {
                if (!isset($defaults[$key])) {
                    $settings[$key] = $value;
                }
            }

            return $settings;
        });

        return response()->json($settings);
    }

    public function update(Request $request, $key)
    {
        $request->validate([
            'value' => 'required|array',
        ]);

        // Get existing setting value
        $existingSetting = \App\Models\SystemSetting::where('key', $key)->first();

        // Define default values for each setting key
        $defaults = [
            'departments' => [
                'Department of Information Technology',
                'Department of Industrial Engineering and Technology',
                'Department of Computer, Electronics, and Electrical Engineering',
                'Department of Civil Engineering and Architecture',
                'Department of Agriculture and Food Engineering',
            ],
            'designations' => ['Dean', 'CEIT Official', 'Faculty Member', 'Chairperson', 'Department Research Coordinator', 'Department Extension Coordinator'],
            'ceit_officer_types' => [] // No defaults for this
        ];

        $defaultValue = $defaults[$key] ?? [];

        if ($existingSetting) {
            // Merge defaults with the new values from request
            // The request value should contain all items the user wants to keep (including defaults)
            $mergedValue = array_values(array_unique(array_merge($defaultValue, $request->value)));

            $existingSetting->update(['value' => $mergedValue]);
            $setting = $existingSetting;
        } else {
            // For new setting, merge defaults with provided values
            $mergedValue = array_values(array_unique(array_merge($defaultValue, $request->value)));

            $setting = \App\Models\SystemSetting::create([
                'key' => $key,
                'value' => $mergedValue
            ]);
        }

        // Always invalidate the settings cache
        \Illuminate\Support\Facades\Cache::forget('system_settings_all');

        if ($key === 'departments' || $key === 'designations') {
            \Illuminate\Support\Facades\Cache::forget('org_chart_departments');
            \Illuminate\Support\Facades\Cache::forget('org_chart_all');
            // Clear all department-specific org chart caches dynamically
            $allDepts = array_merge(
                $request->value ?? [],
                \App\Models\User::whereNotNull('department')->where('department', '!=', '')->distinct()->pluck('department')->toArray()
            );
            foreach (array_unique($allDepts) as $dept) {
                \Illuminate\Support\Facades\Cache::forget("org_chart_{$dept}");
            }
        }

        return response()->json([
            'message' => 'Setting updated successfully',
            'setting' => $setting
        ]);
    }
}
