# Meeting Requests History Feature

## Overview
Updated the History page to show meeting approval requests for both Faculty/Staff (who submit them) and Dean/Chairperson (who approve/decline them).

## User Roles & Views

### Faculty/Staff View
**Tab**: "Meeting Requests"
**Shows**: All their submitted meeting requests
**Statuses**: Pending, Approved, Rejected
**Details Shown**:
- Meeting title, description, date, time, location
- Overall status badge
- Individual approval status from Dean and Chairperson
- Each approver's decision (Pending/Approved/Rejected)

### Dean/Chairperson View
**Tab**: "Meeting Requests"
**Shows**: Only requests they have approved or declined (NOT pending ones)
**Statuses**: Approved, Rejected only
**Details Shown**:
- Meeting title, description, date, time, location
- Requester information (name and role)
- Overall status badge
- Individual approval status from all approvers
- Each approver's decision

## Implementation Details

### Backend Changes

#### EventController (`backend/app/Http/Controllers/EventController.php`)

```php
public function getMyApprovalRequests(Request $request)
{
    $user = $request->user();
    
    // For Faculty/Staff: Show their own submitted requests (all statuses)
    if (in_array($user->role, ['Faculty Member', 'Staff'])) {
        $approvals = EventApproval::with(['host', 'approvers.approver'])
            ->where('host_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();
    }
    // For Dean/Chairperson: Show requests they've approved or rejected (not pending)
    else if (in_array($user->role, ['Dean', 'Chairperson'])) {
        $approvals = EventApproval::with(['host', 'approvers.approver'])
            ->whereHas('approvers', function ($query) use ($user) {
                $query->where('approver_id', $user->id)
                      ->whereIn('status', ['approved', 'rejected']);
            })
            ->orderBy('created_at', 'desc')
            ->get();
    }
    // For other roles: Return empty
    else {
        $approvals = collect([]);
    }
    
    return response()->json(['approvals' => $approvals]);
}
```

**Key Logic**:
- Faculty/Staff: `where('host_id', $user->id)` - Shows all their requests
- Dean/Chairperson: `whereHas('approvers')` with status filter - Shows only approved/rejected

### Frontend Changes

#### History Page (`frontend/src/pages/History.jsx`)

**Tab Visibility**:
- Now shows "Meeting Requests" tab for Faculty, Staff, Dean, and Chairperson
- Other roles don't see this tab

**Conditional Content**:
- Faculty/Staff see all their requests with full approval tracking
- Dean/Chairperson see requests they've acted on with requester info

**Visual Indicators**:
- Status badges (Pending/Approved/Rejected)
- Requester information for Dean/Chairperson
- Individual approver status with checkmarks/crosses

## User Experience

### Faculty/Staff Workflow:
1. Submit meeting via /add-event
2. Meeting goes to approval queue
3. Navigate to /history → "Meeting Requests" tab
4. See their request with "Pending Approval" status
5. View which approvers have approved/pending
6. When fully approved, status changes to "Approved"
7. Meeting is automatically created

### Dean/Chairperson Workflow:
1. Receive meeting approval request (via notifications or event requests page)
2. Approve or decline the request
3. Navigate to /history → "Meeting Requests" tab
4. See all requests they've approved or declined
5. View requester information and meeting details
6. Track approval status from other approvers

## Benefits

1. **Transparency**: Faculty/Staff can track approval progress in real-time
2. **Accountability**: Dean/Chairperson can review their approval history
3. **Centralized View**: All meeting requests in one place
4. **Role-Specific**: Each role sees relevant information
5. **Status Tracking**: Clear visual indicators for approval status

## Example Scenarios

### Scenario 1: Faculty Member Submits Meeting
1. Faculty creates meeting → Goes to approval
2. Dean approves → Faculty sees "Dean: ✓ Approved, Chairperson: Pending"
3. Chairperson approves → Status changes to "Approved"
4. Meeting is created automatically

### Scenario 2: Dean Reviews History
1. Dean navigates to /history → "Meeting Requests"
2. Sees list of all meetings they've approved/declined
3. Can see who requested each meeting
4. Can review meeting details and their decision

### Scenario 3: Chairperson Declines Meeting
1. Chairperson declines a meeting request
2. Request appears in their "Meeting Requests" history
3. Faculty member sees "Rejected" status
4. Meeting is not created

## Technical Notes

- Uses existing EventApproval model and relationships
- Leverages approvers relationship for filtering
- No new database tables required
- Efficient queries with eager loading
- Role-based access control at API level