<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index()
    {
        $events = Event::with(['host', 'members'])->orderBy('date')->orderBy('time')->get();

        return response()->json([
            'events' => $events->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'description' => $event->description,
                    'department' => $event->department,
                    'date' => $event->date,
                    'time' => $event->time,
                    'is_open' => $event->is_open,
                    'host' => [
                        'id' => $event->host->id,
                        'username' => $event->host->name,
                        'email' => $event->host->email,
                    ],
                    'members' => $event->members->map(fn($m) => [
                        'id' => $m->id,
                        'username' => $m->name,
                        'email' => $m->email,
                    ]),
                ];
            }),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'department' => 'nullable|string',
            'date' => 'required|date',
            'time' => 'required',
            'member_ids' => 'nullable|array',
            'is_open' => 'boolean',
        ]);

        $event = Event::create([
            'title' => $request->title,
            'description' => $request->description,
            'department' => $request->department,
            'date' => $request->date,
            'time' => $request->time,
            'is_open' => $request->is_open ?? false,
            'host_id' => $request->user()->id,
        ]);

        if ($request->member_ids) {
            $event->members()->attach($request->member_ids);
        }

        $event->load(['host', 'members']);

        return response()->json([
            'message' => 'Event created successfully',
            'event' => $event,
        ], 201);
    }

    public function update(Request $request, Event $event)
    {
        if ($event->host_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'department' => 'nullable|string',
            'date' => 'sometimes|required|date',
            'time' => 'sometimes|required',
            'member_ids' => 'nullable|array',
            'is_open' => 'boolean',
        ]);

        $event->update($request->only(['title', 'description', 'department', 'date', 'time', 'is_open']));

        if ($request->has('member_ids')) {
            $event->members()->sync($request->member_ids);
        }

        return response()->json(['message' => 'Event updated successfully', 'event' => $event->load(['host', 'members'])]);
    }

    public function destroy(Request $request, Event $event)
    {
        if ($event->host_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $event->delete();
        return response()->json(['message' => 'Event deleted successfully']);
    }

    public function availability(Event $event, User $user)
    {
        return response()->json(['available' => true]);
    }
}
