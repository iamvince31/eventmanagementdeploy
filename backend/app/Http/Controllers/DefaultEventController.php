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
            // Order by school_year DESC NULLS LAST to process school-year-specific events first
            $allEvents = DefaultEvent::where(function($q) use ($schoolYear) {
                $q->where('school_year', $schoolYear)
                  ->orWhereNull('school_year');
            })
            ->orderByRaw('CASE WHEN school_year IS NULL THEN 1 ELSE 0 END')
            ->orderBy('month')
            ->orderBy('order')
            ->get(['id', 'name', 'month', 'order', 'date', 'school_year']);

            // Filter to show only school-year-specific versions when they exist
            // Process in order: school-year-specific first, then base events
            $eventsByKey = [];
            foreach ($allEvents as $event) {
                $key = $event->name . '_' . $event->month;
                
                // Only add if we haven't seen this event yet
                // Since school-year-specific events come first, they take priority
                if (!isset($eventsByKey[$key])) {
                    $eventsByKey[$key] = $event;
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
                ->get(['id', 'name', 'month', 'order', 'date', 'school_year']);
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

        // Check if a school-year-specific version already exists
        $existingEvent = DefaultEvent::where('name', $baseEvent->name)
            ->where('month', $baseEvent->month)
            ->where('school_year', $request->school_year)
            ->first();

        if ($existingEvent) {
            // Update existing school-year-specific event
            $existingEvent->date = $request->date;
            $existingEvent->save();
            $event = $existingEvent;
        } else {
            // Create a new school-year-specific copy
            $event = DefaultEvent::create([
                'name' => $baseEvent->name,
                'month' => $baseEvent->month,
                'order' => $baseEvent->order,
                'date' => $request->date,
                'school_year' => $request->school_year,
            ]);
        }

        return response()->json([
            'message' => 'Event date updated successfully',
            'event' => $event
        ]);
    }
}
