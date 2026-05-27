<?php

namespace App\Http\Controllers;

use App\Models\DefaultEvent;
use App\Services\EventCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class DefaultEventController extends Controller
{
    /**
     * Get all default events ordered by month and order.
     * Returns base events (no school_year) and school-year-specific versions.
     * If both exist for the same event, only the school-year-specific version is returned.
     * OPTIMIZED: Uses eager loading, single query, and caching for better performance.
     *
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $schoolYear = $request->query('school_year');
            $onlyEdited = filter_var($request->query('only_edited', false), FILTER_VALIDATE_BOOLEAN);
            
            if (!$schoolYear) {
                return response()->json([
                    'error' => 'school_year parameter is required'
                ], 422);
            }

            // OPTIMIZATION: Use caching to avoid repeated database queries
            $cacheKey = EventCacheService::getDefaultEventsCacheKey($schoolYear, $onlyEdited);
            
            $allEvents = EventCacheService::remember($cacheKey, function() use ($schoolYear, $onlyEdited) {
                // OPTIMIZATION 1: Use a single query with LEFT JOIN to get base events and their dates
                $baseEventsWithDates = DB::table('default_events as de')
                    ->leftJoin('default_event_dates as ded', function($join) use ($schoolYear) {
                        $join->on('de.id', '=', 'ded.default_event_id')
                             ->where('ded.school_year', '=', $schoolYear);
                    })
                    ->whereNull('de.school_year')
                    ->select(
                        'de.id',
                        'de.name',
                        'de.month',
                        'de.order',
                        'ded.date',
                        'ded.end_date',
                        'ded.semester'
                    )
                    ->orderBy('de.month')
                    ->orderBy('de.order')
                    ->get();

                // OPTIMIZATION 2: Transform results in a single pass
                $events = $baseEventsWithDates->map(function ($event) use ($schoolYear) {
                    $hasDate = $event->date !== null;
                    return [
                        'id' => $event->id,
                        'name' => $event->name,
                        'month' => $event->month,
                        'order' => $event->order,
                        'date' => $hasDate ? \Carbon\Carbon::parse($event->date)->format('Y-m-d') : null,
                        'end_date' => $event->end_date ? \Carbon\Carbon::parse($event->end_date)->format('Y-m-d') : null,
                        'school_year' => $schoolYear,
                        'semester' => $event->semester,
                        'has_date_set' => $hasDate,
                        'is_created' => false,
                    ];
                });

                // OPTIMIZATION 3: Get created academic events with a single query
                $createdEvents = \App\Models\CreatedAcademicEvent::select([
                        'id', 'name', 'month', 'order', 'date', 'end_date', 
                        'school_year', 'semester', 'created_by'
                    ])
                    ->where('school_year', $schoolYear)
                    ->orderBy('order')
                    ->get()
                    ->map(function ($event) {
                        $hasDate = $event->date !== null;
                        return [
                            'id' => 'created_' . $event->id,
                            'actual_id' => $event->id,
                            'name' => $event->name,
                            'month' => $event->month,
                            'order' => $event->order,
                            'date' => $hasDate ? $event->date->format('Y-m-d') : null,
                            'end_date' => $event->end_date ? $event->end_date->format('Y-m-d') : null,
                            'school_year' => $event->school_year,
                            'semester' => $event->semester,
                            'has_date_set' => $hasDate,
                            'is_created' => true,
                            'created_by' => $event->created_by,
                        ];
                    });

                // OPTIMIZATION 4: Filter before merging if only_edited=true
                if ($onlyEdited) {
                    $events = $events->filter(fn($e) => $e['has_date_set']);
                    $createdEvents = $createdEvents->filter(fn($e) => $e['has_date_set']);
                }

                // OPTIMIZATION 5: Merge and sort efficiently
                return $events->concat($createdEvents)
                    ->sortBy([['month', 'asc'], ['order', 'asc']])
                    ->values()
                    ->all();
            });

            return response()->json([
                'events' => $allEvents,
                'school_year' => $schoolYear,
                'only_edited' => $onlyEdited
            ]);
            
        } catch (\Exception $e) {
            Log::error('DefaultEventController index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'school_year' => $request->query('school_year'),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ]);
            
            return response()->json([
                'error' => 'Failed to fetch default events',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error',
                'events' => [],
                'school_year' => $request->query('school_year'),
                'only_edited' => false
            ], 500);
        }
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

        // Clear cache for this school year
        EventCacheService::clearDefaultEventsCache($request->school_year);

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

        // Clear cache for this school year
        EventCacheService::clearDefaultEventsCache($schoolYear);

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

