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
            'expected_attendees' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        // Only Faculty Members and Staff can submit event requests
        if (!in_array($user->role, ['Faculty Member', 'Staff'])) {
            return response()->json([
                'message' => 'Unauthorized. Only Faculty Members and Staff can submit event requests.'
            ], 403);
        }

        // Faculty Members and Staff need approval from Dean and/or Chairperson (whoever is available)
        $requiredApprovers = [];
        
        $dean = User::where('role', 'Dean')->first();
        $chair = User::where('role', 'Chairperson')->first();
        
        if ($dean) {
            $requiredApprovers[] = $dean->id;
        }
        if ($chair) {
            $requiredApprovers[] = $chair->id;
        }
        
        if (empty($requiredApprovers)) {
            return response()->json([
                'message' => 'No approvers available. Please contact an administrator.'
            ], 400);
        }

        $eventRequest = EventRequest::create([
            'title' => $request->title,
            'description' => $request->description,
            'date' => $request->date,
            'time' => $request->time,
            'location' => $request->location,
            'justification' => $request->justification,
            'expected_attendees' => $request->expected_attendees,
            'requested_by' => Auth::id(),
            'status' => 'pending',
            'required_approvers' => $requiredApprovers,
            'all_approvals_received' => false
        ]);

        // Get approver names for response
        $approverNames = User::whereIn('id', $requiredApprovers)->pluck('name')->toArray();

        return response()->json([
            'message' => 'Event request submitted successfully. Approval required from: ' . implode(' and ', $approverNames),
            'request' => $eventRequest->load('requester'),
            'required_approvers' => $approverNames
        ], 201);
    }

    /**
     * Get all event requests (for Dean and Chairperson) - ONLY coordinator/chairperson requests, NOT hierarchy approvals
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

        // Get coordinator/chairperson requests only
        $requests = EventRequest::with(['requester', 'reviewer', 'deanApprover', 'chairApprover'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) use ($user) {
                // Check if current user can approve this request
                $canApprove = false;
                $hasApproved = false;
                
                if ($request->required_approvers && in_array($user->id, $request->required_approvers)) {
                    $canApprove = true;
                    
                    // Check if user has already approved
                    if ($user->role === 'Dean' && $request->dean_approved_by === $user->id) {
                        $hasApproved = true;
                    } elseif ($user->role === 'Chairperson' && $request->chair_approved_by === $user->id) {
                        $hasApproved = true;
                    }
                }
                
                return [
                    'id' => $request->id,
                    'type' => 'event_request',
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
                    'rejection_reason' => $request->rejection_reason,
                    'reviewed_at' => $request->reviewed_at,
                    'dean_approver' => $request->deanApprover,
                    'dean_approved_at' => $request->dean_approved_at,
                    'chair_approver' => $request->chairApprover,
                    'chair_approved_at' => $request->chair_approved_at,
                    'all_approvals_received' => $request->all_approvals_received,
                    'can_approve' => $canApprove,
                    'has_approved' => $hasApproved,
                    'required_approvers' => $request->required_approvers,
                ];
            });

        return response()->json([
            'requests' => $requests
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
     * Check if user has any approved requests that haven't been used yet
     */
    public function hasApprovedRequests()
    {
        $user = Auth::user();
        
        // Get approved requests that haven't been used to create an event yet
        $approvedRequests = EventRequest::where('requested_by', $user->id)
            ->where('status', 'approved')
            ->where('all_approvals_received', true)
            ->whereDoesntHave('event') // Requests that don't have an event created yet
            ->with(['deanApprover', 'chairApprover'])
            ->get();

        return response()->json([
            'has_approved_requests' => $approvedRequests->count() > 0,
            'approved_requests' => $approvedRequests
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

        // Check if user is a required approver
        if (!in_array($user->id, $eventRequest->required_approvers ?? [])) {
            return response()->json([
                'message' => 'You are not a required approver for this request.'
            ], 403);
        }

        // Check if user has already approved
        if ($user->role === 'Dean' && $eventRequest->dean_approved_by) {
            return response()->json([
                'message' => 'You have already approved this request.'
            ], 400);
        }
        if ($user->role === 'Chairperson' && $eventRequest->chair_approved_by) {
            return response()->json([
                'message' => 'You have already approved this request.'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Handle rejection
        if ($request->status === 'rejected') {
            $eventRequest->update([
                'status' => 'rejected',
                'rejection_reason' => $request->rejection_reason,
                'reviewed_by' => $user->id,
                'reviewed_at' => now()
            ]);

            return response()->json([
                'message' => 'Event request rejected',
                'request' => $eventRequest->load(['requester', 'reviewer', 'deanApprover', 'chairApprover'])
            ]);
        }

        // Handle approval
        if ($user->role === 'Dean') {
            $eventRequest->dean_approved_by = $user->id;
            $eventRequest->dean_approved_at = now();
        } elseif ($user->role === 'Chairperson') {
            $eventRequest->chair_approved_by = $user->id;
            $eventRequest->chair_approved_at = now();
        }

        // Check if all required approvals are received
        $allApproved = $eventRequest->checkAllApprovalsReceived();
        
        if ($allApproved) {
            $eventRequest->status = 'approved';
            $eventRequest->all_approvals_received = true;
            $eventRequest->reviewed_by = $user->id;
            $eventRequest->reviewed_at = now();
        }

        $eventRequest->save();

        $message = $allApproved 
            ? 'Event request fully approved! The requestor can now create the event.'
            : 'Your approval has been recorded. Waiting for other approvers.';

        return response()->json([
            'message' => $message,
            'request' => $eventRequest->load(['requester', 'reviewer', 'deanApprover', 'chairApprover']),
            'all_approvals_received' => $allApproved
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