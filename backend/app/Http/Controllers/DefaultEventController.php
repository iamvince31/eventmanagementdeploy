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
        $onlyEdited = filter_var($request->query('only_edited', false), FILTER_VALIDATE_BOOLEAN);
        
        if (!$schoolYear) {
            return response()->json([
                'error' => 'school_year parameter is required'
            ], 422);
        }

        // Get all base default events (templates without school_year)
        $baseEvents = DefaultEvent::whereNull('school_year')
            ->orderBy('month')
            ->orderBy('order')
            ->get();

        // Get all date assignments for this school year from default_event_dates table
        $eventDates = \App\Models\DefaultEventDate::where('school_year', $schoolYear)
            ->get()
            ->keyBy('default_event_id');

        // Merge base events with their assigned dates
        $events = $baseEvents->map(function ($event) use ($eventDates, $schoolYear) {
            $dateAssignment = $eventDates->get($event->id);
            
            return [
                'id' => $event->id,
                'name' => $event->name,
                'month' => $event->month,
                'order' => $event->order,
                'date' => $dateAssignment?->date?->format('Y-m-d'),
                'end_date' => $dateAssignment?->end_date?->format('Y-m-d'),
                'school_year' => $schoolYear,
                'semester' => $dateAssignment?->semester,
                'has_date_set' => $dateAssignment !== null,
                'is_created' => false, // This is a default/base event
            ];
        });

        // Get created academic events for this school year
        $createdEvents = \App\Models\CreatedAcademicEvent::forSchoolYear($schoolYear)
            ->ordered()
            ->get()
            ->map(function ($event) {
                return [
                    'id' => 'created_' . $event->id, // Prefix to distinguish from default events
                    'actual_id' => $event->id, // Store the real ID for operations
                    'name' => $event->name,
                    'month' => $event->month,
                    'order' => $event->order,
                    'date' => $event->date?->format('Y-m-d'),
                    'end_date' => $event->end_date?->format('Y-m-d'),
                    'school_year' => $event->school_year,
                    'semester' => $event->semester,
                    'has_date_set' => $event->date !== null,
                    'is_created' => true, // This is a user-created event
                    'created_by' => $event->created_by,
                ];
            });

        // Merge both collections and sort by month and order
        $allEvents = $events->concat($createdEvents)->sortBy([
            ['month', 'asc'],
            ['order', 'asc'],
        ])->values();

        // Filter to only show events with dates if only_edited=true
        if ($onlyEdited) {
            $allEvents = $allEvents->filter(function ($event) {
                return $event['has_date_set'] === true;
            })->values();
        }

        return response()->json([
            'events' => $allEvents,
            'school_year' => $schoolYear,
            'only_edited' => $onlyEdited
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

        // Find the base event template (should have school_year = NULL)
        $baseEvent = DefaultEvent::whereNull('school_year')->find($id);

        if (!$baseEvent) {
            return response()->json([
                'error' => 'Base event template not found'
            ], 404);
        }

        // Sunday validation - default events cannot be scheduled on Sundays
        $eventDate = \Carbon\Carbon::parse($request->date);
        if ($eventDate->dayOfWeek === 0) { // 0 = Sunday
            return response()->json([
                'error' => 'Default events cannot be scheduled on Sundays.'
            ], 422);
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
            
            // Sunday validation - end dates cannot be on Sundays
            if ($endDate->dayOfWeek === 0) { // 0 = Sunday
                return response()->json([
                    'error' => 'Default event end dates cannot be on Sundays.'
                ], 422);
            }
            
            if ($endDate->lt($schoolYearStart) || $endDate->gt($schoolYearEnd)) {
                return response()->json([
                    'error' => 'End date must be within the school year (September to August)'
                ], 422);
            }
        }

        // Extract the month from the selected date
        $month = $date->month;
        
        // Determine semester from month
        $semester = \App\Models\DefaultEventDate::getSemesterFromMonth($month);

        // Create or update in default_event_dates table (NOT default_events)
        $eventDate = \App\Models\DefaultEventDate::updateOrCreate(
            [
                'default_event_id' => $id,
                'school_year' => $request->school_year,
            ],
            [
                'date' => $request->date,
                'end_date' => $request->end_date,
                'month' => $month,
                'semester' => $semester,
                'created_by' => $request->user()?->id,
            ]
        );

        return response()->json([
            'message' => 'Event date set successfully',
            'event' => [
                'id' => $baseEvent->id,
                'name' => $baseEvent->name,
                'date' => $eventDate->date->format('Y-m-d'),
                'end_date' => $eventDate->end_date?->format('Y-m-d'),
                'school_year' => $eventDate->school_year,
                'semester' => $eventDate->semester,
                'month' => $eventDate->month,
            ]
        ]);
    }

    /**
     * Remove the date assignment for a default event (reset to "no date set").
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function removeDate(Request $request, $id): JsonResponse
    {
        $schoolYear = $request->query('school_year');

        if (!$schoolYear) {
            return response()->json(['error' => 'school_year parameter is required'], 422);
        }

        $deleted = \App\Models\DefaultEventDate::where('default_event_id', $id)
            ->where('school_year', $schoolYear)
            ->delete();

        return response()->json([
            'message' => $deleted ? 'Date removed successfully' : 'No date assignment found',
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

        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $month = $request->month;
        $month = $request->month;
        $name = $request->name ?? 'New Event';

        // Get the highest order number for this month to place the new event at the end
        $maxOrder = DefaultEvent::whereNull('school_year')
            ->where('month', $month)
            ->max('order') ?? 0;

        // Create empty event TEMPLATE (no school_year, no date)
        $event = DefaultEvent::create([
            'name' => $name,
            'month' => $month,
            'order' => $maxOrder + 1,
            'date' => null,
            'end_date' => null,
            'school_year' => null, // Template, not a created event
        ]);

        return response()->json([
            'message' => 'Event template created successfully',
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
        $date = \Carbon\Carbon::parse($request->date);


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

        // Get the highest order number for this month
        $maxOrder = DefaultEvent::whereNull('school_year')
            ->where('month', $month)
            ->max('order') ?? 0;

        // Step 1: Create event TEMPLATE (no dates, no school_year)
        $template = DefaultEvent::create([
            'name' => $name,
            'month' => $month,
            'order' => $maxOrder + 1,
            'date' => null,
            'end_date' => null,
            'school_year' => null,
        ]);

        // Step 2: Create date assignment in default_event_dates table
        $semester = \App\Models\DefaultEventDate::getSemesterFromMonth($date->month);
        
        $eventDate = \App\Models\DefaultEventDate::create([
            'default_event_id' => $template->id,
            'school_year' => $schoolYear,
            'semester' => $semester,
            'date' => $request->date,
            'end_date' => $request->end_date,
            'month' => $date->month,
            'created_by' => $request->user()?->id,
        ]);

        return response()->json([
            'message' => 'Event created successfully',
            'event' => [
                'id' => $template->id,
                'name' => $template->name,
                'month' => $template->month,
                'order' => $template->order,
                'date' => $eventDate->date->format('Y-m-d'),
                'end_date' => $eventDate->end_date?->format('Y-m-d'),
                'school_year' => $eventDate->school_year,
                'semester' => $eventDate->semester,
            ]
        ], 201);
    }
}

