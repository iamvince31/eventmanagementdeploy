<?php

namespace App\Http\Controllers;

use App\Models\UserSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ScheduleController extends Controller
{
    // Predefined color palette for class schedules
    private $colorPalette = [
        '#10b981', // Green
        '#3b82f6', // Blue
        '#f59e0b', // Amber
        '#ef4444', // Red
        '#8b5cf6', // Purple
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#f97316', // Orange
        '#14b8a6', // Teal
        '#6366f1', // Indigo
    ];

    public function index()
    {
        $user = Auth::user();
        
        // Fetch all schedules in one query with specific columns only
        $schedules = UserSchedule::where('user_id', $user->id)
            ->select('id', 'day', 'start_time', 'end_time', 'description', 'color')
            ->orderBy('day')
            ->orderBy('start_time')
            ->get();
        
        // Group schedules by day efficiently
        $groupedSchedules = [];
        foreach ($schedules as $schedule) {
            if (!isset($groupedSchedules[$schedule->day])) {
                $groupedSchedules[$schedule->day] = [];
            }
            $groupedSchedules[$schedule->day][] = [
                'id' => $schedule->id,
                'startTime' => $schedule->start_time,
                'endTime' => $schedule->end_time,
                'description' => $schedule->description,
                'color' => $schedule->color
            ];
        }

        return response()->json([
            'schedule' => $groupedSchedules,
            'initialized' => $user->schedule_initialized
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Basic validation - detailed validation happens in the loop
        $request->validate([
            'schedule' => 'required|array',
            'schedule.*' => 'array'
        ]);

        // Use transaction for data consistency
        \DB::beginTransaction();
        
        try {
            // Delete existing schedules for this user
            UserSchedule::where('user_id', $user->id)->delete();

            // Prepare bulk insert data
            $schedules = [];
            $now = now();
            
            // Track unique class descriptions and assign colors
            $classColorMap = [];
            $colorIndex = 0;
            
            foreach ($request->schedule as $day => $classes) {
                // Validate day name
                if (!in_array($day, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])) {
                    continue;
                }
                
                foreach ($classes as $index => $class) {
                    // Skip if both times are empty (user didn't fill this slot)
                    if (empty($class['startTime']) && empty($class['endTime'])) {
                        continue;
                    }
                    
                    // Check if one time is filled but not the other
                    if (empty($class['startTime']) || empty($class['endTime'])) {
                        throw new \Exception("Both start and end times are required for {$day}");
                    }
                    
                    // Trim whitespace
                    $startTime = trim($class['startTime']);
                    $endTime = trim($class['endTime']);
                    
                    // Normalize times to 24-hour format
                    $normalizedStart = $this->normalizeTime($startTime, $day, 'start');
                    $normalizedEnd = $this->normalizeTime($endTime, $day, 'end');
                    
                    // Validate that start time is before end time
                    if ($normalizedStart >= $normalizedEnd) {
                        throw new \Exception("Start time must be before end time for {$day} (Start: {$normalizedStart}, End: {$normalizedEnd})");
                    }
                    
                    // Get description and normalize it for color mapping
                    $description = $class['description'] ?? '';
                    $normalizedDescription = strtolower(trim($description));
                    
                    // Assign color based on class description (same description = same color)
                    if (!isset($classColorMap[$normalizedDescription])) {
                        $classColorMap[$normalizedDescription] = $this->colorPalette[$colorIndex % count($this->colorPalette)];
                        $colorIndex++;
                    }
                    $color = $classColorMap[$normalizedDescription];
                    
                    $schedules[] = [
                        'user_id' => $user->id,
                        'day' => $day,
                        'start_time' => $normalizedStart,
                        'end_time' => $normalizedEnd,
                        'description' => $description,
                        'color' => $color,
                        'created_at' => $now,
                        'updated_at' => $now
                    ];
                }
            }

            // Bulk insert for better performance
            if (!empty($schedules)) {
                UserSchedule::insert($schedules);
            }
            
            // Mark schedule as initialized (even if empty)
            $user->schedule_initialized = true;
            $user->save();
            
            \DB::commit();

            return response()->json([
                'message' => 'Schedule saved successfully',
                'count' => count($schedules)
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Schedule save failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to save schedule',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Normalize time to 24-hour format (HH:MM)
     * Accepts both 24-hour (13:00) and 12-hour (1:00 PM) formats
     * Also handles times with seconds (HH:MM:SS)
     */
    private function normalizeTime($time, $day, $type)
    {
        // Check for 12-hour format with AM/PM
        if (preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|am|pm)$/i', $time, $matches)) {
            $hour = (int)$matches[1];
            $minute = $matches[2];
            $ampm = strtoupper($matches[3]);
            
            // Validate hour range for 12-hour format
            if ($hour < 1 || $hour > 12) {
                throw new \Exception("Invalid hour '{$hour}' in {$type} time for {$day}. Hour must be 1-12 for 12-hour format.");
            }
            
            // Convert to 24-hour format
            if ($ampm === 'PM' && $hour !== 12) {
                $hour += 12;
            } elseif ($ampm === 'AM' && $hour === 12) {
                $hour = 0;
            }
            
            return sprintf('%02d:%s', $hour, $minute);
        }
        
        // Check for 24-hour format (with or without seconds)
        if (preg_match('/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/', $time, $matches)) {
            $hour = (int)$matches[1];
            $minute = $matches[2];
            // Ignore seconds if present
            
            // Validate hour range for 24-hour format
            if ($hour < 0 || $hour > 23) {
                throw new \Exception("Invalid hour '{$hour}' in {$type} time for {$day}. Hour must be 0-23 for 24-hour format.");
            }
            
            // Validate minute range
            if ((int)$minute < 0 || (int)$minute > 59) {
                throw new \Exception("Invalid minute '{$minute}' in {$type} time for {$day}. Minute must be 0-59.");
            }
            
            return sprintf('%02d:%02d', $hour, (int)$minute);
        }
        
        // Invalid format
        throw new \Exception("Invalid time format '{$time}' for {$day} {$type} time. Expected HH:MM (24-hour) or HH:MM AM/PM (12-hour).");
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $schedule = UserSchedule::where('user_id', $user->id)->where('id', $id)->first();

        if (!$schedule) {
            return response()->json(['message' => 'Schedule not found'], 404);
        }

        $schedule->delete();

        return response()->json([
            'message' => 'Schedule deleted successfully'
        ]);
    }

    public function checkConflicts(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'integer',
            'date' => 'required|date',
            'time' => 'required|string'
        ]);

        $userIds = $request->user_ids;
        $eventDate = $request->date;
        $eventTime = $request->time;

        // Get day of week
        $date = new \DateTime($eventDate);
        $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        $dayName = $days[$date->format('w')];

        // Parse event time
        $timeParts = explode(':', $eventTime);
        $eventHour = (int)$timeParts[0];
        $eventMinute = isset($timeParts[1]) ? (int)$timeParts[1] : 0;
        
        // Handle AM/PM
        if (stripos($eventTime, 'pm') !== false && $eventHour < 12) {
            $eventHour += 12;
        } elseif (stripos($eventTime, 'am') !== false && $eventHour === 12) {
            $eventHour = 0;
        }
        
        $eventTimeStr = sprintf('%02d:%02d', $eventHour, $eventMinute);

        // Get schedules for all users on that day
        $schedules = UserSchedule::whereIn('user_id', $userIds)
            ->where('day', $dayName)
            ->with('user:id,name,email')
            ->get();

        // Check for conflicts
        $conflicts = [];
        foreach ($schedules as $schedule) {
            if ($eventTimeStr >= $schedule->start_time && $eventTimeStr < $schedule->end_time) {
                $conflicts[] = [
                    'user_id' => $schedule->user_id,
                    'username' => $schedule->user->name,
                    'email' => $schedule->user->email,
                    'class_time' => $schedule->start_time . ' - ' . $schedule->end_time,
                    'class_description' => $schedule->description
                ];
            }
        }

        return response()->json([
            'conflicts' => $conflicts
        ]);
    }
}
