<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ActivityController extends Controller
{
    /**
     * Get comprehensive activity history for the authenticated user
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $activities = collect();

        // 1. Events hosted by user
        $hostedEvents = Event::where('host_id', $user->id)
            ->with(['members', 'images'])
            ->get()
            ->map(function ($event) {
            return [
            'id' => $event->id,
            'type' => 'event_hosted',
            'title' => $event->title,
            'description' => $event->description,
            'date' => $event->date,
            'time' => $event->time,
            'location' => $event->location,
            'created_at' => $event->created_at,
            'status' => 'completed',
            'details' => [
            'event' => $event,
            'members_count' => $event->members->count(),
            'accepted_count' => $event->members->where('pivot.status', 'accepted')->count(),
            'declined_count' => $event->members->where('pivot.status', 'declined')->count(),
            'pending_count' => $event->members->where('pivot.status', 'pending')->count(),
            ]
            ];
        });

        // 2. Events user was invited to
        $invitedEvents = Event::whereHas('members', function ($query) use ($user) {
            $query->where('users.id', $user->id);
        })
            ->with(['host', 'members', 'images'])
            ->get()
            ->map(function ($event) use ($user) {
            $userStatus = $event->members->where('id', $user->id)->first()->pivot->status;
            return [
            'id' => $event->id,
            'type' => 'event_invited',
            'title' => $event->title,
            'description' => $event->description,
            'date' => $event->date,
            'time' => $event->time,
            'location' => $event->location,
            'created_at' => $event->created_at,
            'status' => $userStatus,
            'details' => [
            'event' => $event,
            'host' => $event->host,
            'user_response' => $userStatus,
            'response_date' => $event->updated_at,
            ]
            ];
        });

        // 7. Messages sent by user
        $sentMessages = Message::where('sender_id', $user->id)
            ->with(['recipient', 'event'])
            ->get()
            ->map(function ($message) {
            return [
            'id' => $message->id,
            'type' => 'message_sent',
            'title' => 'Message to ' . $message->recipient->name,
            'description' => $message->message,
            'date' => $message->created_at->format('Y-m-d'),
            'time' => $message->created_at->format('H:i'),
            'location' => 'System Message',
            'created_at' => $message->created_at,
            'status' => $message->is_read ? 'read' : 'unread',
            'details' => [
            'message' => $message,
            'recipient' => $message->recipient,
            'event' => $message->event,
            'type' => $message->type,
            ]
            ];
        });

        // 8. Messages received by user
        $receivedMessages = Message::where('recipient_id', $user->id)
            ->with(['sender', 'event'])
            ->get()
            ->map(function ($message) {
            return [
            'id' => $message->id,
            'type' => 'message_received',
            'title' => 'Message from ' . $message->sender->name,
            'description' => $message->message,
            'date' => $message->created_at->format('Y-m-d'),
            'time' => $message->created_at->format('H:i'),
            'location' => 'System Message',
            'created_at' => $message->created_at,
            'status' => $message->is_read ? 'read' : 'unread',
            'details' => [
            'message' => $message,
            'sender' => $message->sender,
            'event' => $message->event,
            'type' => $message->type,
            ]
            ];
        });

        // Combine all activities
        $activities = $activities
            ->concat($hostedEvents)
            ->concat($invitedEvents)
            ->concat($sentMessages)
            ->concat($receivedMessages);

        // Sort by created_at descending (most recent first)
        $activities = $activities->sortByDesc('created_at')->values();

        // Apply filters if provided
        if ($request->has('type') && $request->type !== 'all') {
            $activities = $activities->where('type', $request->type)->values();
        }

        if ($request->has('status') && $request->status !== 'all') {
            $activities = $activities->where('status', $request->status)->values();
        }

        // Paginate results
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 20);
        $offset = ($page - 1) * $perPage;

        $paginatedActivities = $activities->slice($offset, $perPage)->values();
        $total = $activities->count();

        return response()->json([
            'activities' => $paginatedActivities,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => ceil($total / $perPage),
            ]
        ]);
    }
}