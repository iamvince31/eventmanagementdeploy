# Flexible Event Request Approval System

## Overview

Implemented a flexible approval system where coordinators need approval from available higher-ups (Dean and/or Chairperson). The system automatically detects which approvers are available and requires approval from all of them before the request is fully approved.

## Role-Based Rules

### Faculty Member
- ❌ Cannot add events
- ❌ Cannot request events
- ✅ View only access

### Coordinator
- ❌ Cannot add events directly
- ✅ Must request events
- ✅ Needs approval from available Dean and/or Chairperson
- ✅ Can add events ONLY after all required approvals are received

### Chairperson
- ✅ Can add events directly (no approval needed for regular events)
- ✅ Can request events (for special events requiring Dean approval)
- ✅ Needs Dean approval only when requesting special events

### Dean
- ✅ Can add events directly (no restrictions)
- ✅ No approval needed

### Admin
- ✅ Can add events directly (no restrictions)
- ✅ No approval needed

## Database Changes

### New Migration: `2026_03_02_020000_add_flexible_approval_to_event_requests.php`

Added fields to `event_requests` table:
- `dean_approved_by` - Foreign key to users (Dean who approved)
- `dean_approved_at` - Timestamp of Dean approval
- `chair_approved_by` - Foreign key to users (Chairperson who approved)
- `chair_approved_at` - Timestamp of Chairperson approval
- `required_approvers` - JSON array of user IDs who need to approve
- `all_approvals_received` - Boolean flag indicating if all approvals are received

## Backend Implementation

### EventRequest Model Updates

**New Relationships:**
```php
public function deanApprover()
public function chairApprover()
```

**New Method:**
```php
public function checkAllApprovalsReceived()
```
Checks if all required approvers have approved the request.

### EventRequestController Updates

#### 1. `store()` Method - Flexible Approver Detection
- Automatically detects available Dean and Chairperson
- For Coordinators: Requires approval from both Dean AND Chairperson (if both exist)
- For Coordinators: If only Dean exists, requires Dean approval only
- For Coordinators: If only Chairperson exists, requires Chairperson approval only
- For Chairpersons: Requires Dean approval only
- Returns error if no approvers are available

#### 2. `index()` Method - Enhanced Request Listing
- Shows approval status for each request
- Indicates which approvers have approved
- Shows `can_approve` flag (if current user is a required approver)
- Shows `has_approved` flag (if current user has already approved)

#### 3. `review()` Method - Individual Approval Tracking
- Validates that user is a required approver
- Prevents duplicate approvals from same user
- Records individual approvals (Dean or Chairperson)
- Automatically marks request as fully approved when all required approvals are received
- Returns different messages based on approval status

#### 4. `hasApprovedRequests()` Method - Fully Approved Only
- Only returns requests where `all_approvals_received = true`
- Includes approver information for display

## Frontend Implementation

### Dashboard.jsx Updates

**Approval Notification Banner:**
- Displays prominently at top of page (below navbar)
- Shows for Coordinators with approved requests
- Lists all approved requests with approver names
- Shows who approved (Dean, Chairperson, or both)
- Provides quick "Add Event Now" button
- Green gradient design matching app theme

**Button Logic:**
- Coordinators: "Request Event" always visible, "Add Event" only when `hasApprovedRequests = true`
- Chairpersons: Both "Add Event" and "Request Event" visible
- Deans/Admins: Only "Add Event" visible
- Faculty: No buttons (view only)

### EventRequests.jsx Updates

**Enhanced Request Display:**
- Shows approval status section for pending requests
- Displays individual approvals with timestamps
- Shows approver names (Dean and/or Chairperson)
- Color-coded status indicators:
  - Green: Approved
  - Blue: User has approved, waiting for others
  - Gray: Waiting for approvals

**Action Buttons:**
- Only shows Approve/Reject buttons if user is a required approver
- Hides buttons if user has already approved
- Shows "You have approved" message after approval
- Shows "Waiting for other approvers" message

**Fully Approved Display:**
- Special section for fully approved requests
- Lists all approvers with checkmarks
- Shows "The requestor can now create this event" message

## Approval Flow Examples

### Example 1: Coordinator with Both Dean and Chairperson Available
1. Coordinator submits event request
2. System detects Dean (ID: 1) and Chairperson (ID: 2) are available
3. Sets `required_approvers = [1, 2]`
4. Dean approves → `dean_approved_by = 1`, `dean_approved_at = now()`
5. Status still "pending", message: "Your approval has been recorded. Waiting for other approvers."
6. Chairperson approves → `chair_approved_by = 2`, `chair_approved_at = now()`
7. System checks: both required approvers have approved
8. Sets `status = 'approved'`, `all_approvals_received = true`
9. Message: "Event request fully approved! The requestor can now create the event."
10. Coordinator sees notification banner and "Add Event" button

### Example 2: Coordinator with Only Dean Available
1. Coordinator submits event request
2. System detects only Dean (ID: 1) is available
3. Sets `required_approvers = [1]`
4. Dean approves → `dean_approved_by = 1`, `dean_approved_at = now()`
5. System checks: all required approvers (just Dean) have approved
6. Sets `status = 'approved'`, `all_approvals_received = true`
7. Message: "Event request fully approved! The requestor can now create the event."
8. Coordinator can immediately add event

### Example 3: Coordinator with Only Chairperson Available
1. Coordinator submits event request
2. System detects only Chairperson (ID: 2) is available
3. Sets `required_approvers = [2]`
4. Chairperson approves → `chair_approved_by = 2`, `chair_approved_at = now()`
5. System checks: all required approvers (just Chairperson) have approved
6. Sets `status = 'approved'`, `all_approvals_received = true`
7. Coordinator can immediately add event

### Example 4: Rejection by Any Approver
1. Coordinator submits event request
2. Dean or Chairperson rejects with reason
3. Sets `status = 'rejected'`, `rejection_reason = reason`
4. Request is immediately rejected (no further approvals needed)
5. Coordinator cannot add event

## Notification System

### Dashboard Notification Banner
- **Visibility**: Only shown to Coordinators with approved requests
- **Design**: Green gradient with white text, prominent placement
- **Content**:
  - Celebration emoji and "Event Request(s) Approved!" heading
  - Count of approved requests
  - List of each approved request with title
  - Names of approvers (Dean and/or Chairperson)
  - "Add Event Now" button for quick access

### EventRequests Page Notifications
- **Approval Status Section**: Shows which approvers have approved
- **Individual Approval Messages**: "Approved by Dean [Name] on [Date]"
- **Waiting Messages**: "Waiting for other approvers"
- **User Approval Confirmation**: "You have approved this request"
- **Fully Approved Section**: Comprehensive approval summary

## Testing Checklist

- [x] Migration runs successfully
- [x] Model relationships work correctly
- [x] Flexible approver detection works
- [x] Individual approvals are tracked
- [x] All approvals received flag updates correctly
- [x] Notification banner displays for coordinators
- [x] Approval status shows in EventRequests page
- [x] Buttons show/hide based on approval status
- [x] No diagnostic errors

## API Endpoints

### POST `/api/event-requests`
- Creates new event request
- Automatically detects required approvers
- Returns list of required approver names

### GET `/api/event-requests`
- Lists all event requests
- Includes approval status and approver information
- Shows `can_approve` and `has_approved` flags

### POST `/api/event-requests/{id}/review`
- Records individual approval
- Checks if all approvals received
- Updates status to 'approved' when complete
- Returns appropriate message

### GET `/api/event-requests/has-approved`
- Returns only fully approved requests
- Includes approver information
- Used by Dashboard to show notification

## Benefits

1. **Flexibility**: Adapts to available approvers automatically
2. **Transparency**: Clear visibility of who has approved
3. **User-Friendly**: Prominent notifications when requests are approved
4. **Scalable**: Easy to add more approval levels if needed
5. **Robust**: Prevents duplicate approvals and validates approvers
6. **Informative**: Shows approval progress in real-time

## Status: ✅ COMPLETE

The flexible approval system is fully implemented and tested. Coordinators now receive clear notifications when their requests are approved, and the system automatically adapts to available approvers.
