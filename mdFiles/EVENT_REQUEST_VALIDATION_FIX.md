# Event Request Validation Fix

## Summary
Fixed the event request system to properly separate event requests from hierarchy approvals and implement the correct approval workflow.

## Problem
The `/event-requests` page was showing both coordinator event requests AND hierarchy approvals mixed together, causing confusion. The validation flow was not clear.

## Solution Implemented

### 1. Clarified Event Request Flow

**Coordinators:**
- Submit event request via "Request Event" button
- Request reviewed by Dean AND Chairperson
- After approval → Can create the actual event

**Chairpersons:**
- Can create events directly (no approval needed for regular events)
- Submit event request ONLY when:
  - Inviting a Dean
  - Special event requiring approval
- Request reviewed by Dean only
- After approval → Can create the actual event

**Deans & Admins:**
- Can create events directly without any approval

### 2. Database Changes

**New Migration:** `2026_03_02_010000_add_approved_request_id_to_events_table.php`
- Added `approved_request_id` column to `events` table
- Links created events back to their approved requests
- Allows tracking which events were created from approved requests

### 3. Backend Changes

**EventRequestController.php:**

**store() method:**
- Now allows both Coordinators AND Chairpersons to submit requests
- Removed `budget` and `resources` fields (not needed)
- Returns appropriate message based on role

**index() method:**
- Now returns ONLY event requests (coordinator/chairperson requests)
- Removed hierarchy approvals from this endpoint
- Cleaner separation of concerns

**Validation:**
```php
// Only Coordinators and Chairpersons can submit
if (!in_array($user->role, ['Coordinator', 'Chairperson'])) {
    return response()->json([
        'message' => 'Unauthorized. Only Coordinators and Chairpersons can submit event requests.'
    ], 403);
}
```

### 4. Frontend Changes

**EventRequests.jsx:**
- Removed hierarchy approval handling
- Now shows only event requests
- Simplified UI - no more type badges
- Single approval/reject flow
- Updated description: "Review event requests from Coordinators and Chairpersons"

**RequestEvent.jsx:**
- Already updated to green theme
- Budget and resources fields removed
- Form validation updated

### 5. Current Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    EVENT CREATION FLOW                       │
└─────────────────────────────────────────────────────────────┘

COORDINATOR:
1. Click "Request Event" button
2. Fill out request form
3. Submit → Status: Pending
4. Dean & Chairperson review
5. If approved → "Add Event" button appears
6. Create actual event with approved_request_id

CHAIRPERSON:
Regular Events:
- Click "Add Event" directly
- Create event (no approval needed)

Special Events (Dean invited or special approval needed):
1. Click "Request Event" button
2. Fill out request form
3. Submit → Status: Pending
4. Dean reviews
5. If approved → "Add Event" button appears
6. Create actual event with approved_request_id

DEAN & ADMIN:
- Click "Add Event" directly
- Create event (no approval needed)
```

### 6. Hierarchy Approvals (Separate System)

Hierarchy approvals are a DIFFERENT system:
- Triggered when lower roles invite higher roles to events
- Handled through EventApproval model
- NOT shown in /event-requests page
- Processed during event creation, not before

## Files Modified

### Backend:
1. `backend/database/migrations/2026_03_02_010000_add_approved_request_id_to_events_table.php` (NEW)
2. `backend/app/Http/Controllers/EventRequestController.php`

### Frontend:
1. `frontend/src/pages/EventRequests.jsx`
2. `frontend/src/pages/RequestEvent.jsx` (already updated in previous task)

## Testing Checklist

- [ ] Coordinator can submit event request
- [ ] Chairperson can submit event request
- [ ] Dean/Admin cannot submit event request (should use Add Event directly)
- [ ] Dean & Chairperson can see event requests in /event-requests
- [ ] Approve/Reject buttons work correctly
- [ ] Rejection reason is required and saved
- [ ] After approval, requestor can create event
- [ ] Created event links back to approved request

## Next Steps (To Be Implemented)

1. **Dashboard Button Logic:**
   - Show "Request Event" for Coordinators (always)
   - Show "Request Event" for Chairpersons (when needed)
   - Show "Add Event" for Deans/Admins (always)
   - Show "Add Event" for Coordinators/Chairpersons (only after approval)

2. **Approved Request Tracking:**
   - API endpoint to check if user has approved requests
   - Frontend logic to show/hide "Add Event" button based on approved requests
   - Link event creation to approved request ID

3. **Notifications:**
   - Notify requestor when request is approved/rejected
   - Notify reviewers when new request is submitted

## Date
March 2, 2026
