<?php

namespace App\Http\Controllers;

use App\Models\EventRequest;
use App\Models\EventApproval;
use App\Models\User;
use App\Services\EventApprovalWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class EventRequestController extends Controller
{
    /**
     * Store a new event request
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required',
            'location' => 'required|string|max:255',
            'justification' => 'required|string',
            'expected_attendees' => 'nullable|string|max:255',
            'budget' => 'nullable|string|max:255',
            'resources' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Only coordinators can submit event requests
        if (Auth::user()->role !== 'Coordinator') {
            return response()->json([
                'message' => 'Unauthorized. Only coordinators can submit event requests.'
            ], 403);
        }

        $eventRequest = EventRequest::create([
            'title' => $request->title,
            'description' => $request->description,
            'date' => $request->date,
            'time' => $request->time,
            'location' => $request->location,
            'justification' => $request->justification,
            'expected_attendees' => $request->expected_attendees,
            'budget' => $request->budget,
            'resources' => $request->resources,
            'requested_by' => Auth::id(),
            'status' => 'pending'
        ]);

        // TODO: Send notifications to Dean and Chairperson
        // This could be implemented later with email notifications or in-app notifications

        return response()->json([
            'message' => 'Event request submitted successfully',
            'request' => $eventRequest->load('requester')
        ], 201);
    }

    /**
     * Get all event requests (for Dean and Chairperson) - includes both coordinator requests and hierarchy approvals
     */
    public function index()
    {
        $user = Auth::user();
        
        // Only Dean, Chairperson, and Admin can view event requests
        if (!in_array($user->role, ['Dean', 'Chairperson', 'Admin'])) {
            return response()->json([
                'message' => 'Unauthorized. Only Dean, Chairperson, and Admin can view event requests.'
            ], 403);
        }

        // Get coordinator requests
        $coordinatorRequests = EventRequest::with(['requester', 'reviewer'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'type' => 'coordinator_request',
                    'title' => $request->title,
                    'description' => $request->description,
                    'date' => $request->date,
                    'time' => $request->time,
                    'location' => $request->location,
                    'status' => $request->status,
                    'created_at' => $request->created_at,
                    'requester' => $request->requester,
                    'reviewer' => $request->reviewer,
                    'justification' => $request->justification,
                    'expected_attendees' => $request->expected_attendees,
                    'budget' => $request->budget,
                    'resources' => $request->resources,
                    'rejection_reason' => $request->rejection_reason,
                    'reviewed_at' => $request->reviewed_at,
                ];
            });

        // Get hierarchy approval requests where current user is an approver
        $hierarchyApprovals = EventApproval::with(['host', 'approvers.approver'])
            ->whereHas('approvers', function ($query) use ($user) {
                $query->where('approver_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($approval) use ($user) {
                // Get current user's approver record
                $userApprover = $approval->approvers->where('approver_id', $user->id)->first();
                
                return [
                    'id' => $approval->id,
                    'type' => 'hierarchy_approval',
                    'title' => $approval->title,
                    'description' => $approval->description,
                    'date' => $approval->date,
                    'time' => $approval->time,
                    'location' => $approval->location,
                    'status' => $approval->status,
                    'created_at' => $approval->created_at,
                    'host' => $approval->host,
                    'event_data' => $approval->event_data,
                    'approver_status' => $userApprover ? $userApprover->status : 'pending',
                    'approver_decision_reason' => $userApprover ? $userApprover->decision_reason : null,
                    'approver_decided_at' => $userApprover ? $userApprover->decided_at : null,
                    'all_approvers' => $approval->approvers->map(function ($approver) {
                        return [
                            'id' => $approver->approver->id,
                            'name' => $approver->approver->name,
                            'role' => $approver->approver->role,
                            'status' => $approver->status,
                            'decided_at' => $approver->decided_at,
                        ];
                    }),
                ];
            });

        // Combine and sort by creation date
        $allRequests = $coordinatorRequests->concat($hierarchyApprovals)
            ->sortByDesc('created_at')
            ->values();

        return response()->json([
            'requests' => $allRequests
        ]);
    }

    /**
     * Get user's own event requests
     */
    public function myRequests()
    {
        $requests = EventRequest::where('requested_by', Auth::id())
            ->with(['reviewer'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'requests' => $requests
        ]);
    }

    /**
     * Review an event request (approve/reject)
     */
    public function review(Request $request, EventRequest $eventRequest)
    {
        $user = Auth::user();
        
        // Only Dean, Chairperson, and Admin can review requests
        if (!in_array($user->role, ['Dean', 'Chairperson', 'Admin'])) {
            return response()->json([
                'message' => 'Unauthorized. Only Dean, Chairperson, and Admin can review event requests.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $eventRequest->update([
            'status' => $request->status,
            'rejection_reason' => $request->status === 'rejected' ? $request->rejection_reason : null,
            'reviewed_by' => $user->id,
            'reviewed_at' => now()
        ]);

        // TODO: Send notification to the requester about the decision
        // TODO: If approved, create the actual event or provide next steps

        return response()->json([
            'message' => 'Event request ' . $request->status . ' successfully',
            'request' => $eventRequest->load(['requester', 'reviewer'])
        ]);
    }

    /**
     * Review a hierarchy approval request (approve/reject)
     */
    public function reviewHierarchyApproval(EventApproval $approval, Request $request)
    {
        $user = Auth::user();
        
        // Only Dean, Chairperson, and Admin can review hierarchy approvals
        if (!in_array($user->role, ['Dean', 'Chairperson', 'Admin'])) {
            return response()->json([
                'message' => 'Unauthorized. Only Dean, Chairperson, and Admin can review hierarchy approvals.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'decision' => 'required|in:approved,rejected',
            'reason' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $workflow = new EventApprovalWorkflow();
            $workflow->processApproval($approval, $user, $request->decision, $request->reason);

            $approval->refresh();
            
            return response()->json([
                'message' => 'Hierarchy approval ' . $request->decision . ' successfully',
                'approval' => $approval->load(['host', 'approvers.approver', 'createdEvent'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error processing approval: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get detailed information about a hierarchy approval
     */
    public function getApprovalDetails(EventApproval $approval)
    {
        $user = Auth::user();
        
        // Only Dean, Chairperson, and Admin can view approval details
        if (!in_array($user->role, ['Dean', 'Chairperson', 'Admin'])) {
            return response()->json([
                'message' => 'Unauthorized. Only Dean, Chairperson, and Admin can view approval details.'
            ], 403);
        }

        // Check if user is an approver for this request
        $isApprover = $approval->approvers()->where('approver_id', $user->id)->exists();
        
        if (!$isApprover && $user->role !== 'Admin') {
            return response()->json([
                'message' => 'Unauthorized. You are not an approver for this request.'
            ], 403);
        }

        $approval->load(['host', 'approvers.approver', 'createdEvent']);
        
        // Get invited members from event_data
        $invitedMembers = [];
        if (isset($approval->event_data['member_ids']) && !empty($approval->event_data['member_ids'])) {
            $invitedMembers = User::whereIn('id', $approval->event_data['member_ids'])
                ->select('id', 'name', 'role', 'department')
                ->get();
        }

        return response()->json([
            'approval' => [
                'id' => $approval->id,
                'title' => $approval->title,
                'description' => $approval->description,
                'location' => $approval->location,
                'date' => $approval->date,
                'time' => $approval->time,
                'status' => $approval->status,
                'created_at' => $approval->created_at,
                'host' => $approval->host,
                'invited_members' => $invitedMembers,
                'approvers' => $approval->approvers->map(function ($approver) {
                    return [
                        'id' => $approver->approver->id,
                        'name' => $approver->approver->name,
                        'role' => $approver->approver->role,
                        'status' => $approver->status,
                        'decision_reason' => $approver->decision_reason,
                        'decided_at' => $approver->decided_at,
                    ];
                }),
                'created_event' => $approval->createdEvent,
            ]
        ]);
    }

    /**
     * Delete an event request
     */
    public function destroy(EventRequest $eventRequest)
    {
        $user = Auth::user();
        
        // Only the requester or admin can delete the request
        if ($eventRequest->requested_by !== $user->id && $user->role !== 'Admin') {
            return response()->json([
                'message' => 'Unauthorized. You can only delete your own requests.'
            ], 403);
        }

        // Can only delete pending requests
        if ($eventRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Cannot delete a request that has already been reviewed.'
            ], 400);
        }

        $eventRequest->delete();

        return response()->json([
            'message' => 'Event request deleted successfully'
        ]);
    }
}