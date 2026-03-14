# Request History Feature Added to History Page

## Summary
Added a "Request History" tab to the /history page that shows EventRequests with role-based filtering. This is a read-only feature for viewing the history of event requests.

## Changes Made

### Backend Changes

#### 1. EventRequestController.php - Updated `myRequests()` method
- **Faculty/Staff**: Shows ALL their submitted requests (pending, approved, rejected)
- **Dean**: Shows ONLY requests they have approved or declined (not pending ones)
- **Chairperson**: Shows ONLY requests they have approved or declined (not pending ones)
- **Other roles**: Returns empty array

```php
// For Faculty/Staff: Show their own submitted requests (all statuses)
if (in_array($user->role, ['Faculty Member', 'Staff'])) {
    $requests = EventRequest::where('requested_by', $user->id)
        ->with(['requester', 'reviewer', 'deanApprover', 'chairApprover'])
        ->orderBy('created_at', 'desc')
        ->get();
}
// For Dean/Chairperson: Show requests they've approved or declined (not pending)
else if (in_array($user->role, ['Dean', 'Chairperson'])) {
    $requests = EventRequest::with(['requester', 'reviewer', 'deanApprover', 'chairApprover'])
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
```

### Frontend Changes

#### 1. History.jsx - Added Request History Tab
- **Added** `eventRequests` state variable
- **Added** `fetchEventRequests()` function that calls `/event-requests/my-requests`
- **Added** "Request History" filter button (visible to Faculty/Staff/Dean/Chairperson)
- **Added** complete Request History rendering section with:
  - Request details (title, description, date, time, location)
  - Status badges (Pending, Approved, Rejected)
  - Requester information (for Dean/Chairperson view)
  - Detailed approval status for both Dean and Chairperson
  - Rejection reason display
  - "All approvals received" notice

## UI Features

### Request History Display
- **Card-based layout** with hover effects
- **Status badges** with color coding:
  - Yellow: Pending
  - Green: Approved  
  - Red: Rejected
- **Approval status grid** showing Dean and Chairperson approval status
- **Requester information** (shown to Dean/Chairperson)
- **Rejection reason** display when applicable
- **Success notice** when all approvals are received

### Role-Based Views

#### Faculty/Staff View:
- See ALL their submitted requests
- View approval status from both Dean and Chairperson
- See rejection reasons if applicable
- Get notified when all approvals are received

#### Dean/Chairperson View:
- See ONLY requests they have acted on (approved/declined)
- View requester information
- See the other approver's status
- View request details and dates

## API Endpoint

### `GET /event-requests/my-requests`
- **Authentication**: Required (sanctum middleware)
- **Roles**: Faculty Member, Staff, Dean, Chairperson
- **Response**: Array of EventRequest objects with relationships loaded

## Testing Results

Based on current database:
- **Faculty Member (Keith Coner)**: 4 requests (3 pending, 1 approved by Dean)
- **Dean (Gabriel Ian)**: 1 request he approved
- **Chairperson**: None (no Chairperson in system yet)

## Database Structure Used

### EventRequest Model Relationships:
- `requester` - User who submitted the request
- `reviewer` - User who reviewed (if any)
- `deanApprover` - Dean who approved (if any)
- `chairApprover` - Chairperson who approved (if any)

### Key Fields:
- `requested_by` - ID of requesting user
- `dean_approved_by` - ID of Dean who approved
- `chair_approved_by` - ID of Chairperson who approved
- `dean_approved_at` - Timestamp of Dean approval
- `chair_approved_at` - Timestamp of Chairperson approval
- `status` - Overall status (pending, approved, rejected)
- `rejection_reason` - Reason for rejection
- `all_approvals_received` - Boolean flag

## Files Modified

### Backend:
- `backend/app/Http/Controllers/EventRequestController.php`

### Frontend:
- `frontend/src/pages/History.jsx`

### Test Scripts Created:
- `backend/test-my-requests-endpoint.php`

## Usage

1. **Faculty/Staff**:
   - Go to /history
   - Click "Request History" tab
   - View all submitted requests with approval status

2. **Dean/Chairperson**:
   - Go to /history  
   - Click "Request History" tab
   - View requests they have approved or declined

## Notes

- This is a **read-only** feature for viewing history
- Does NOT provide approval/rejection functionality (use /event-requests for that)
- Complements the existing /event-requests page which is for taking actions
- Uses the existing EventRequest system (not the EventApproval system)
- Fully responsive design with mobile-friendly layout