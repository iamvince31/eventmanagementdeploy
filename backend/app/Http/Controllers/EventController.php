<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Optimized query with proper eager loading and subquery for pending reschedule requests
        $events = Event::with([
            'host:id,name,email',
            'members:id,name,email',
            'images:id,event_id,image_path,original_filename,order,cloudinary_url'
        ])
            ->where(function ($query) use ($user) {
                // User is the host
                $query->where('host_id', $user->id)
                    // Or user is a member/invited
                    ->orWhereHas(
                        'members',
                        function ($q) use ($user) {
                        $q->where('users.id', $user->id);
                    }
                    );
            })
            // Exclude personal events from other users
            ->where(function ($query) use ($user) {
                $query->where('is_personal', false)
                    ->orWhere(
                        function ($q) use ($user) {
                            $q->where('is_personal', true)
                                ->where('host_id', $user->id);
                        }
                    );
            })
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->limit(100)
            ->get();

        // Transform regular events
        $transformedEvents = $events->map(function ($event) {
            return [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'location' => $event->location,
                'event_type' => $event->event_type ?? 'event',
                'images' => $event->images->map(fn($img) => [
                    'url' => $img->cloudinary_url ?? asset('storage/' . $img->image_path),
                    'original_filename' => $img->original_filename,
                ]),
                'date' => $event->date,
                'time' => $event->time,
                'end_time' => $event->end_time,
                'school_year' => $event->school_year,
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
                'is_default_event' => false,
                'is_personal' => $event->is_personal ?? false,
                'personal_color' => $event->personal_color,
                'is_urgent' => $event->is_urgent ?? false,
            ];
        });

        return response()->json([
            'events' => $transformedEvents,
        ]);
    }

    /**
     * Get user's meeting approval requests (for Faculty/Staff)
     * OR get approval requests for Dean/Chairperson to review
     */

    public function getAllEvents(Request $request)
    {
        $user = $request->user();
        if (!$user->isAdmin() && !$user->isDean()) {
            return response()->json(['error' => 'Unauthorized. Admin or Dean access required.'], 403);
        }

        // Admin/Dean comprehensive query — exclude archived events
        $events = Event::with([
            'host:id,name,email',
            'members:id,name,email',
            'images:id,event_id,image_path,original_filename,order,cloudinary_url'
        ])
            ->where('is_archived', false)
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->get();

        // Transform regular events
        $transformedEvents = $events->map(function ($event) {
            return [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'location' => $event->location,
                'event_type' => $event->event_type ?? 'event',
                'images' => $event->images->map(fn($img) => [
                    'url' => $img->cloudinary_url ?? asset('storage/' . $img->image_path),
                    'original_filename' => $img->original_filename,
                ]),
                'date' => $event->date,
                'time' => $event->time,
                'end_time' => $event->end_time,
                'school_year' => $event->school_year,
                'host' => [
                    'id' => $event->host->id ?? null,
                    'username' => $event->host->name ?? 'Unknown',
                    'email' => $event->host->email ?? 'Unknown',
                ],
                'members' => $event->members->map(fn($m) => [
                    'id' => $m->id,
                    'username' => $m->name,
                    'email' => $m->email,
                    'status' => $m->pivot->status,
                ]),
                'is_default_event' => false,
                'is_personal' => $event->is_personal ?? false,
                'personal_color' => $event->personal_color,
                'is_urgent' => $event->is_urgent ?? false,
            ];
        });

        return response()->json([
            'events' => $transformedEvents,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'required|string|max:255',
            'event_type' => 'required|in:event,meeting',
            'images' => 'nullable|array|max:5',
            'date' => 'required|date',
            'time' => 'required',
            'end_time' => 'nullable|date_format:H:i',
            'member_ids' => 'nullable|array',
            'is_urgent' => 'nullable|boolean',
        ], [
            'images.max' => 'You can upload a maximum of 5 files.',
            'event_type.required' => 'Event type is required.',
            'event_type.in' => 'Event type must be either event or meeting.',
        ]);

        // Validate that date/time is not in the past
        $eventDateTime = \Carbon\Carbon::createFromFormat('Y-m-d H:i', $request->date . ' ' . substr($request->time, 0, 5), 'Asia/Manila');
        $now = \Carbon\Carbon::now('Asia/Manila');

        if ($eventDateTime < $now) {
            return response()->json([
                'error' => 'Event date and time cannot be in the past.'
            ], 422);
        }

        // Sunday validation - events and meetings cannot be scheduled on Sundays
        $eventDate = \Carbon\Carbon::createFromFormat('Y-m-d', $request->date, 'Asia/Manila');
        if ($eventDate->dayOfWeek === 0) {
            return response()->json([
                'error' => 'Events and meetings cannot be scheduled on Sundays.'
            ], 422);
        }

        // Get member IDs
        $memberIds = $request->member_ids ? collect($request->member_ids)
            ->filter(fn($id) => $id != $user->id) // Exclude host
            ->unique()
            ->values()
            ->toArray() : [];

        // Only authorized roles can create events
        if (!$user->canCreateEvents()) {
            return response()->json([
                'error' => 'Unauthorized to create events.'
            ], 403);
        }

        // Create event directly for all roles
        return $this->createEventDirectly($request, $user, $memberIds);
    }

    /**
     * Create event directly when no hierarchy approval is needed
     */
    private function createEventDirectly(Request $request, User $user, array $memberIds)
    {
        $event = Event::create([
            'title' => $request->title,
            'description' => $request->description,
            'location' => $request->location,
            'event_type' => $request->event_type,
            'date' => $request->date,
            'time' => $request->time,
            'end_time' => $request->end_time ?: null,
            'school_year' => $request->school_year,
            'host_id' => $user->id,
            'is_urgent' => $request->boolean('is_urgent', false),
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

                // Check file size (25MB)
                if ($image->getSize() > 25600 * 1024) {
                    return response()->json([
                        'error' => 'File size must not exceed 25MB.'
                    ], 400);
                }

                // Upload to Supabase Storage
                $filename = 'events/' . uniqid() . '_' . $image->getClientOriginalName();
                try {
                    Storage::disk('supabase')->put($filename, $image->get(), 'public');
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Supabase upload failed', [
                        'error' => $e->getMessage(),
                        'filename' => $filename,
                    ]);
                    return response()->json([
                        'error' => 'File upload failed: ' . $e->getMessage()
                    ], 500);
                }
                $publicUrl = rtrim(config('filesystems.disks.supabase.public_url'), '/') . '/' . config('filesystems.disks.supabase.bucket') . '/' . $filename;

                $event->images()->create([
                    'image_path' => $filename,
                    'cloudinary_url' => $publicUrl,
                    'original_filename' => $image->getClientOriginalName(),
                    'order' => $index,
                ]);
            }
        }

        if (!empty($memberIds)) {
            $memberData = collect($memberIds)->mapWithKeys(fn($id) => [$id => ['status' => 'pending']])->all();
            $event->members()->attach($memberData);
        }

        $event->load(['host', 'members', 'images']);

        return response()->json([
            'message' => 'Event created successfully',
            'event' => $event,
        ], 201);
    }

    /**
     * Create pending approval when hierarchy validation fails
     */

    public function update(Request $request, Event $event)
    {
        if ($event->host_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'sometimes|required|string|max:255',
            'event_type' => 'sometimes|required|in:event,meeting',
            'images' => 'nullable|array|max:5',
            'date' => 'sometimes|required|date',
            'time' => 'sometimes|required',
            'end_time' => 'nullable|date_format:H:i',
            'member_ids' => 'nullable|array',
            'is_urgent' => 'nullable|boolean',
        ], [
            'images.max' => 'You can upload a maximum of 5 files.',
            'event_type.required' => 'Event type is required.',
            'event_type.in' => 'Event type must be either event or meeting.',
        ]);

        // Validate that date/time is not in the past if being updated
        if ($request->has('date') && $request->has('time')) {
            $eventDateTime = \Carbon\Carbon::createFromFormat('Y-m-d H:i', $request->date . ' ' . substr($request->time, 0, 5), 'Asia/Manila');
            $now = \Carbon\Carbon::now('Asia/Manila');

            if ($eventDateTime < $now) {
                return response()->json([
                    'error' => 'Event date and time cannot be in the past.'
                ], 422);
            }

            // Sunday validation - events and meetings cannot be scheduled on Sundays
            $eventDate = \Carbon\Carbon::createFromFormat('Y-m-d', $request->date, 'Asia/Manila');
            if ($eventDate->dayOfWeek === 0) {
                return response()->json([
                    'error' => 'Events and meetings cannot be scheduled on Sundays.'
                ], 422);
            }
        }

        $event->update($request->only(['title', 'description', 'location', 'event_type', 'date', 'time', 'end_time', 'is_urgent']));

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

                if ($image->getSize() > 25600 * 1024) {
                    return response()->json([
                        'error' => 'File size must not exceed 25MB.'
                    ], 400);
                }
            }

            // Delete old images from Supabase (or local fallback)
            foreach ($event->images as $oldImage) {
                if ($oldImage->cloudinary_url && $oldImage->image_path) {
                    // Cloudinary — destroy by public_id
                    cloudinary()->uploadApi()->destroy($oldImage->image_path);
                } else {
                    // Legacy local storage fallback
                    Storage::disk('public')->delete($oldImage->image_path);
                }
                $oldImage->delete();
            }

            // Add new images via Supabase Storage
            foreach ($request->file('images') as $index => $image) {
                $filename = 'events/' . uniqid() . '_' . $image->getClientOriginalName();
                try {
                    Storage::disk('supabase')->put($filename, $image->get(), 'public');
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Supabase upload failed', [
                        'error' => $e->getMessage(),
                        'filename' => $filename,
                    ]);
                    return response()->json([
                        'error' => 'File upload failed: ' . $e->getMessage()
                    ], 500);
                }
                $publicUrl = rtrim(config('filesystems.disks.supabase.public_url'), '/') . '/' . config('filesystems.disks.supabase.bucket') . '/' . $filename;

                $event->images()->create([
                    'image_path' => $filename,
                    'cloudinary_url' => $publicUrl,
                    'original_filename' => $image->getClientOriginalName(),
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
            'status' => 'required|in:accepted,declined,pending',
            'decline_reason' => 'nullable|string|max:500',
        ]);

        $event->members()->updateExistingPivot($user->id, [
            'status' => $request->status,
        ]);

        // If declining a meeting, send decline reason as a message to the host
        if ($request->status === 'declined' && $event->event_type === 'meeting' && $request->decline_reason) {
            \App\Models\Message::create([
                'sender_id' => $user->id,
                'recipient_id' => $event->host_id,
                'event_id' => $event->id,
                'type' => 'meeting_declined',
                'message' => $request->decline_reason,
            ]);
        }

        return response()->json([
            'message' => 'Invitation ' . $request->status . ' successfully',
            'status' => $request->status,
        ]);
    }

    /**
     * Check for schedule conflicts for given users on a specific date/time
     * Improved to check both class schedules and existing events
     */
    private function checkScheduleConflicts(array $userIds, string $date, string $time)
    {
        $conflicts = [];

        // Get day of week
        $dateObj = new \DateTime($date);
        $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        $dayName = $days[$dateObj->format('w')];

        // Parse event time
        $timeParts = explode(':', $time);
        $eventHour = (int) $timeParts[0];
        $eventMinute = isset($timeParts[1]) ? (int) $timeParts[1] : 0;

        // Handle AM/PM
        if (stripos($time, 'pm') !== false && $eventHour < 12) {
            $eventHour += 12;
        } elseif (stripos($time, 'am') !== false && $eventHour === 12) {
            $eventHour = 0;
        }

        $eventTimeStr = sprintf('%02d:%02d', $eventHour, $eventMinute);

        // 1. Check class schedule conflicts
        $schedules = \App\Models\UserSchedule::whereIn('user_id', $userIds)
            ->where('day', $dayName)
            ->with('user:id,name,email')
            ->get();

        foreach ($schedules as $schedule) {
            // Check if event time falls within class schedule range
            if ($eventTimeStr >= $schedule->start_time && $eventTimeStr < $schedule->end_time) {
                $conflicts[] = [
                    'type' => 'class_schedule',
                    'user_id' => $schedule->user_id,
                    'username' => $schedule->user->name,
                    'email' => $schedule->user->email,
                    'conflict_time' => $schedule->start_time . ' - ' . $schedule->end_time,
                    'conflict_description' => $schedule->description,
                    'conflict_detail' => 'Class Schedule'
                ];
            }
        }

        // 2. Check existing event conflicts (event-to-event)
        $existingEvents = Event::where('date', $date)
            ->where('time', $time)
            ->whereHas('members', function ($query) use ($userIds) {
                $query->whereIn('users.id', $userIds);
            })
            ->orWhere(function ($query) use ($date, $time, $userIds) {
                $query->where('date', $date)
                    ->where('time', $time)
                    ->whereIn('host_id', $userIds);
            })
            ->with(['host:id,name,email', 'members:id,name,email'])
            ->get();

        foreach ($existingEvents as $event) {
            // Check if any of the users are involved in this event
            $involvedUsers = collect([$event->host])
                ->merge($event->members)
                ->whereIn('id', $userIds);

            foreach ($involvedUsers as $user) {
                $conflicts[] = [
                    'type' => 'existing_event',
                    'user_id' => $user->id,
                    'username' => $user->name,
                    'email' => $user->email,
                    'conflict_time' => $time,
                    'conflict_description' => $event->title,
                    'conflict_detail' => ucfirst($event->event_type),
                    'event_id' => $event->id
                ];
            }
        }

        return $conflicts;
    }
}
