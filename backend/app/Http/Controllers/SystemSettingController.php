<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    public function index()
    {
        $settings = \App\Models\SystemSetting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    public function update(Request $request, $key)
    {
        $request->validate([
            'value' => 'required|array',
        ]);

        // Get existing setting value
        $existingSetting = \App\Models\SystemSetting::where('key', $key)->first();
        
        if ($existingSetting) {
            // Merge new values with existing values, removing duplicates
            $existingValue = $existingSetting->value ?? [];
            $newValue = $request->value;
            
            // Merge arrays and remove duplicates
            $mergedValue = array_values(array_unique(array_merge($existingValue, $newValue)));
            
            $existingSetting->update(['value' => $mergedValue]);
            $setting = $existingSetting;
        } else {
            // Create new setting
            $setting = \App\Models\SystemSetting::create([
                'key' => $key,
                'value' => $request->value
            ]);
        }

        return response()->json([
            'message' => 'Setting updated successfully',
            'setting' => $setting
        ]);
    }
}
