<?php

namespace App\Http\Controllers;

use App\Models\DefaultEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DefaultEventController extends Controller
{
    /**
     * Get all default events ordered by month and order.
     * Returns base events (no school_year) and school-year-specific versions.
     * If both exist for the same event, only the school-year-specific version is returned.
     *
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $schoolYear = $request->query('school_year');
        
        if ($schoolYear) {
            // Get all events (base + school-year-specific)
            $allEvents = DefaultEvent::where(function($q) use ($schoolYear) {
                $q->where('school_year', $schoolYear)
                  ->orWhereNull('school_year');
            })
            ->orderByRaw('CASE WHEN school_year IS NULL THEN 1 ELSE 0 END')
            ->orderBy('month')
            ->orderBy('order')
            ->get(['id', 'name', 'month', 'order', 'date', 'end_date', 'school_year']);

            // Get all school-year-specific event names to exclude their base versions
            $schoolYearEventNames = $allEvents
                ->where('school_year', $schoolYear)
                ->pluck('name')
                ->unique()
                ->toArray();

            // Filter events: 
            // 1. Include all school-year-specific events
            // 2. Include base events ONLY if no school-year-specific version exists for that event name
            $eventsByKey = [];
            foreach ($allEvents as $event) {
                $isSchoolYearSpecific = $event->school_year === $schoolYear;
                $hasSchoolYearVersion = in_array($event->name, $schoolYearEventNames);
                
                // Include if it's school-year-specific OR if it's a base event with no school-year version
                if ($isSchoolYearSpecific || !$hasSchoolYearVersion) {
                    $key = $event->name . '_' . $event->month;
                    
                    // Only add if we haven't seen this exact event yet
                    if (!isset($eventsByKey[$key])) {
                        $eventsByKey[$key] = $event;
                    }
                }
            }
            
            // Re-sort by month and order for display
            $events = collect(array_values($eventsByKey))
                ->sortBy([
                    ['month', 'asc'],
                    ['order', 'asc']
                ])
                ->values()
                ->all();
        } else {
            // No school year filter - return all events
            $events = DefaultEvent::orderBy('month')
                ->orderBy('order')
                ->get(['id', 'name', 'month', 'order', 'date', 'end_date', 'school_year']);
        }

        return response()->json([
            'events' => $events
        ]);
    }

    /**
     * Update the date for a default event.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateDate(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:date',
            'school_year' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $baseEvent = DefaultEvent::find($id);

        if (!$baseEvent) {
            return response()->json([
                'error' => 'Event not found'
            ], 404);
        }

        // Validate that the date is not a Sunday
        $date = \Carbon\Carbon::parse($request->date);
        if ($date->dayOfWeek === 0) { // 0 = Sunday
            return response()->json([
                'error' => 'Events cannot be scheduled on Sundays.'
            ], 422);
        }

        // Validate that end_date is not a Sunday if provided
        if ($request->end_date) {
            $endDate = \Carbon\Carbon::parse($request->end_date);
            if ($endDate->dayOfWeek === 0) { // 0 = Sunday
                return response()->json([
                    'error' => 'Event end date cannot be on Sundays.'
                ], 422);
            }
        }

        // Validate school year format (e.g., "2024-2025")
        if (!preg_match('/^\d{4}-\d{4}$/', $request->school_year)) {
            return response()->json([
                'error' => 'Invalid school year format. Use format: YYYY-YYYY'
            ], 422);
        }

        // Validate that the date is within the school year
        $date = \Carbon\Carbon::parse($request->date);
        list($startYear, $endYear) = explode('-', $request->school_year);
        
        // School year runs from September (start year) to August (end year)
        $schoolYearStart = \Carbon\Carbon::create($startYear, 9, 1);
        $schoolYearEnd = \Carbon\Carbon::create($endYear, 8, 31);
        
        if ($date->lt($schoolYearStart) || $date->gt($schoolYearEnd)) {
            return response()->json([
                'error' => 'Date must be within the school year (September to August)'
            ], 422);
        }

        // Validate end_date if provided
        if ($request->end_date) {
            $endDate = \Carbon\Carbon::parse($request->end_date);
            
            if ($endDate->lt($schoolYearStart) || $endDate->gt($schoolYearEnd)) {
                return response()->json([
                    'error' => 'End date must be within the school year (September to August)'
                ], 422);
            }
        }

        // Extract the month from the selected date
        $newMonth = $date->month;

        // Check if a school-year-specific version already exists
        $existingEvent = DefaultEvent::where('name', $baseEvent->name)
            ->where('month', $baseEvent->month)
            ->where('school_year', $request->school_year)
            ->first();

        if ($existingEvent) {
            // Update existing school-year-specific event
            $existingEvent->date = $request->date;
            $existingEvent->end_date = $request->end_date;
            $existingEvent->month = $newMonth; // Update month to match the selected date
            $existingEvent->save();
            $event = $existingEvent;
        } else {
            // Create a new school-year-specific copy with the new month
            $event = DefaultEvent::create([
                'name' => $baseEvent->name,
                'month' => $newMonth, // Use the month from the selected date
                'order' => $baseEvent->order,
                'date' => $request->date,
                'end_date' => $request->end_date,
                'school_year' => $request->school_year,
            ]);
        }

        return response()->json([
            'message' => 'Event date updated successfully',
            'event' => $event
        ]);
    }

    /**
     * Create an empty default event for a specific month.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function createEmptyEvent(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'month' => 'required|integer|min:1|max:12',
            'school_year' => 'required|string|regex:/^\d{4}-\d{4}$/',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $month = $request->month;
        $schoolYear = $request->school_year;
        $name = $request->name ?? 'New Event';

        // Get the highest order number for this month to place the new event at the end
        $maxOrder = DefaultEvent::where('month', $month)->max('order') ?? 0;

        // Create empty event
        $event = DefaultEvent::create([
            'name' => $name,
            'month' => $month,
            'order' => $maxOrder + 1,
            'date' => null,
            'school_year' => $schoolYear,
        ]);

        return response()->json([
            'message' => 'Empty event created successfully',
            'event' => $event
        ], 201);
    }

    /**
     * Create a default event with name and date details.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function createEventWithDetails(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'month' => 'required|integer|min:1|max:12',
            'date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:date',
            'school_year' => 'required|string|regex:/^\d{4}-\d{4}$/',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $month = $request->month;
        $schoolYear = $request->school_year;
        $name = $request->name;

        // Validate that the date is not a Sunday
        $date = \Carbon\Carbon::parse($request->date);
        if ($date->dayOfWeek === 0) { // 0 = Sunday
            return response()->json([
                'error' => 'Events cannot be scheduled on Sundays.'
            ], 422);
        }

        // Validate that end_date is not a Sunday if provided
        if ($request->end_date) {
            $endDate = \Carbon\Carbon::parse($request->end_date);
            if ($endDate->dayOfWeek === 0) {
                return response()->json([
                    'error' => 'Event end date cannot be on Sundays.'
                ], 422);
            }
        }

        // Validate that the date is within the school year
        list($startYear, $endYear) = explode('-', $schoolYear);
        
        // School year runs from September (start year) to August (end year)
        $schoolYearStart = \Carbon\Carbon::create($startYear, 9, 1);
        $schoolYearEnd = \Carbon\Carbon::create($endYear, 8, 31);
        
        if ($date->lt($schoolYearStart) || $date->gt($schoolYearEnd)) {
            return response()->json([
                'error' => 'Date must be within the school year (September to August)'
            ], 422);
        }

        // Validate end_date if provided
        if ($request->end_date) {
            $endDate = \Carbon\Carbon::parse($request->end_date);
            
            if ($endDate->lt($schoolYearStart) || $endDate->gt($schoolYearEnd)) {
                return response()->json([
                    'error' => 'End date must be within the school year (September to August)'
                ], 422);
            }
        }

        // Get the highest order number for this month to place the new event at the end
        $maxOrder = DefaultEvent::where('month', $month)->max('order') ?? 0;

        // Create event with details
        $event = DefaultEvent::create([
            'name' => $name,
            'month' => $month,
            'order' => $maxOrder + 1,
            'date' => $request->date,
            'end_date' => $request->end_date,
            'school_year' => $schoolYear,
        ]);

        return response()->json([
            'message' => 'Event created successfully',
            'event' => $event
        ], 201);
    }
}

