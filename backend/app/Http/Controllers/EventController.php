<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $events = Event::with(['host', 'members', 'images'])
            ->where(function ($query) use ($user) {
                // User is the host
                $query->where('host_id', $user->id)
                    // Or user is a member/invited
                    ->orWhereHas('members', function ($q) use ($user) {
                        $q->where('users.id', $user->id);
                    });
            })
            ->orderBy('date')
            ->orderBy('time')
            ->get();

        return response()->json([
            'events' => $events->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'description' => $event->description,
                    'location' => $event->location,
                    'images' => $event->images->map(fn($img) => asset('storage/' . $img->image_path)),
                    'date' => $event->date,
                    'time' => $event->time,
                    'has_pending_reschedule_requests' => $event->rescheduleRequests()->where('status', 'pending')->exists(),
                    'host' => [
                        'id' => $event->host->id,
                        'username' => $event->host->name,
                        'email' => $event->host->email,
                    ],
                    'members' => $event->members->map(fn($m) => [
                        'id' => $m->id,
                        'username' => $m->name,
                        'email' => $m->email,
                        'status' => $m->pivot->status,
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
            'location' => 'required|string|max:255',
            'images' => 'nullable|array|max:5',
            'images.*' => 'file|mimes:jpeg,jpg,png,gif,webp,pdf|max:5120',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required',
            'member_ids' => 'nullable|array',
        ], [
            'images.max' => 'You can upload a maximum of 5 files.',
            'images.*.file' => 'Each upload must be a valid file.',
            'images.*.mimes' => 'Files must be in JPG, PNG, GIF, WebP, or PDF format.',
            'images.*.max' => 'Each file must not exceed 5MB in size.',
            'date.after_or_equal' => 'Event date cannot be in the past.',
        ]);

        // Validate that date/time is not in the past
        $eventDateTime = new \DateTime($request->date . ' ' . $request->time);
        $now = new \DateTime();
        
        if ($eventDateTime < $now) {
            return response()->json([
                'error' => 'Event date and time cannot be in the past.'
            ], 422);
        }

        $event = Event::create([
            'title' => $request->title,
            'description' => $request->description,
            'location' => $request->location,
            'date' => $request->date,
            'time' => $request->time,
            'host_id' => $request->user()->id,
        ]);

        // Handle multiple images/files
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $image) {
                // Additional MIME type validation
                $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
                if (!in_array($image->getMimeType(), $allowedMimes)) {
                    return response()->json([
                        'error' => 'Invalid file type. Only JPG, PNG, GIF, WebP, and PDF files are allowed.'
                    ], 400);
                }
                
                // Check file size (5MB)
                if ($image->getSize() > 5120 * 1024) {
                    return response()->json([
                        'error' => 'File size must not exceed 5MB.'
                    ], 400);
                }
                
                $imagePath = $image->store('events', 'public');
                $event->images()->create([
                    'image_path' => $imagePath,
                    'order' => $index,
                ]);
            }
        }

        if ($request->member_ids) {
            // Filter out the host's ID to prevent self-invitation
            $memberIds = collect($request->member_ids)
                ->filter(fn($id) => $id != $request->user()->id)
                ->unique()
                ->values();
            
            if ($memberIds->isNotEmpty()) {
                $memberData = $memberIds->mapWithKeys(fn($id) => [$id => ['status' => 'pending']])->all();
                $event->members()->attach($memberData);
            }
        }

        $event->load(['host', 'members', 'images']);

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
            'location' => 'sometimes|required|string|max:255',
            'images' => 'nullable|array|max:5',
            'images.*' => 'file|mimes:jpeg,jpg,png,gif,webp,pdf|max:5120',
            'date' => 'sometimes|required|date|after_or_equal:today',
            'time' => 'sometimes|required',
            'member_ids' => 'nullable|array',
        ], [
            'images.max' => 'You can upload a maximum of 5 files.',
            'images.*.file' => 'Each upload must be a valid file.',
            'images.*.mimes' => 'Files must be in JPG, PNG, GIF, WebP, or PDF format.',
            'images.*.max' => 'Each file must not exceed 5MB in size.',
            'date.after_or_equal' => 'Event date cannot be in the past.',
        ]);

        // Validate that date/time is not in the past if being updated
        if ($request->has('date') && $request->has('time')) {
            $eventDateTime = new \DateTime($request->date . ' ' . $request->time);
            $now = new \DateTime();
            
            if ($eventDateTime < $now) {
                return response()->json([
                    'error' => 'Event date and time cannot be in the past.'
                ], 422);
            }
        }

        $event->update($request->only(['title', 'description', 'location', 'date', 'time']));

        // Handle new images/files
        if ($request->hasFile('images')) {
            // Validate MIME types
            foreach ($request->file('images') as $image) {
                $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
                if (!in_array($image->getMimeType(), $allowedMimes)) {
                    return response()->json([
                        'error' => 'Invalid file type. Only JPG, PNG, GIF, WebP, and PDF files are allowed.'
                    ], 400);
                }
                
                if ($image->getSize() > 5120 * 1024) {
                    return response()->json([
                        'error' => 'File size must not exceed 5MB.'
                    ], 400);
                }
            }
            
            // Delete old images
            foreach ($event->images as $oldImage) {
                \Storage::disk('public')->delete($oldImage->image_path);
                $oldImage->delete();
            }

            // Add new images
            foreach ($request->file('images') as $index => $image) {
                $imagePath = $image->store('events', 'public');
                $event->images()->create([
                    'image_path' => $imagePath,
                    'order' => $index,
                ]);
            }
        }

        if ($request->has('member_ids')) {
            // Filter out the host's ID to prevent self-invitation
            $memberIds = collect($request->member_ids)
                ->filter(fn($id) => $id != $request->user()->id)
                ->unique()
                ->values();
            
            // Keep existing statuses for members that remain, set 'pending' for new ones
            $existingMembers = $event->members()->pluck('status', 'users.id')->all();
            $syncData = $memberIds->mapWithKeys(function ($id) use ($existingMembers) {
                return [$id => ['status' => $existingMembers[$id] ?? 'pending']];
            })->all();
            $event->members()->sync($syncData);
        }

        return response()->json(['message' => 'Event updated successfully', 'event' => $event->load(['host', 'members', 'images'])]);
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

    public function respondToInvitation(Request $request, Event $event)
    {
        $user = $request->user();

        // Host cannot respond to their own event
        if ($event->host_id === $user->id) {
            return response()->json(['error' => 'Host cannot respond to their own event'], 403);
        }

        // Check if user is an invited member
        if (!$event->members()->where('users.id', $user->id)->exists()) {
            return response()->json(['error' => 'You are not invited to this event'], 403);
        }

        $request->validate([
            'status' => 'required|in:accepted,declined',
        ]);

        $event->members()->updateExistingPivot($user->id, [
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => 'Invitation ' . $request->status . ' successfully',
            'status' => $request->status,
        ]);
    }
}
