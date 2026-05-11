<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    public function index()
    {
        // Define default values for each setting key
        $defaults = [
            'departments' => [
                'College of Engineering and Information Technology',
                'Department of Information Technology',
                'Department of Industrial Engineering and Technology',
                'Department of Computer, Electronics, and Electrical Engineering',
                'Department of Civil Engineering and Architecture',
                'Department of Agriculture and Food Engineering',
            ],
            'ceit_roles' => ['Dean', 'CEIT Official', 'Faculty Member'],
            'department_roles' => ['Chairperson', 'Department Research Coordinator', 'Department Extension Coordinator', 'Faculty Member'],
            'ceit_officer_types' => [] // No defaults for this
        ];
        
        // Get settings from database
        $dbSettings = \App\Models\SystemSetting::all()->pluck('value', 'key')->toArray();
        
        // Merge defaults with database values (database values take precedence)
        $settings = [];
        foreach ($defaults as $key => $defaultValue) {
            if (isset($dbSettings[$key]) && !empty($dbSettings[$key])) {
                // Database already contains defaults merged with user-added values
                $settings[$key] = $dbSettings[$key];
            } else {
                $settings[$key] = $defaultValue;
            }
        }
        
        // Also include any settings in database that aren't in defaults
        foreach ($dbSettings as $key => $value) {
            if (!isset($defaults[$key])) {
                $settings[$key] = $value;
            }
        }
        
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
                'College of Engineering and Information Technology',
                'Department of Information Technology',
                'Department of Industrial Engineering and Technology',
                'Department of Computer, Electronics, and Electrical Engineering',
                'Department of Civil Engineering and Architecture',
                'Department of Agriculture and Food Engineering',
            ],
            'ceit_roles' => ['Dean', 'CEIT Official', 'Faculty Member'],
            'department_roles' => ['Chairperson', 'Department Research Coordinator', 'Department Extension Coordinator', 'Faculty Member'],
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

        return response()->json([
            'message' => 'Setting updated successfully',
            'setting' => $setting
        ]);
    }
}
