# Dashboard Button Logic Implementation

## Summary
Implemented smart button logic in the Dashboard to show "Add Event" button only after event requests are approved, and changed Request Event button to green theme.

## Changes Made

### 1. Backend API Endpoint

**New Endpoint:** `GET /api/event-requests/has-approved`

**EventRequestController.php - hasApprovedRequests() method:**
```php
public function hasApprovedRequests()
{
    $user = Auth::user();
    
    // Get approved requests that haven't been used to create an event yet
    $approvedRequests = EventRequest::where('requested_by', $user->id)
        ->where('status', 'approved')
        ->whereDoesntHave('event') // Requests that don't have an event created yet
        ->get();

    return response()->json([
        'has_approved_requests' => $approvedRequests->count() > 0,
        'approved_requests' => $approvedRequests
    ]);
}
```

**Purpose:** Checks if the current user has any approved event requests that haven't been used to create an event yet.

### 2. Model Relationship

**EventRequest.php - Added event() relationship:**
```php
public function event()
{
    return $this->hasOne(Event::class, 'approved_request_id');
}
```

This allows us to check if an approved request has already been used to create an event.

### 3. Frontend Dashboard Logic

**Dashboard.jsx - New State:**
```javascript
const [hasApprovedRequests, setHasApprovedRequests] = useState(false);
const [approvedRequests, setApprovedRequests] = useState([]);
```

**New Function:**
```javascript
const checkApprovedRequests = async () => {
  try {
    const response = await api.get('/event-requests/has-approved');
    setHasApprovedRequests(response.data.has_approved_requests);
    setApprovedRequests(response.data.approved_requests || []);
  } catch (error) {
    console.error('Error checking approved requests:', error);
    setHasApprovedRequests(false);
    setApprovedRequests([]);
  }
};
```

Called on component mount to check for approved requests.

### 4. Button Display Logic

#### Faculty Members
- **No buttons shown** - Cannot create or request events

#### Coordinators
- **Request Event button** (green) - Always shown
- **Add Event button** (green) - Only shown if they have approved requests
  - Shows badge with count of approved requests
  - Passes approved requests to AddEvent page

```javascript
<button>Request Event</button>
{hasApprovedRequests && (
  <button>
    Add Event
    <span>{approvedRequests.length}</span>
  </button>
)}
```

#### Chairpersons
- **Add Event button** (green, primary) - Always shown for regular events
- **Request Event button** (green outline, secondary) - For special events requiring Dean approval

```javascript
<button>Add Event</button>
<button>Request Event</button>
```

#### Deans & Admins
- **Add Event button** (green) - Always shown, no restrictions

```javascript
<button>Add Event</button>
```

### 5. Color Theme Updates

All buttons now use consistent green theme:

**Primary buttons (solid):**
- `bg-gradient-to-r from-green-700 via-green-700 to-green-800`
- `hover:from-green-800 hover:via-green-800 hover:to-green-900`

**Secondary buttons (outline):**
- `bg-white text-green-700 border-2 border-green-700`
- `hover:bg-green-50`

**Request Event icon changed:**
- From: Plus icon (Add)
- To: Document icon (Request)

## Workflow Examples

### Coordinator Workflow:
1. **Initial state:** Only "Request Event" button visible
2. **After submitting request:** Request goes to Dean & Chairperson
3. **After approval:** "Add Event" button appears with badge showing count
4. **Click Add Event:** Can create event linked to approved request
5. **After creating event:** That approved request is consumed, button updates

### Chairperson Workflow:
1. **Regular events:** Click "Add Event" directly
2. **Special events:** Click "Request Event" → Dean approves → Create event

### Dean/Admin Workflow:
1. **Any event:** Click "Add Event" directly

## API Routes Updated

```php
// backend/routes/api.php
Route::get('/event-requests/has-approved', [EventRequestController::class, 'hasApprovedRequests']);
```

## Database Schema

The `approved_request_id` column in the `events` table (added in previous migration) is used to:
1. Link events to their approved requests
2. Track which requests have been used
3. Prevent reusing the same approved request

## Benefits

1. **Clear workflow:** Users know exactly when they can create events
2. **Visual feedback:** Badge shows number of approved requests
3. **Prevents confusion:** Add Event only appears when appropriate
4. **Consistent theme:** All buttons use green color scheme
5. **Role-appropriate:** Each role sees buttons relevant to their permissions

## Testing Checklist

- [ ] Coordinator sees only "Request Event" initially
- [ ] After approval, Coordinator sees both buttons
- [ ] Badge shows correct count of approved requests
- [ ] Chairperson sees both buttons always
- [ ] Dean/Admin sees only "Add Event"
- [ ] Faculty Member sees no buttons
- [ ] All buttons use green theme
- [ ] Request Event icon is document icon
- [ ] Add Event icon is plus icon

## Date
March 2, 2026
