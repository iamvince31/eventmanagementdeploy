# Faculty/Staff Meeting Approval System

## Overview
Implemented role-based restrictions for event/meeting creation where Faculty Members and Staff can only create meetings (not events), and these meetings require approval from Dean and Chairperson before being created.

## Changes Made

### 1. Frontend Changes

#### EventForm Component (`frontend/src/components/EventForm.jsx`)
- **Initial State**: Faculty/Staff users default to 'meeting' type
- **Conditional UI**: 
  - Faculty/Staff see an informational box instead of radio buttons
  - Only "Meeting" type is available for Faculty/Staff
  - Dean, CEIT Official, Chairperson, Admin can choose between Event and Meeting
- **Approval Notice**: Added blue informational banner for Faculty/Staff explaining their meeting requires approval

### 2. Backend Changes

#### EventController (`backend/app/Http/Controllers/EventController.php`)
- **Role Validation**: 
  - Faculty/Staff cannot create events (only meetings)
  - Faculty/Staff meetings are sent for approval workflow
  - Higher roles (Dean, CEIT Official, Chairperson, Admin) create directly
- **Approval Logic**: 
  - Faculty/Staff meetings require approval from Dean and Chairperson
  - Uses existing EventApprovalWorkflow system
- **Updated Methods**:
  - `store()`: Added role-based logic and approval routing
  - `createPendingApproval()`: Added event_type to approval data

#### EventApproval Model (`backend/app/Models/EventApproval.php`)
- Added `event_type` to fillable fields

#### EventApprovalWorkflow Service (`backend/app/Services/EventApprovalWorkflow.php`)
- **createPendingEvent()**: Now stores event_type in approval record
- **finalizeEvent()**: Creates event with correct event_type when approved

### 3. Database Changes

#### Migration: `2026_03_09_000002_add_event_type_to_event_approvals_table.php`
- Added `event_type` enum column to `event_approvals` table
- Default value: 'event'
- Values: 'event', 'meeting'

## User Experience by Role

### Faculty Member / Staff
1. Navigate to /add-event
2. See blue notice: "Meeting Approval Required"
3. Can only create meetings (no event option shown)
4. Fill in meeting details and invite members
5. Submit meeting
6. Meeting goes to Dean and Chairperson for approval
7. Receive notification when approved/rejected

### Dean / CEIT Official / Chairperson / Admin
1. Navigate to /add-event
2. Can choose between "Event" or "Meeting" via radio buttons
3. Fill in details and invite members
4. Submit directly - no approval needed
5. Event/Meeting is created immediately

### Approval Flow for Faculty/Staff Meetings
1. Faculty/Staff submits meeting
2. System creates EventApproval record with status 'pending'
3. Dean and Chairperson receive approval request
4. Both must approve for meeting to be created
5. If approved: Meeting is automatically created
6. If rejected: Meeting is not created, Faculty/Staff is notified

## Technical Details

### Approval Requirements
- **Approvers**: Dean AND Chairperson (both must approve)
- **Approval Type**: Sequential or parallel (both must approve)
- **Notification**: Approvers are notified of pending approval
- **Auto-creation**: Meeting is automatically created when fully approved

### Event Type Handling
- Event type is stored in both `events` and `event_approvals` tables
- Event type is included in approval workflow data
- Event type is preserved when approval is finalized

### Color Coding (Calendar)
- **Faculty/Staff Hosted Meeting**: Brown (amber-800)
- **Invited to Faculty/Staff Meeting**: Yellow
- **Higher Role Hosted Event**: Red
- **Invited to Event**: Green

## Security & Validation
- Backend validates that Faculty/Staff can only submit meetings
- Frontend prevents Faculty/Staff from selecting "Event" type
- Approval workflow ensures proper authorization
- Event type is validated on both frontend and backend