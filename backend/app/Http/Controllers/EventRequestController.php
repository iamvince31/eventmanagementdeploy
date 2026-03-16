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
     * Get all event requests
     * - For Faculty/Staff: Show their own requests
     * - For Dean: Show ALL requests (approves all departments)
     * - For Chairperson: Show only requests from THEIR department
     */
    public function index()
    {
        $user = Auth::user();
        
        // Faculty/Staff see their own requests
        if (in_array($user->role, ['Faculty Member', 'Staff'])) {
            $requests = EventRequest::where('requested_by', $user->id)
                ->with([
                    'requester:id,name,email,role,department',
                    'deanApprover:id,name,email,role',
                    'chairApprover:id,name,email,role'
                ])
                ->orderBy('created_at', 'desc')
                ->get();

            // Transform to array to avoid N+1 queries
            $transformedRequests = $requests->map(function ($request) {
                return [
                    'id' => $request->id,
                    'title' => $request->title,
                    'description' => $request->description,
                    'date' => $request->date,
                    'time' => $request->time,
                    'location' => $request->location,
                    'event_type' => $request->event_type,
                    'department' => $request->department,
                    'status' => $request->status,
                    'created_at' => $request->created_at,
                    'requester' => $request->requester ? [
                        'id' => $request->requester->id,
                        'name' => $request->requester->name,
                        'email' => $request->requester->email,
                        'role' => $request->requester->role,
                        'department' => $request->requester->department,
                    ] : null,
                    'justification' => $request->justification,
                    'decline_reason' => $request->decline_reason,
                    'dean_decline_reason' => $request->dean_decline_reason,
                    'chair_decline_reason' => $request->chair_decline_reason,
                    'dean_approver' => $request->deanApprover ? [
                        'id' => $request->deanApprover->id,
                        'name' => $request->deanApprover->name,
                        'email' => $request->deanApprover->email,
                        'role' => $request->deanApprover->role,
                    ] : null,
                    'dean_approved_at' => $request->dean_approved_at,
                    'chair_approver' => $request->chairApprover ? [
                        'id' => $request->chairApprover->id,
                        'name' => $request->chairApprover->name,
                        'email' => $request->chairApprover->email,
                        'role' => $request->chairApprover->role,
                    ] : null,
                    'chair_approved_at' => $request->chair_approved_at,
                    'all_approvals_received' => $request->all_approvals_received,
                ];
            })->values();

            return response()->json(['requests' => $transformedRequests]);
        }
        
        // Check authorization
        if (!in_array($user->role, ['Dean', 'Chairperson', 'Admin'])) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 403);
        }

        // Build query based on role with optimized eager loading
        $query = EventRequest::with([
                'requester:id,name,email,role,department',
                'reviewer:id,name,email,role',
                'deanApprover:id,name,email,role',
                'chairApprover:id,name,email,role'
            ]);
        
        // Chairperson only sees requests from their department
        if ($user->role === 'Chairperson') {
            $query->where('department', $user->department);
        }
        // Dean sees ALL requests (no filter)
        // Admin sees ALL requests (no filter)
        
        $requests = $query->orderBy('created_at', 'desc')->get();
        
        // Transform to array to avoid N+1 queries
        $transformedRequests = $requests->map(function ($request) {
            return [
                'id' => $request->id,
                'type' => 'event_request',
                'title' => $request->title,
                'description' => $request->description,
                'date' => $request->date,
                'time' => $request->time,
                'location' => $request->location,
                'event_type' => $request->event_type,
                'department' => $request->department,
                'status' => $request->status,
                'created_at' => $request->created_at,
                'requester' => $request->requester ? [
                    'id' => $request->requester->id,
                    'name' => $request->requester->name,
                    'email' => $request->requester->email,
                    'role' => $request->requester->role,
                    'department' => $request->requester->department,
                ] : null,
                'reviewer' => $request->reviewer ? [
                    'id' => $request->reviewer->id,
                    'name' => $request->reviewer->name,
                    'email' => $request->reviewer->email,
                    'role' => $request->reviewer->role,
                ] : null,
                'justification' => $request->justification,
                'expected_attendees' => $request->expected_attendees,
                'rejection_reason' => $request->rejection_reason,
                'decline_reason' => $request->decline_reason,
                'dean_decline_reason' => $request->dean_decline_reason,
                'chair_decline_reason' => $request->chair_decline_reason,
                'reviewed_at' => $request->reviewed_at,
                'dean_approver' => $request->deanApprover ? [
                    'id' => $request->deanApprover->id,
                    'name' => $request->deanApprover->name,
                    'email' => $request->deanApprover->email,
                    'role' => $request->deanApprover->role,
                ] : null,
                'dean_approved_at' => $request->dean_approved_at,
                'chair_approver' => $request->chairApprover ? [
                    'id' => $request->chairApprover->id,
                    'name' => $request->chairApprover->name,
                    'email' => $request->chairApprover->email,
                    'role' => $request->chairApprover->role,
                ] : null,
                'chair_approved_at' => $request->chair_approved_at,
                'all_approvals_received' => $request->all_approvals_received,
            ];
        })->values();

        return response()->json([
            'requests' => $transformedRequests
        ]);
    }

    /**
     * Get user's own event requests
     */
    public function myRequests()
    {
        $user = Auth::user();
        
        // For Faculty/Staff: Show their own submitted requests (all statuses)
        if (in_array($user->role, ['Faculty Member', 'Staff'])) {
            $requests = EventRequest::where('requested_by', $user->id)
                ->with([
                    'requester:id,name,email,role,department',
                    'reviewer:id,name,email,role',
                    'deanApprover:id,name,email,role',
                    'chairApprover:id,name,email,role'
                ])
                ->orderBy('created_at', 'desc')
                ->get();
        }
        // For Dean/Chairperson: Show requests they've approved or declined (not pending)
        else if (in_array($user->role, ['Dean', 'Chairperson'])) {
            $requests = EventRequest::with([
                    'requester:id,name,email,role,department',
                    'reviewer:id,name,email,role',
                    'deanApprover:id,name,email,role',
                    'chairApprover:id,name,email,role'
                ])
                ->where(function ($query) use ($user) {
                    if ($user->role === 'Dean') {
                        $query->where('dean_approved_by', $user->id);
                    } else if ($user->role === 'Chairperson') {
                        $query->where('chair_approved_by', $user->id);
                    }
                })
                ->orderBy('created_at', 'desc')
                ->get();
        }
        // For other roles: Return empty
        else {
            $requests = collect([]);
        }

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
        // Must have both approvals and no decline reasons
        $approvedRequests = EventRequest::where('requested_by', $user->id)
            ->where('status', 'approved')
            ->where('all_approvals_received', true)
            ->whereNull('dean_decline_reason')
            ->whereNull('chair_decline_reason')
            ->whereDoesntHave('event') // Requests that don't have an event created yet
            ->with([
                'deanApprover:id,name,email,role',
                'chairApprover:id,name,email,role'
            ])
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

    /**
     * Approve an event request (Dean/Chairperson individual approval)
     */
    public function approve(EventRequest $eventRequest)
    {
        $user = Auth::user();
        
        // Only Dean and Chairperson can approve
        if (!in_array($user->role, ['Dean', 'Chairperson'])) {
            return response()->json([
                'message' => 'Unauthorized. Only Dean and Chairperson can approve requests.'
            ], 403);
        }

        // Chairperson can only approve requests from their department
        if ($user->role === 'Chairperson' && $eventRequest->department !== $user->department) {
            return response()->json([
                'message' => 'Unauthorized. You can only approve requests from your department (' . $user->department . ').'
            ], 403);
        }

        // Check if already approved by this user
        if ($user->role === 'Dean' && $eventRequest->dean_approved_by && !$eventRequest->dean_decline_reason) {
            return response()->json([
                'message' => 'You have already approved this request.'
            ], 400);
        }
        if ($user->role === 'Chairperson' && $eventRequest->chair_approved_by && !$eventRequest->chair_decline_reason) {
            return response()->json([
                'message' => 'You have already approved this request.'
            ], 400);
        }

        // Record approval and clear any previous decline reason
        if ($user->role === 'Dean') {
            $eventRequest->dean_approved_by = $user->id;
            $eventRequest->dean_approved_at = now();
            $eventRequest->dean_decline_reason = null; // Clear decline reason if approving
        } elseif ($user->role === 'Chairperson') {
            $eventRequest->chair_approved_by = $user->id;
            $eventRequest->chair_approved_at = now();
            $eventRequest->chair_decline_reason = null; // Clear decline reason if approving
        }

        // Check if both have approved (no decline reasons)
        $deanApproved = $eventRequest->dean_approved_by && !$eventRequest->dean_decline_reason;
        $chairApproved = $eventRequest->chair_approved_by && !$eventRequest->chair_decline_reason;
        $allApproved = $deanApproved && $chairApproved;
        
        // Check if either has declined
        $anyDeclined = $eventRequest->dean_decline_reason || $eventRequest->chair_decline_reason;
        
        if ($allApproved) {
            $eventRequest->status = 'approved';
            $eventRequest->all_approvals_received = true;
            $eventRequest->decline_reason = null; // Clear general decline reason
            
            // Automatically create the event
            $this->createEventFromRequest($eventRequest);
        } elseif ($anyDeclined) {
            $eventRequest->status = 'declined';
            $eventRequest->all_approvals_received = false;
        } else {
            // Still pending - waiting for other approver
            $eventRequest->status = 'pending';
            $eventRequest->all_approvals_received = false;
        }

        $eventRequest->save();

        $message = $allApproved 
            ? 'Event request fully approved! The event has been automatically created and posted to the calendar.'
            : ($anyDeclined 
                ? 'Your approval has been recorded, but the request is declined by another approver.'
                : 'Your approval has been recorded. Waiting for other approver.');

        return response()->json([
            'message' => $message,
            'request' => $eventRequest->load(['requester', 'deanApprover', 'chairApprover', 'event']),
            'all_approvals_received' => $allApproved,
            'event_created' => $allApproved
        ]);
    }

    /**
     * Automatically create event from approved request
     */
    private function createEventFromRequest(EventRequest $eventRequest)
    {
        // Get the requester
        $requester = $eventRequest->requester;
        
        // Format time properly - ensure it's in H:i format
        $time = $eventRequest->time;
        if ($time instanceof \DateTime) {
            $time = $time->format('H:i');
        } elseif (is_string($time) && strlen($time) > 5) {
            // If it's a full datetime string, extract just the time part
            $time = date('H:i', strtotime($time));
        }
        
        // Create the event
        $event = \App\Models\Event::create([
            'title' => $eventRequest->title,
            'description' => $eventRequest->description,
            'location' => $eventRequest->location,
            'event_type' => $eventRequest->event_type,
            'date' => $eventRequest->date,
            'time' => $time,
            'school_year' => $eventRequest->school_year,
            'host_id' => $requester->id,
            'approved_request_id' => $eventRequest->id,
        ]);

        // Add invited members (Dean, Chairperson, and any originally invited members)
        $memberIds = [];
        
        // Add Dean and Chairperson as invited members
        if ($eventRequest->dean_approved_by) {
            $memberIds[] = $eventRequest->dean_approved_by;
        }
        if ($eventRequest->chair_approved_by) {
            $memberIds[] = $eventRequest->chair_approved_by;
        }
        
        // Add originally invited members from the request
        if ($eventRequest->member_ids && is_array($eventRequest->member_ids)) {
            $memberIds = array_merge($memberIds, $eventRequest->member_ids);
        }
        
        // Remove duplicates and the host
        $memberIds = array_unique($memberIds);
        $memberIds = array_filter($memberIds, fn($id) => $id != $requester->id);
        
        // Attach members with pending status
        if (!empty($memberIds)) {
            $memberData = collect($memberIds)->mapWithKeys(fn($id) => [$id => ['status' => 'pending']])->all();
            $event->members()->attach($memberData);
        }
        
        return $event;
    }

    /**
     * Decline an event request
     */
    public function decline(Request $request, EventRequest $eventRequest)
    {
        $user = Auth::user();
        
        // Only Dean and Chairperson can decline
        if (!in_array($user->role, ['Dean', 'Chairperson'])) {
            return response()->json([
                'message' => 'Unauthorized. Only Dean and Chairperson can decline requests.'
            ], 403);
        }

        // Chairperson can only decline requests from their department
        if ($user->role === 'Chairperson' && $eventRequest->department !== $user->department) {
            return response()->json([
                'message' => 'Unauthorized. You can only decline requests from your department (' . $user->department . ').'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Decline reason is required',
                'errors' => $validator->errors()
            ], 422);
        }

        // Record decline with separate reason fields
        // Set who declined it and their specific reason
        if ($user->role === 'Dean') {
            $eventRequest->dean_approved_by = $user->id;
            $eventRequest->dean_approved_at = now();
            $eventRequest->dean_decline_reason = $request->reason;
        } elseif ($user->role === 'Chairperson') {
            $eventRequest->chair_approved_by = $user->id;
            $eventRequest->chair_approved_at = now();
            $eventRequest->chair_decline_reason = $request->reason;
        }
        
        // Keep the old decline_reason field for backward compatibility (use the most recent one)
        $eventRequest->decline_reason = $request->reason;
        
        // Only set status to declined if at least one person has declined
        // This allows the other approver to still take action
        $eventRequest->status = 'declined';
        $eventRequest->all_approvals_received = false;

        $eventRequest->save();

        return response()->json([
            'message' => 'Event request declined',
            'request' => $eventRequest->load(['requester', 'deanApprover', 'chairApprover'])
        ]);
    }

    /**
     * Revert approval/decline action
     */
    public function revert(EventRequest $eventRequest)
    {
        $user = Auth::user();
        
        // Only Dean and Chairperson can revert
        if (!in_array($user->role, ['Dean', 'Chairperson'])) {
            return response()->json([
                'message' => 'Unauthorized. Only Dean and Chairperson can revert actions.'
            ], 403);
        }

        // Chairperson can only revert requests from their department
        if ($user->role === 'Chairperson' && $eventRequest->department !== $user->department) {
            return response()->json([
                'message' => 'Unauthorized. You can only revert requests from your department (' . $user->department . ').'
            ], 403);
        }

        // Check if user has approved/declined this request
        $hasActioned = false;
        if ($user->role === 'Dean' && $eventRequest->dean_approved_by === $user->id) {
            $hasActioned = true;
            $eventRequest->dean_approved_by = null;
            $eventRequest->dean_approved_at = null;
        } elseif ($user->role === 'Chairperson' && $eventRequest->chair_approved_by === $user->id) {
            $hasActioned = true;
            $eventRequest->chair_approved_by = null;
            $eventRequest->chair_approved_at = null;
        }

        if (!$hasActioned) {
            return response()->json([
                'message' => 'You have not approved or declined this request yet.'
            ], 400);
        }

        // Reset status to pending
        $eventRequest->status = 'pending';
        $eventRequest->all_approvals_received = false;
        $eventRequest->decline_reason = null;
        
        // Clear the specific decline reason for this user
        if ($user->role === 'Dean') {
            $eventRequest->dean_decline_reason = null;
        } elseif ($user->role === 'Chairperson') {
            $eventRequest->chair_decline_reason = null;
        }

        $eventRequest->save();

        return response()->json([
            'message' => 'Your action has been reverted. Request is now pending.',
            'request' => $eventRequest->load(['requester', 'deanApprover', 'chairApprover'])
        ]);
    }
}
