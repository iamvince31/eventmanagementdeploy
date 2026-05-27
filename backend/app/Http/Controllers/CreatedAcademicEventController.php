<?php

namespace App\Http\Controllers;

use App\Models\CreatedAcademicEvent;
use App\Services\EventCacheService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class CreatedAcademicEventController extends Controller
{
    /**
     * Get all created academic events for a specific school year and semester.
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'school_year' => 'required|string',
            'semester' => 'nullable|integer|in:1,2,3',
            'month' => 'nullable|integer|min:1|max:12',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $query = CreatedAcademicEvent::forSchoolYear($request->school_year);

        if ($request->has('semester')) {
            $query->forSemester($request->semester);
        }

        if ($request->has('month')) {
            $query->forMonth($request->month);
        }

        $events = $query->ordered()->get();

        return response()->json([
            'events' => $events
        ]);
    }

    /**
     * Create a new academic event for a specific school year and semester.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'month' => 'required|integer|min:1|max:12',
            'school_year' => 'required|string',
            'date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        // Determine semester from month
        $semester = CreatedAcademicEvent::getSemesterFromMonth($request->month);

        // Get the highest order number for this month/semester/school_year
        $maxOrder = CreatedAcademicEvent::forSchoolYear($request->school_year)
            ->forSemester($semester)
            ->forMonth($request->month)
            ->max('order') ?? 0;

        // Check if event with same name already exists
        $existingEvent = CreatedAcademicEvent::forSchoolYear($request->school_year)
            ->forSemester($semester)
            ->forMonth($request->month)
            ->where('name', $request->name)
            ->first();

        if ($existingEvent) {
            return response()->json([
                'error' => 'An event with this name already exists in this month for the selected school year and semester.'
            ], 422);
        }

        $event = CreatedAcademicEvent::create([
            'name' => $request->name,
            'month' => $request->month,
            'semester' => $semester,
            'school_year' => $request->school_year,
            'date' => $request->date,
            'end_date' => $request->end_date,
            'created_by' => $request->user()->id,
            'order' => $maxOrder + 1,
        ]);

        // Clear cache for this school year
        EventCacheService::clearDefaultEventsCache($request->school_year);

        return response()->json([
            'message' => 'Academic event created successfully',
            'event' => $event
        ], 201);
    }

    /**
     * Update an existing created academic event.
     */
    public function update(Request $request, CreatedAcademicEvent $event): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        // Check if name is being changed and if it conflicts
        if ($request->has('name') && $request->name !== $event->name) {
            $existingEvent = CreatedAcademicEvent::forSchoolYear($event->school_year)
                ->forSemester($event->semester)
                ->forMonth($event->month)
                ->where('name', $request->name)
                ->where('id', '!=', $event->id)
                ->first();

            if ($existingEvent) {
                return response()->json([
                    'error' => 'An event with this name already exists in this month for the selected school year and semester.'
                ], 422);
            }
        }

        $event->update($request->only(['name', 'date', 'end_date']));

        // Clear cache for this school year
        EventCacheService::clearDefaultEventsCache($event->school_year);

        return response()->json([
            'message' => 'Academic event updated successfully',
            'event' => $event
        ]);
    }

    /**
     * Delete a created academic event.
     */
    public function destroy(CreatedAcademicEvent $event): JsonResponse
    {
        $schoolYear = $event->school_year;
        $event->delete();

        // Clear cache for this school year
        EventCacheService::clearDefaultEventsCache($schoolYear);

        return response()->json([
            'message' => 'Academic event deleted successfully'
        ]);
    }

    /**
     * Update the date for a created academic event.
     */
    public function updateDate(Request $request, CreatedAcademicEvent $event): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $event->update([
            'date' => $request->date,
            'end_date' => $request->end_date,
        ]);

        // Clear cache for this school year
        EventCacheService::clearDefaultEventsCache($event->school_year);

        return response()->json([
            'message' => 'Event date updated successfully',
            'event' => $event
        ]);
    }
}
