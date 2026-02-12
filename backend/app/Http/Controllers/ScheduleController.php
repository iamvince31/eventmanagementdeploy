<?php

namespace App\Http\Controllers;

use App\Models\UserSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ScheduleController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        // Fetch all schedules in one query with specific columns only
        $schedules = UserSchedule::where('user_id', $user->id)
            ->select('id', 'day', 'start_time', 'end_time', 'description')
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
                'description' => $schedule->description
            ];
        }

        return response()->json([
            'schedule' => $groupedSchedules
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        
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
            
            foreach ($request->schedule as $day => $classes) {
                foreach ($classes as $class) {
                    if (!empty($class['startTime']) && !empty($class['endTime'])) {
                        $schedules[] = [
                            'user_id' => $user->id,
                            'day' => $day,
                            'start_time' => $class['startTime'],
                            'end_time' => $class['endTime'],
                            'description' => $class['description'] ?? '',
                            'created_at' => $now,
                            'updated_at' => $now
                        ];
                    }
                }
            }

            // Bulk insert for better performance
            if (!empty($schedules)) {
                UserSchedule::insert($schedules);
            }
            
            \DB::commit();

            return response()->json([
                'message' => 'Schedule saved successfully'
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json([
                'message' => 'Failed to save schedule'
            ], 500);
        }
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
