<?php

namespace App\Http\Controllers;

use App\Models\DefaultEvent;
use App\Models\DefaultEventDate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class DefaultEventControllerV2 extends Controller
{
    /**
     * Get all default events with their dates for a specific school year.
     * This version uses the default_event_dates table for cleaner separation.
     *
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $schoolYear = $request->query('school_year');
        
        if (!$schoolYear) {
            return response()->json([
                'error' => 'school_year parameter is required'
            ], 422);
        }

        // Get all base default events (without school_year filter)
        $baseEvents = DefaultEvent::whereNull('school_year')
            ->orderBy('month')
            ->orderBy('order')
            ->get();

        // Get all date assignments for this school year
        $eventDates = DefaultEventDate::forSchoolYear($schoolYear)
            ->with('defaultEvent')
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
                'semester_name' => $dateAssignment?->semester_name,
                'has_date_set' => $dateAssignment !== null,
                'date_id' => $dateAssignment?->id,
            ];
        });

        return response()->json([
            'events' => $events
        ]);
    }

    /**
     * Set or update the date for a default event for a specific school year.
     *
     * @param Request $request
     * @param int $id Default event ID
     * @return JsonResponse
     */
    public function setDate(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
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

        $baseEvent = DefaultEvent::whereNull('school_year')->find($id);

        if (!$baseEvent) {
            return response()->json([
                'error' => 'Base event not found'
            ], 404);
        }

        // Parse the date from request
        $date = \Carbon\Carbon::parse($request->date);
        $month = $date->month;
        
        // Determine semester from month
        $semester = DefaultEventDate::getSemesterFromMonth($month);

        // Validate that the date is within the school year
        list($startYear, $endYear) = explode('-', $request->school_year);
        $schoolYearStart = \Carbon\Carbon::create($startYear, 9, 1);
        $schoolYearEnd = \Carbon\Carbon::create($endYear, 8, 31);
        
        if ($date->lt($schoolYearStart) || $date->gt($schoolYearEnd)) {
            return response()->json([
                'error' => 'Date must be within the school year (September to August)'
            ], 422);
        }

        if ($request->end_date) {
            $endDate = \Carbon\Carbon::parse($request->end_date);
            if ($endDate->lt($schoolYearStart) || $endDate->gt($schoolYearEnd)) {
                return response()->json([
                    'error' => 'End date must be within the school year (September to August)'
                ], 422);
            }
        }

        // Create or update the date assignment
        $eventDate = DefaultEventDate::updateOrCreate(
            [
                'default_event_id' => $id,
                'school_year' => $request->school_year,
            ],
            [
                'date' => $request->date,
                'end_date' => $request->end_date,
<<<<<<< HEAD
                'month' => $month,
                'semester' => $semester,
=======
                'month' => $date->month,
>>>>>>> 1369ecc084243a8b0b992cae321ce869b016898d
                'created_by' => $request->user()?->id,
            ]
        );

        return response()->json([
            'message' => 'Event date set successfully',
            'event_date' => $eventDate->load('defaultEvent')
        ]);
    }

    /**
     * Remove the date assignment for a default event for a specific school year.
     *
     * @param Request $request
     * @param int $id Default event ID
     * @return JsonResponse
     */
    public function removeDate(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'school_year' => 'required|string|regex:/^\d{4}-\d{4}$/',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $deleted = DefaultEventDate::where('default_event_id', $id)
            ->where('school_year', $request->school_year)
            ->delete();

        if ($deleted === 0) {
            return response()->json([
                'error' => 'No date assignment found for this event and school year'
            ], 404);
        }

        return response()->json([
            'message' => 'Event date removed successfully'
        ]);
    }

    /**
     * Get all events with dates set for a specific school year.
     * Useful for generating calendars or reports.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getScheduledEvents(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'school_year' => 'required|string|regex:/^\d{4}-\d{4}$/',
            'month' => 'nullable|integer|min:1|max:12',
<<<<<<< HEAD
            'semester' => 'nullable|integer|min:1|max:3',
=======
>>>>>>> 1369ecc084243a8b0b992cae321ce869b016898d
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $query = DefaultEventDate::with('defaultEvent')
            ->forSchoolYear($request->school_year);

        if ($request->has('month')) {
            $query->forMonth($request->month);
        }

<<<<<<< HEAD
        if ($request->has('semester')) {
            $query->forSemester($request->semester);
        }

=======
>>>>>>> 1369ecc084243a8b0b992cae321ce869b016898d
        $eventDates = $query->orderedByDate()->get();

        $events = $eventDates->map(function ($eventDate) {
            return [
                'id' => $eventDate->id,
                'event_id' => $eventDate->default_event_id,
                'name' => $eventDate->defaultEvent->name,
                'date' => $eventDate->date->format('Y-m-d'),
                'end_date' => $eventDate->end_date?->format('Y-m-d'),
                'month' => $eventDate->month,
<<<<<<< HEAD
                'semester' => $eventDate->semester,
                'semester_name' => $eventDate->semester_name,
=======
>>>>>>> 1369ecc084243a8b0b992cae321ce869b016898d
                'school_year' => $eventDate->school_year,
                'created_at' => $eventDate->created_at->format('Y-m-d H:i:s'),
            ];
        });

        return response()->json([
            'events' => $events,
            'count' => $events->count()
        ]);
    }

    /**
     * Get statistics about date assignments for a school year.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getStatistics(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'school_year' => 'required|string|regex:/^\d{4}-\d{4}$/',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $schoolYear = $request->school_year;

        $totalBaseEvents = DefaultEvent::whereNull('school_year')->count();
        $eventsWithDates = DefaultEventDate::forSchoolYear($schoolYear)->count();
        $eventsWithoutDates = $totalBaseEvents - $eventsWithDates;

        $eventsByMonth = DefaultEventDate::forSchoolYear($schoolYear)
            ->select('month', DB::raw('count(*) as count'))
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->pluck('count', 'month');

<<<<<<< HEAD
        $eventsBySemester = DefaultEventDate::forSchoolYear($schoolYear)
            ->select('semester', DB::raw('count(*) as count'))
            ->groupBy('semester')
            ->orderBy('semester')
            ->get()
            ->mapWithKeys(function ($item) {
                $semesterName = match($item->semester) {
                    1 => 'First Semester',
                    2 => 'Second Semester',
                    3 => 'Mid-Year',
                    default => 'Unknown',
                };
                return [$semesterName => $item->count];
            });

=======
>>>>>>> 1369ecc084243a8b0b992cae321ce869b016898d
        return response()->json([
            'school_year' => $schoolYear,
            'total_base_events' => $totalBaseEvents,
            'events_with_dates' => $eventsWithDates,
            'events_without_dates' => $eventsWithoutDates,
            'completion_percentage' => $totalBaseEvents > 0 
                ? round(($eventsWithDates / $totalBaseEvents) * 100, 2) 
                : 0,
            'events_by_month' => $eventsByMonth,
<<<<<<< HEAD
            'events_by_semester' => $eventsBySemester,
=======
>>>>>>> 1369ecc084243a8b0b992cae321ce869b016898d
        ]);
    }
}
