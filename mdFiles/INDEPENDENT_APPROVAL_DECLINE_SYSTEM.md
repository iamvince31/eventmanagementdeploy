# Independent Approval/Decline System

## Summary
Fixed the approval system so Dean and Chairperson can independently approve or decline event requests without overriding each other's decisions. Both must approve for the event to be fully approved and posted to the calendar.

## Problem
Previously, when one approver declined a request, it would set the status to "declined" and prevent the other approver from taking any action. This created an issue where:
- If Dean declined, Chairperson couldn't approve
- If Chairperson declined, Dean couldn't approve
- One person's decision would override the other's ability to act

## Solution
Implemented independent approval/decline tracking where:
- Each approver's decision is stored separately
- Both approvers can take action regardless of what the other did
- Status is calculated based on both decisions
- Both must approve for the request to be fully approved
- If either declines, the request cannot proceed (but both can still change their decisions)

## Changes Made

### 1. Backend - EventRequestController.php

#### approve() Method:
- Clears decline reason when approving (allows changing from decline to approve)
- Checks if both have approved (no decline reasons) for full approval
- Checks if either has declined to set declined status
- Returns appropriate message based on mixed states
- Status logic:
  - Both approved (no decline reasons) → status: 'approved'
  - Either has declined → status: 'declined'
  - One approved, other pending → status: 'pending'

#### decline() Method:
- Records decline with separate reason fields
- Sets status to 'declined' but doesn't prevent other approver from acting
- Other approver can still approve or decline independently

### 2. Frontend - EventRequests.jsx

#### getStatusBadge():
Enhanced to show all possible states:
- **Fully Approved**: Both approved, no declines
- **Declined by Both**: Both declined
- **Dean Declined, Chair Approved**: Mixed state
- **Chair Declined, Dean Approved**: Mixed state
- **Dean Declined**: Only Dean declined
- **Chair Declined**: Only Chairperson declined
- **Dean Approved - Awaiting Chairperson**: Partial approval
- **Chairperson Approved - Awaiting Dean**: Partial approval
- **Pending Approval**: No actions yet

#### Approval Status Section:
- Shows each approver's action with appropriate icon (✓ or ✗)
- Green checkmark for approvals
- Red X for declines
- Color-coded background:
  - Green for all approvals
  - Orange for mixed states
- Warning message when at least one has declined

#### Action Buttons:
- Shows Approve/Decline buttons if no action taken
- Shows "Change My Decision" button if action already taken
- Allows approvers to switch between approve and decline freely

## User Experience

### Scenario 1: Both Approve
1. Dean approves → Status: "Dean Approved - Awaiting Chairperson"
2. Chairperson approves → Status: "Fully Approved"
3. Faculty can create event

### Scenario 2: One Approves, One Declines
1. Dean approves → Status: "Dean Approved - Awaiting Chairperson"
2. Chairperson declines → Status: "Chair Declined, Dean Approved"
3. Request cannot proceed, but Dean can still change decision
4. Chairperson can also change from decline to approve

### Scenario 3: Both Decline
1. Dean declines → Status: "Dean Declined"
2. Chairperson declines → Status: "Declined by Both"
3. Request cannot proceed
4. Either can change their decision

### Scenario 4: Changing Decisions
1. Dean declines with reason "Budget issues"
2. Later, budget is approved
3. Dean clicks "Change My Decision"
4. Dean clicks "Revert" to clear decline
5. Dean clicks "Approve"
6. Status updates to reflect new decision

## Benefits

1. **Independence**: Each approver can act without being blocked by the other
2. **Flexibility**: Approvers can change their decisions if circumstances change
3. **Transparency**: All states are clearly visible (approved, declined, mixed)
4. **Fairness**: Both approvers have equal power - neither can unilaterally block the other from acting
5. **Requirement Enforcement**: Both must still approve for event to proceed
6. **Clear Communication**: Faculty/Staff see exactly who approved/declined

## Approval Logic

```
For request to be FULLY APPROVED:
- Dean must approve (dean_approved_at exists AND dean_decline_reason is null)
- Chairperson must approve (chair_approved_at exists AND chair_decline_reason is null)

For request to be DECLINED:
- Either Dean has decline reason OR Chairperson has decline reason

For request to be PENDING:
- At least one hasn't taken action yet
- OR one approved but other hasn't acted
```

## Files Modified
- `backend/app/Http/Controllers/EventRequestController.php`
- `frontend/src/pages/EventRequests.jsx`

## Date
March 11, 2026
