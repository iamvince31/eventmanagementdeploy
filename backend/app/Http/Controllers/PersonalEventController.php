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
            'date' => 'required|date',
            'time' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        // Create personal event with purple color by default
        $event = Event::create([
            'title' => $request->title,
            'description' => $request->description ?? '',
            'date' => $request->date,
            'time' => $request->time,
            'location' => 'Personal', // Default location for personal events
            'host_id' => $user->id,
            'is_open' => false,
            'is_personal' => true,
            'personal_color' => '#8b5cf6', // Purple color
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
            'date' => 'sometimes|required|date',
            'time' => 'sometimes|required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $event->update($request->only(['title', 'description', 'date', 'time']));

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
