# Event Requests System - Complete Implementation

## Overview
Implemented a comprehensive Event Requests system with role-based views and approval workflow with revert capability.

## Features Implemented

### 1. Event Requests Button Added to Dashboard
- **Faculty/Staff**: See "Event Requests" button to track their submitted requests
- **Dean/Chairperson**: See "Event Requests" button to review and approve/decline requests
- Button styled with blue theme to distinguish from event creation buttons

### 2. Role-Based Views

#### Faculty/Staff View
- See only their own submitted event requests
- Track approval status in real-time:
  - "Pending Approval" - Waiting for Dean and Chairperson
  - "Dean Approved - Awaiting Chairperson"
  - "Chairperson Approved - Awaiting Dean"
  - "Fully Approved" - Both approvals received
  - "Declined" - Request was declined
- View decline reason if request was declined
- See approval progress with timestamps
- No action buttons (read-only status tracking)

#### Dean/Chairperson View
- See all event requests from Faculty/Staff
- Three action states per request:
  1. **Pending** - Can Approve or Decline
  2. **Actioned** - Can Revert their action
  3. **Waiting** - Other approver needs to act
- Approve/Decline buttons with confirmation modals
- Revert button to undo accidental approvals/declines

### 3. Approval Workflow

#### Approve Action
- Dean or Chairperson clicks "Approve"
- Confirmation modal appears
- Records approval with timestamp
- If both Dean AND Chairperson approve → Status becomes "Fully Approved"
- Faculty/Staff can then create the event from Add Event page

#### Decline Action
- Dean or Chairperson clicks "Decline"
- Modal prompts for decline reason (required)
- Records decline with reason and timestamp
- Request status becomes "Declined"
- Faculty/Staff sees the decline reason

#### Revert Action
- Available to Dean/Chairperson who have already approved or declined
- Confirmation modal appears
- Removes their approval/decline
- Resets request to "Pending" status
- Clears decline reason if applicable
- Allows correction of accidental actions

### 4. Database Schema Updates

#### New Columns Added to `event_requests`:
- `requires_dean_approval` (boolean) - Flag indicating Dean approval needed
- `requires_chair_approval` (boolean) - Flag indicating Chairperson approval needed
- `decline_reason` (text, nullable) - Reason for declining request

#### Existing Columns Used:
- `dean_approved_by` - User ID of Dean who approved
- `dean_approved_at` - Timestamp of Dean approval
- `chair_approved_by` - User ID of Chairperson who approved
- `chair_approved_at` - Timestamp of Chairperson approval
- `all_approvals_received` - Boolean flag when both approvals received
- `status` - Overall status (pending/approved/declined)

### 5. API Endpoints

#### New Endpoints:
- `POST /event-requests/{id}/approve` - Approve a request
- `POST /event-requests/{id}/decline` - Decline a request (requires reason)
- `POST /event-requests/{id}/revert` - Revert approval/decline action

#### Updated Endpoints:
- `GET /event-requests` - Now returns different data based on role:
  - Faculty/Staff: Their own requests
  - Dean/Chairperson: All requests

### 6. Frontend Components

#### EventRequests Page (`frontend/src/pages/EventRequests.jsx`)
- Completely rewritten with role-based rendering
- Three confirmation modals:
  1. Approve confirmation
  2. Decline with reason input
  3. Revert confirmation
- Real-time status badges
- Approval progress indicators
- Responsive design with loading skeletons

#### Dashboard Updates (`frontend/src/pages/Dashboard.jsx`)
- Added "Event Requests" button for Faculty/Staff (always visible)
- Added "Event Requests" button for Dean/Chairperson (always visible)
- Blue-themed button to distinguish from green event buttons

### 7. Routing Updates (`frontend/src/App.jsx`)
- Updated `/event-requests` route to allow Faculty/Staff access
- Changed from `['Admin', 'Dean', 'Chairperson']` to `['Admin', 'Dean', 'Chairperson', 'Faculty Member', 'Staff']`

## User Workflows

### Faculty/Staff Workflow:
1. Create event request from Add Event page (when selecting "Event" type)
2. Click "Event Requests" button on Dashboard
3. See their request with status
4. Track approval progress
5. Once fully approved, create event from Add Event page

### Dean/Chairperson Workflow:
1. Click "Event Requests" button on Dashboard
2. See all pending requests
3. Review request details and justification
4. Click "Approve" or "Decline"
5. If declined, provide reason
6. Can revert action if made by mistake
7. Request disappears from pending list once both approvers act

## Key Features

### Revert Capability
- Prevents permanent mistakes
- Dean can revert their own approval/decline
- Chairperson can revert their own approval/decline
- Cannot revert other approver's actions
- Resets request to pending state
- Clears decline reason

### Status Tracking
- Real-time status updates
- Clear visual indicators (color-coded badges)
- Approval progress shown to requesters
- Timestamps for all actions

### Validation
- Decline reason required
- Cannot approve twice
- Cannot decline twice
- Can only revert own actions
- Proper authorization checks

## Files Modified/Created

### Frontend:
- `frontend/src/pages/EventRequests.jsx` - Complete rewrite
- `frontend/src/pages/Dashboard.jsx` - Added Event Requests buttons
- `frontend/src/App.jsx` - Updated routing

### Backend:
- `backend/app/Http/Controllers/EventRequestController.php` - Added approve/decline/revert methods, updated index
- `backend/app/Models/EventRequest.php` - Added decline_reason to fillable
- `backend/routes/api.php` - Added new routes
- `backend/database/migrations/2026_03_11_000002_add_approval_flags_to_event_requests.php` - New migration
- `backend/database/migrations/2026_03_11_000003_add_decline_reason_to_event_requests.php` - New migration

## Testing Checklist
- [x] Faculty/Staff can see Event Requests button
- [x] Faculty/Staff see only their own requests
- [x] Dean/Chairperson can see Event Requests button
- [x] Dean/Chairperson see all requests
- [x] Approve action works and records timestamp
- [x] Decline action requires reason
- [x] Revert action resets to pending
- [x] Status badges show correct states
- [x] Approval progress visible to Faculty/Staff
- [x] Decline reason visible to Faculty/Staff
- [x] Cannot approve/decline twice
- [x] Can only revert own actions
- [x] Migrations run successfully
- [x] No diagnostic errors

## Status
✅ **COMPLETE** - Event Requests system fully implemented with role-based views, approval workflow, and revert capability
