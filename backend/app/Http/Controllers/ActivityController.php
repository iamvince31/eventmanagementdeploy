<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventRequest;
use App\Models\EventApproval;
use App\Models\EventApprover;
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

        // 3. Event requests submitted by user (if coordinator/chairperson)
        if (in_array($user->role, ['Coordinator', 'Chairperson'])) {
            $eventRequests = EventRequest::where('requested_by', $user->id)
                ->with(['reviewer', 'deanApprover', 'chairApprover'])
                ->get()
                ->map(function ($request) {
                return [
                'id' => $request->id,
                'type' => 'event_request_submitted',
                'title' => $request->title,
                'description' => $request->description,
                'date' => $request->date,
                'time' => $request->time,
                'location' => $request->location,
                'created_at' => $request->created_at,
                'status' => $request->status,
                'details' => [
                'request' => $request,
                'justification' => $request->justification,
                'reviewer' => $request->reviewer,
                'reviewed_at' => $request->reviewed_at,
                'rejection_reason' => $request->rejection_reason,
                'dean_approver' => $request->deanApprover,
                'dean_approved_at' => $request->dean_approved_at,
                'chair_approver' => $request->chairApprover,
                'chair_approved_at' => $request->chair_approved_at,
                'all_approvals_received' => $request->all_approvals_received,
                ]
                ];
            });
            $activities = $activities->concat($eventRequests);
        }

        // a4. Event requests where user approved (Dean/Chairperson individual approvals)
        if (in_array($user->role, ['Dean', 'Chairperson', 'Admin'])) {
            $approvedRequests = collect();

            if ($user->role === 'Dean') {
                $approvedRequests = EventRequest::where('dean_approved_by', $user->id)
                    ->with(['requester'])
                    ->get()
                    ->map(function ($request) {
                    return [
                    'id' => $request->id,
                    'type' => 'event_request_approved',
                    'title' => $request->title,
                    'description' => $request->description,
                    'date' => $request->date,
                    'time' => $request->time,
                    'location' => $request->location,
                    'created_at' => $request->dean_approved_at,
                    'status' => 'approved',
                    'details' => [
                    'request' => $request,
                    'requester' => $request->requester,
                    'approval_role' => 'Dean',
                    'approved_at' => $request->dean_approved_at,
                    ]
                    ];
                });
            }
            elseif ($user->role === 'Chairperson') {
                $approvedRequests = EventRequest::where('chair_approved_by', $user->id)
                    ->with(['requester'])
                    ->get()
                    ->map(function ($request) {
                    return [
                    'id' => $request->id,
                    'type' => 'event_request_approved',
                    'title' => $request->title,
                    'description' => $request->description,
                    'date' => $request->date,
                    'time' => $request->time,
                    'location' => $request->location,
                    'created_at' => $request->chair_approved_at,
                    'status' => 'approved',
                    'details' => [
                    'request' => $request,
                    'requester' => $request->requester,
                    'approval_role' => 'Chairperson',
                    'approved_at' => $request->chair_approved_at,
                    ]
                    ];
                });
            }

            $activities = $activities->concat($approvedRequests);

            // Also include rejected requests
            $rejectedRequests = EventRequest::where('reviewed_by', $user->id)
                ->where('status', 'rejected')
                ->with(['requester'])
                ->get()
                ->map(function ($request) {
                return [
                'id' => $request->id,
                'type' => 'event_request_rejected',
                'title' => $request->title,
                'description' => $request->description,
                'date' => $request->date,
                'time' => $request->time,
                'location' => $request->location,
                'created_at' => $request->reviewed_at,
                'status' => 'rejected',
                'details' => [
                'request' => $request,
                'requester' => $request->requester,
                'rejection_reason' => $request->rejection_reason,
                'reviewed_at' => $request->reviewed_at,
                ]
                ];
            });
            $activities = $activities->concat($rejectedRequests);
        }

        // 5. Hierarchy approvals where user is the host
        $hostedApprovals = EventApproval::where('host_id', $user->id)
            ->with(['approvers.approver'])
            ->get()
            ->map(function ($approval) {
            return [
            'id' => $approval->id,
            'type' => 'hierarchy_approval_requested',
            'title' => $approval->title,
            'description' => $approval->description,
            'date' => $approval->date,
            'time' => $approval->time,
            'location' => $approval->location,
            'created_at' => $approval->created_at,
            'status' => $approval->status,
            'details' => [
            'approval' => $approval,
            'approvers' => $approval->approvers->map(function ($approver) {
                    return [
                    'name' => $approver->approver->name,
                    'role' => $approver->approver->role,
                    'status' => $approver->status,
                    'decided_at' => $approver->decided_at,
                    'decision_reason' => $approver->decision_reason,
                    ];
                }
                ),
                'pending_count' => $approval->approvers->where('status', 'pending')->count(),
                'approved_count' => $approval->approvers->where('status', 'approved')->count(),
                'rejected_count' => $approval->approvers->where('status', 'rejected')->count(),
                ]
                ];
            });

        // 6. Hierarchy approvals where user is an approver
        $approverActivities = EventApprover::where('approver_id', $user->id)
            ->with(['eventApproval.host'])
            ->get()
            ->map(function ($approver) {
            return [
            'id' => $approver->event_approval_id,
            'type' => 'hierarchy_approval_decision',
            'title' => $approver->eventApproval->title,
            'description' => $approver->eventApproval->description,
            'date' => $approver->eventApproval->date,
            'time' => $approver->eventApproval->time,
            'location' => $approver->eventApproval->location,
            'created_at' => $approver->decided_at ?: $approver->eventApproval->created_at,
            'status' => $approver->status,
            'details' => [
            'approval' => $approver->eventApproval,
            'host' => $approver->eventApproval->host,
            'decision' => $approver->status,
            'decision_reason' => $approver->decision_reason,
            'decided_at' => $approver->decided_at,
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
            ->concat($hostedApprovals)
            ->concat($approverActivities)
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