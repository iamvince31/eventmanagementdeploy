<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\User;
use App\Services\HierarchyService;
use App\Services\EventApprovalWorkflow;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $events = Event::with(['host', 'members', 'images', 'rescheduleRequests'])
            ->where(function ($query) use ($user) {
                // User is the host
                $query->where('host_id', $user->id)
                    // Or user is a member/invited
                    ->orWhereHas('members', function ($q) use ($user) {
                        $q->where('users.id', $user->id);
                    });
            })
            // Exclude personal events from other users
            ->where(function ($query) use ($user) {
                $query->where('is_personal', false)
                    ->orWhere(function ($q) use ($user) {
                        $q->where('is_personal', true)
                          ->where('host_id', $user->id);
                    });
            })
            ->orderBy('date')
            ->orderBy('time')
            ->get();

        // Get default events that have dates set
        $defaultEvents = \App\Models\DefaultEvent::whereNotNull('date')
            ->orderBy('date')
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
                    'url' => asset('storage/' . $img->image_path),
                    'original_filename' => $img->original_filename,
                ]),
                'date' => $event->date,
                'time' => $event->time,
                'school_year' => $event->school_year,
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
                'is_default_event' => false,
                'is_personal' => $event->is_personal ?? false,
                'personal_color' => $event->personal_color,
            ];
        });

        // Transform default events
        $transformedDefaultEvents = $defaultEvents->map(function ($event) {
            return [
                'id' => 'default-' . $event->id,
                'title' => $event->name,
                'description' => 'Academic Calendar Event',
                'location' => 'TBD',
                'images' => [],
                'date' => $event->date ? $event->date->format('Y-m-d') : null,
                'time' => '00:00',
                'has_pending_reschedule_requests' => false,
                'host' => [
                    'id' => 0,
                    'username' => 'Academic Calendar',
                    'email' => 'calendar@system',
                ],
                'members' => [],
                'is_default_event' => true,
            ];
        });

        // Merge and sort all events by date
        $allEvents = $transformedEvents->concat($transformedDefaultEvents)
            ->sortBy([
                ['date', 'asc'],
                ['time', 'asc'],
            ])
            ->values();

        return response()->json([
            'events' => $allEvents,
        ]);
    }

    /**
     * Get user's meeting approval requests (for Faculty/Staff)
     * OR get approval requests for Dean/Chairperson to review
     */

    public function store(Request $request)
    {
        $user = $request->user();
        
        // Faculty Members and Staff CANNOT create events directly - they must use Request Event feature
        if (in_array($user->role, ['Faculty Member', 'Staff'])) {
            return response()->json([
                'error' => 'Faculty Members and Staff cannot create events directly. Please use the Request Event feature.'
            ], 403);
        }
        
        // Only Admin, Dean, Chairperson, Coordinator, CEIT Official can create events directly
        if (!in_array($user->role, ['Admin', 'Dean', 'Chairperson', 'Coordinator', 'CEIT Official'])) {
            return response()->json([
                'error' => 'Unauthorized. Only Admin, Dean, Chairperson, Coordinator, and CEIT Official can create events.'
            ], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'required|string|max:255',
            'event_type' => 'required|in:event,meeting',
            'images' => 'nullable|array|max:5',
            'images.*' => 'file|mimes:jpeg,jpg,png,gif,webp,pdf|max:25600',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required',
            'member_ids' => 'nullable|array',
        ], [
            'images.max' => 'You can upload a maximum of 5 files.',
            'images.*.file' => 'Each upload must be a valid file.',
            'images.*.mimes' => 'Files must be in JPG, PNG, GIF, WebP, or PDF format.',
            'images.*.max' => 'Each file must not exceed 25MB in size.',
            'date.after_or_equal' => 'Event date cannot be in the past.',
            'event_type.required' => 'Event type is required.',
            'event_type.in' => 'Event type must be either event or meeting.',
        ]);

        // Validate that date/time is not in the past
        $eventDateTime = new \DateTime($request->date . ' ' . $request->time);
        $now = new \DateTime();
        
        if ($eventDateTime < $now) {
            return response()->json([
                'error' => 'Event date and time cannot be in the past.'
            ], 422);
        }

        // Get member IDs
        $memberIds = $request->member_ids ? collect($request->member_ids)
            ->filter(fn($id) => $id != $user->id) // Exclude host
            ->unique()
            ->values()
            ->toArray() : [];

        // Create event directly for authorized roles
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
            'school_year' => $request->school_year,
            'host_id' => $user->id,
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
                
                $imagePath = $image->store('events', 'public');
                $originalFilename = $image->getClientOriginalName();
                
                $event->images()->create([
                    'image_path' => $imagePath,
                    'original_filename' => $originalFilename,
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
            'images.*' => 'file|mimes:jpeg,jpg,png,gif,webp,pdf|max:25600',
            'date' => 'sometimes|required|date|after_or_equal:today',
            'time' => 'sometimes|required',
            'member_ids' => 'nullable|array',
        ], [
            'images.max' => 'You can upload a maximum of 5 files.',
            'images.*.file' => 'Each upload must be a valid file.',
            'images.*.mimes' => 'Files must be in JPG, PNG, GIF, WebP, or PDF format.',
            'images.*.max' => 'Each file must not exceed 25MB in size.',
            'date.after_or_equal' => 'Event date cannot be in the past.',
            'event_type.required' => 'Event type is required.',
            'event_type.in' => 'Event type must be either event or meeting.',
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

        $event->update($request->only(['title', 'description', 'location', 'event_type', 'date', 'time']));

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
            
            // Delete old images
            foreach ($event->images as $oldImage) {
                \Storage::disk('public')->delete($oldImage->image_path);
                $oldImage->delete();
            }

            // Add new images
            foreach ($request->file('images') as $index => $image) {
                $imagePath = $image->store('events', 'public');
                $originalFilename = $image->getClientOriginalName();
                
                $event->images()->create([
                    'image_path' => $imagePath,
                    'original_filename' => $originalFilename,
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

    // COMMENTED OUT - Hierarchy validation feature disabled
    /**
     * Validate hierarchy rules for real-time feedback
     */
    // public function validateHierarchy(Request $request)
    // {
    //     $user = $request->user();
    //     
    //     $request->validate([
    //         'member_ids' => 'nullable|array',
    //         'member_ids.*' => 'integer|exists:users,id',
    //     ]);
    //
    //     $memberIds = $request->member_ids ? collect($request->member_ids)
    //         ->filter(fn($id) => $id != $user->id) // Exclude host
    //         ->unique()
    //         ->values()
    //         ->toArray() : [];
    //
    //     if (empty($memberIds)) {
    //         return response()->json([
    //             'requires_approval' => false,
    //             'violations' => [],
    //             'approvers_needed' => [],
    //         ]);
    //     }
    //
    //     $hierarchyService = new HierarchyService();
    //     $validationResult = $hierarchyService->validateInvitations($user, $memberIds);
    //
    //     // Get approver details if needed
    //     $approverDetails = [];
    //     if (!empty($validationResult->approversNeeded)) {
    //         $approvers = User::whereIn('id', $validationResult->approversNeeded)
    //             ->select('id', 'name', 'role')
    //             ->get();
    //         $approverDetails = $approvers->toArray();
    //     }
    //
    //     return response()->json([
    //         'requires_approval' => $validationResult->requiresApproval,
    //         'violations' => $validationResult->violations,
    //         'approvers_needed' => $approverDetails,
    //     ]);
    // }

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
