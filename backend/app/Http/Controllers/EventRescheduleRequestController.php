<?php

namespace App\Http\Controllers;

use App\Models\EventRescheduleRequest;
use App\Models\Event;
use Illuminate\Http\Request;

class EventRescheduleRequestController extends Controller
{
    public function index($eventId)
    {
        $requests = EventRescheduleRequest::where('event_id', $eventId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['requests' => $requests]);
    }

    public function store(Request $request, $eventId)
    {
        $validated = $request->validate([
            'suggested_date' => 'required|date',
            'suggested_time' => 'required',
            'reason' => 'nullable|string',
        ]);

        $rescheduleRequest = EventRescheduleRequest::create([
            'event_id' => $eventId,
            'user_id' => auth()->id(),
            'suggested_date' => $validated['suggested_date'],
            'suggested_time' => $validated['suggested_time'],
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        // Auto-accept logic
        $event = Event::find($eventId);
        if ($event->auto_accept_reschedule) {
            $rescheduleRequest->update(['status' => 'accepted']);
            $event->update([
                'date' => $validated['suggested_date'],
                'time' => $validated['suggested_time'],
            ]);
            return response()->json(['message' => 'Reschedule request auto-accepted', 'request' => $rescheduleRequest], 201);
        }

        return response()->json(['message' => 'Reschedule request sent', 'request' => $rescheduleRequest], 201);
    }

    public function respond(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:accepted,declined',
        ]);

        $rescheduleRequest = EventRescheduleRequest::findOrFail($id);
        $event = $rescheduleRequest->event;

        // Verify host
        if ($event->host_id != auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $rescheduleRequest->update(['status' => $validated['status']]);

        if ($validated['status'] === 'accepted') {
            $event->update([
                'date' => $rescheduleRequest->suggested_date,
                'time' => $rescheduleRequest->suggested_time,
            ]);
            
            // Reject other pending requests? Optional but good practice.
            // keeping it simple for now.
        }

        return response()->json(['message' => 'Request ' . $validated['status']]);
    }
}
