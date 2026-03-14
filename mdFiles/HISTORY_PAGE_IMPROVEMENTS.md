# History Page Improvements

## Overview
Updated the History page to remove the status filter and add a "Meeting Requests" tab for Faculty/Staff to track their meeting approval requests.

## Changes Made

### 1. Frontend Changes (`frontend/src/pages/History.jsx`)

#### Removed Status Filter
- Removed `filterStatus` state variable
- Removed the entire "Status" filter section (All, Pending, Accepted, Rejected buttons)
- Simplified the `fetchActivities` function to only use `filterType`

#### Added Meeting Requests Tab
- Added new state: `approvalRequests` to store meeting approval requests
- Added `fetchApprovalRequests()` function to fetch user's approval requests
- Changed "Requests" button to "Meeting Requests" for Faculty/Staff
- Added conditional rendering to show either:
  - Meeting approval requests (when "Meeting Requests" is selected)
  - Regular activity history (for all other filters)

#### Meeting Requests Display
Shows for each request:
- Title and description
- Status badge (Pending/Approved/Rejected)
- Date, time, and location
- Approval status details showing:
  - Each approver's name and role
  - Their individual approval status (Pending/Approved/Rejected)

### 2. Backend Changes

#### EventController (`backend/app/Http/Controllers/EventController.php`)
- Added new method: `getMyApprovalRequests()`
- Fetches all EventApproval records created by the authenticated user
- Includes related data: host, approvers with their details
- Orders by creation date (newest first)

#### Routes (`backend/routes/api.php`)
- Added new route: `GET /event-approvals/my-requests`
- Protected by `auth:sanctum` middleware
- Maps to `EventController@getMyApprovalRequests`

## User Experience

### For Faculty/Staff:
1. Navigate to /history
2. Click "Meeting Requests" tab
3. See all their submitted meeting requests with:
   - Current status (Pending/Approved/Rejected)
   - Approval progress from Dean and Chairperson
   - Individual approver statuses
4. No status filter clutter - cleaner interface

### For Other Roles:
1. Navigate to /history
2. See regular activity filters (All, Hosted, Invitations, Approvals)
3. No status filter - simplified interface
4. No "Meeting Requests" tab (not applicable)

## Approval Status Display

Each meeting request shows:
- **Overall Status**: Badge showing Pending/Approved/Rejected
- **Approver Details**: List of approvers with:
  - Name and role (e.g., "John Doe (Dean)")
  - Individual status with visual indicators:
    - ⏳ Pending (yellow badge)
    - ✓ Approved (green badge)
    - ✗ Rejected (red badge)

## Technical Details

### API Endpoint
```
GET /api/event-approvals/my-requests
Authorization: Bearer {token}

Response:
{
  "approvals": [
    {
      "id": 1,
      "title": "Meeting Title",
      "description": "Meeting description",
      "location": "Room 101",
      "event_type": "meeting",
      "date": "2026-03-15",
      "time": "14:00:00",
      "status": "pending",
      "host_id": 5,
      "created_at": "2026-03-10T10:00:00",
      "host": {...},
      "approvers": [
        {
          "id": 1,
          "status": "pending",
          "approver": {
            "id": 2,
            "name": "Dean Name",
            "role": "Dean"
          }
        },
        {
          "id": 2,
          "status": "approved",
          "approver": {
            "id": 3,
            "name": "Chair Name",
            "role": "Chairperson"
          }
        }
      ]
    }
  ]
}
```

### Benefits
1. **Cleaner Interface**: Removed unnecessary status filter
2. **Better Tracking**: Faculty/Staff can see detailed approval progress
3. **Transparency**: Shows which approvers have acted and which are pending
4. **Role-Specific**: Only shows relevant tabs based on user role