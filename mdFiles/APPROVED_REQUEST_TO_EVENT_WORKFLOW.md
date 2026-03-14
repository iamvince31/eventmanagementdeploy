# Approved Request to Event Workflow Implementation

## Summary
Implemented complete workflow for Coordinators to create events from approved requests, including automatic form pre-filling, approver auto-invitation, and proper request-event linking.

## Changes Made

### 1. Frontend - EventForm Component

**Added Approved Request Support:**
```javascript
// New prop and state
approvedRequests = []
const [selectedApprovedRequest, setSelectedApprovedRequest] = useState(null);
```

**Auto-Selection Logic:**
- If only 1 approved request → Auto-select and pre-fill form
- If multiple approved requests → Show selector UI

**Pre-Fill Functionality:**
```javascript
const handleApprovedRequestSelect = (request) => {
  setSelectedApprovedRequest(request);
  setTitle(request.title);
  setDescription(request.description || '');
  setLocation(request.location || '');
  setDate(request.date);
  setTime(request.time);
  
  // Auto-invite the approvers (Dean/Chairperson who approved)
  const approverIds = [];
  if (request.dean_approver_id) approverIds.push(request.dean_approver_id);
  if (request.chair_approver_id) approverIds.push(request.chair_approver_id);
  setSelectedMembers(approverIds);
};
```

**Hierarchy Validation Skip:**
- Skips hierarchy validation when creating from approved request
- Allows Coordinators to invite Dean/Chairperson without restrictions

**Form Submission:**
- Includes `approved_request_id` in formData
- Links the created event to the original request

**UI Enhancements:**
- Green banner showing approved request details
- Single request: Auto-selected with details displayed
- Multiple requests: Clickable cards to select which one to use
- Clear visual feedback on selection

### 2. Backend - EventController

**Updated store() Method:**

**Approved Request Validation:**
```php
if ($approvedRequestId) {
    $approvedRequest = \App\Models\EventRequest::where('id', $approvedRequestId)
        ->where('requested_by', $user->id)
        ->where('status', 'approved')
        ->whereDoesntHave('event') // Not already used
        ->first();
        
    if (!$approvedRequest) {
        return response()->json([
            'error' => 'Invalid or already used approved request.'
        ], 403);
    }
}
```

**Role-Based Access:**
- Added 'Coordinator' to allowed roles
- Coordinators MUST have an approved request to create events
- Other roles (Admin, Dean, Chairperson) can create directly

**Hierarchy Bypass:**
```php
// Skip hierarchy validation if this is from an approved request
if (!$approvedRequest) {
    $hierarchyService = new HierarchyService();
    $validationResult = $hierarchyService->validateInvitations($user, $memberIds);
    // ... validation logic
}
```

**Event Creation:**
```php
$event = Event::create([
    'title' => $request->title,
    'description' => $request->description,
    'location' => $request->location,
    'date' => $request->date,
    'time' => $request->time,
    'host_id' => $user->id,
    'approved_request_id' => $approvedRequestId, // Link to request
]);
```

### 3. Backend - Event Model

**Added to Fillable:**
```php
protected $fillable = [
    // ... existing fields
    'approved_request_id',
];
```

## Complete Workflow

### Step 1: Request Submission
Coordinator submits event request via `/request-event`:
- Title, description, location, date, time
- Goes to Dean and/or Chairperson for approval

### Step 2: Approval
Dean/Chairperson reviews and approves the request:
- Request status changes to 'approved'
- Dean/Chairperson ID stored in request

### Step 3: Dashboard Notification
"Add Event" button appears on Coordinator's dashboard:
- Shows badge with count of approved requests
- Passes `approvedRequests` array to AddEvent page

### Step 4: Event Creation
Coordinator clicks "Add Event" → Navigates to `/add-event`:
- **Green banner shows approved request details**
- **Form automatically pre-filled** with request data
- **Dean/Chairperson auto-invited** as members
- Coordinator can add more members
- Coordinator can upload files/images
- **No hierarchy restrictions** (already approved)

### Step 5: Event Finalization
Coordinator submits the form:
- Event created with `approved_request_id` link
- Request marked as "used" (has event relationship)
- Event appears in calendar for all invited members
- "Add Event" button disappears (no more approved requests)

## Key Features

### 1. Automatic Pre-Filling
- Title, description, location, date, time from request
- Saves Coordinator time and ensures consistency

### 2. Approver Auto-Invitation
- Dean and/or Chairperson who approved automatically invited
- Ensures approvers are included in the event
- Can be removed if needed

### 3. Request-Event Linking
- `approved_request_id` column links event to request
- Prevents reusing the same approved request
- Maintains audit trail

### 4. Hierarchy Bypass
- No hierarchy validation for approved requests
- Coordinator can invite anyone (already approved by Dean)
- Streamlines the process

### 5. Smart UI
- Single request: Auto-select and show details
- Multiple requests: Show selector with cards
- Clear visual feedback
- Green theme for approved status

## Database Schema

The `approved_request_id` column in `events` table:
- Foreign key to `event_requests.id`
- Nullable (not all events come from requests)
- Used to track which request was used
- Prevents duplicate usage via `whereDoesntHave('event')`

## API Validation

### Request Validation:
```php
'approved_request_id' => 'nullable|exists:event_requests,id'
```

### Business Logic Validation:
1. Request must belong to current user
2. Request must be approved
3. Request must not already have an event
4. Coordinators must provide approved_request_id

## Benefits

1. **Seamless Workflow**: Request → Approval → Event creation
2. **Data Consistency**: Pre-filled form ensures accuracy
3. **Automatic Inclusion**: Approvers automatically invited
4. **No Redundancy**: Can't reuse same approved request
5. **Audit Trail**: Clear link between request and event
6. **User-Friendly**: Minimal clicks, maximum automation

## Testing Checklist

- [x] Coordinator can access /add-event with approved request
- [x] Form pre-fills with request data
- [x] Dean/Chairperson auto-invited as members
- [x] Event links to approved request via approved_request_id
- [x] Hierarchy validation skipped for approved requests
- [x] Can't reuse same approved request twice
- [x] Single request auto-selects
- [x] Multiple requests show selector
- [x] Event appears in calendar after creation
- [x] "Add Event" button disappears after using all requests

## Date
March 2, 2026
