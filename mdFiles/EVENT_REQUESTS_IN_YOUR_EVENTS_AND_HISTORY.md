# Event Requests in "Your Events" and History

## Overview

Enhanced the system to display event requests in the "Your Events" popup and ensure all approved/rejected event requests appear in the History page with detailed information about approvals.

## Changes Made

### 1. Dashboard.jsx - "Your Events" Modal Enhancement

**New State:**
- Added `myEventRequests` state to store user's event requests

**New Function:**
- `fetchMyEventRequests()` - Fetches user's event requests from `/api/event-requests/my-requests`

**Modal Updates:**
- Changed modal title from "Your Events" to "Your Events & Requests"
- Increased modal width to `max-w-4xl` for better layout
- Added two sections:
  1. **Event Requests Section** (shown first if any exist)
     - Blue-themed cards with left border
     - Shows request title, date, time, location, submission date
     - Status badges: Green (Approved), Red (Rejected), Yellow (Pending)
     - Displays rejection reason if rejected
  2. **Hosted Events Section**
     - Green-themed cards with left border
     - Shows all events hosted by the user
     - View Details button for each event

**Empty State:**
- Shows appropriate message based on user role
- Coordinators see "Request Your First Event" button
- Other roles see "Create Your First Event" button
- Faculty members see no button (view only)

### 2. ActivityController.php - Enhanced History Tracking

**Updated Event Request Activities:**

#### For Coordinators/Chairpersons:
- `event_request_submitted` now includes:
  - Dean approver information (`dean_approver`, `dean_approved_at`)
  - Chairperson approver information (`chair_approver`, `chair_approved_at`)
  - All approvals received flag
  - Full approval status

#### For Dean/Chairperson/Admin:
- **New Activity Type: `event_request_approved`**
  - Tracks individual approvals by Dean or Chairperson
  - Shows requester information
  - Displays approval role (Dean or Chairperson)
  - Includes approval timestamp

- **New Activity Type: `event_request_rejected`**
  - Tracks rejections by any approver
  - Shows requester information
  - Displays rejection reason
  - Includes rejection timestamp

### 3. History.jsx - New Activity Type Support

**New Activity Icons:**
- `event_request_approved` - Emerald green checkmark circle
- `event_request_rejected` - Red X circle

**New Activity Titles:**
- `event_request_approved` → "Approved Request: [title]"
- `event_request_rejected` → "Rejected Request: [title]"

**Enhanced Detail Modals:**

#### event_request_submitted (Updated):
- Shows justification
- Displays Dean approval with name and date (if approved)
- Displays Chairperson approval with name and date (if approved)
- Shows rejection reason (if rejected)
- Green banner when all approvals received

#### event_request_approved (New):
- Green-themed card
- Shows requester name
- Displays approval role (Dean/Chairperson)
- Shows approval timestamp

#### event_request_rejected (New):
- Red-themed card
- Shows requester name
- Displays rejection reason
- Shows rejection timestamp

## User Experience Flow

### For Coordinators:

1. **Submit Request:**
   - Navigate to Request Event page
   - Fill out event details
   - Submit request

2. **View in "Your Events":**
   - Click "Your Events" card on Dashboard
   - See request in "Event Requests" section
   - Status shows as "Pending" (yellow badge)

3. **Track in History:**
   - Navigate to History page
   - See "Requested: [Event Title]" activity
   - Click to view details including justification

4. **Receive Approvals:**
   - Dean approves → Activity added to History
   - Chairperson approves → Activity added to History
   - "Your Events" modal updates to show "Approved" (green badge)
   - Dashboard shows green notification banner

5. **All Approvals Received:**
   - "Add Event" button appears on Dashboard
   - Green banner shows who approved
   - History shows complete approval information

6. **If Rejected:**
   - "Your Events" modal shows "Rejected" (red badge)
   - Rejection reason displayed
   - History shows rejection activity with reason

### For Dean/Chairperson:

1. **Review Request:**
   - Navigate to Event Requests page
   - See pending requests
   - Click Approve or Reject

2. **Approval Tracked:**
   - History shows "Approved Request: [Event Title]"
   - Green card with requester name
   - Shows approval role and timestamp

3. **Rejection Tracked:**
   - History shows "Rejected Request: [Event Title]"
   - Red card with rejection reason
   - Shows rejection timestamp

## API Endpoints Used

### GET `/api/event-requests/my-requests`
- Returns all event requests submitted by the authenticated user
- Includes reviewer, dean approver, and chair approver information
- Used by Dashboard to populate "Your Events" modal

### Existing Endpoints Enhanced:
- `/api/activities` - Now includes new activity types for approvals/rejections

## Visual Design

### "Your Events" Modal:
- **Event Requests**: Blue left border, blue icon
- **Hosted Events**: Green left border, green icon
- **Status Badges**:
  - Approved: Green background, green text
  - Rejected: Red background, red text
  - Pending: Yellow background, yellow text

### History Page:
- **event_request_approved**: Emerald green icon and theme
- **event_request_rejected**: Red icon and theme
- **Detail cards**: Matching color themes with clear information hierarchy

## Benefits

1. **Complete Visibility**: Users can see all their event requests in one place
2. **Status Tracking**: Clear visual indicators for request status
3. **Comprehensive History**: All approval/rejection activities tracked
4. **Detailed Information**: Full approval chain visible with timestamps
5. **Better UX**: Separate sections for requests vs hosted events
6. **Role-Appropriate**: Different views for coordinators vs approvers

## Testing Checklist

- [x] Event requests appear in "Your Events" modal
- [x] Status badges show correct colors
- [x] Rejection reasons display properly
- [x] Approved requests show in History
- [x] Rejected requests show in History
- [x] Individual approvals tracked (Dean and Chairperson)
- [x] Detail modals show complete information
- [x] Empty state shows appropriate message
- [x] No diagnostic errors

## Status: ✅ COMPLETE

Event requests now appear in the "Your Events" popup with clear status indicators, and all approved/rejected requests are tracked in the History page with detailed approval information.
