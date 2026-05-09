<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class PersonalEventController extends Controller
{
    /**
     * Store da new personal event
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required',
            'end_time' => 'nullable|date_format:H:i',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Additional validation: check if datetime is not in the past
        $selectedDateTime = \Carbon\Carbon::createFromFormat('Y-m-d H:i', $request->date . ' ' . $request->time);
        if ($selectedDateTime->isPast()) {
            return response()->json([
                'error' => 'Cannot set event date/time in the past'
            ], 422);
        }

        // Validate end time is after start time if provided
        if ($request->end_time) {
            $startTime = \Carbon\Carbon::createFromFormat('H:i', $request->time);
            $endTime = \Carbon\Carbon::createFromFormat('H:i', $request->end_time);
            if ($endTime->lte($startTime)) {
                return response()->json([
                    'error' => 'End time must be after start time'
                ], 422);
            }
        }

        $user = Auth::user();

        // Create personal event with purple color by default
        $event = Event::create([
            'title' => $request->title,
            'description' => $request->description ?? '',
            'date' => $request->date,
            'time' => $request->time,
            'end_time' => $request->end_time ?: null,
            'location' => 'Personal',
            'host_id' => $user->id,
            'is_open' => false,
            'is_personal' => true,
            'personal_color' => '#8b5cf6',
        ]);

        return response()->json([
            'message' => 'Personal event created successfully',
            'event' => $event->load('host')
        ], 201);
    }

    /**
     * Update a personal event
     */
    public function update(Request $request, Event $event)
    {
        $user = Auth::user();

        // Check if event is personal and belongs to user
        if (!$event->is_personal || $event->host_id !== $user->id) {
            return response()->json([
                'error' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'sometimes|required|date|after_or_equal:today',
            'time' => 'sometimes|required',
            'end_time' => 'nullable|date_format:H:i',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Additional validation: check if datetime is not in the past (only if date/time are being updated)
        if ($request->has('date') && $request->has('time')) {
            $selectedDateTime = \Carbon\Carbon::createFromFormat('Y-m-d H:i', $request->date . ' ' . $request->time);
            if ($selectedDateTime->isPast()) {
                return response()->json([
                    'error' => 'Cannot set event date/time in the past'
                ], 422);
            }
        }

        // Validate end time is after start time if both are provided
        $timeToCheck = $request->time ?? $event->time;
        $endTimeToCheck = $request->end_time;
        if ($timeToCheck && $endTimeToCheck) {
            $startTime = \Carbon\Carbon::createFromFormat('H:i', $timeToCheck);
            $endTime = \Carbon\Carbon::createFromFormat('H:i', $endTimeToCheck);
            if ($endTime->lte($startTime)) {
                return response()->json([
                    'error' => 'End time must be after start time'
                ], 422);
            }
        }

        $event->update($request->only(['title', 'description', 'date', 'time', 'end_time']));

        return response()->json([
            'message' => 'Personal event updated successfully',
            'event' => $event->load('host')
        ]);
    }

    /**
     * Delete a personal event
     */
    public function destroy(Event $event)
    {
        $user = Auth::user();

        // Check if event is personal and belongs to user
        if (!$event->is_personal || $event->host_id !== $user->id) {
            return response()->json([
                'error' => 'Unauthorized'
            ], 403);
        }

        $event->delete();

        return response()->json([
            'message' => 'Personal event deleted successfully'
        ]);
    }
}
