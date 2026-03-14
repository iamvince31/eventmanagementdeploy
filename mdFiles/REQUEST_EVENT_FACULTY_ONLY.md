# Request Event Feature - Faculty Only

## Summary
Removed the "Request Event" feature from Coordinators and Chairpersons, making it exclusive to Faculty Members only. Coordinators, Chairpersons, Deans, and Admins can now create events directly without going through the request process.

## Changes Made

### Frontend Changes

#### 1. Dashboard.jsx - Simplified Role-Based Buttons
**Location:** `frontend/src/pages/Dashboard.jsx` (lines 741-764)

**Before:**
- Faculty Members: No button (disabled)
- Coordinators: Request Event button + Add Event (if approved)
- Chairpersons: Add Event + Request Event buttons
- Deans/Admins: Add Event button

**After:**
- Faculty Members: Request Event button ONLY
- Coordinators: Add Event button ONLY
- Chairpersons: Add Event button ONLY
- Deans/Admins: Add Event button ONLY

**Code:**
```javascript
{/* Role-based Event Creation Buttons */}
{user?.role === 'Faculty Member' ? (
  // Faculty Members can only request events
  <button
    onClick={() => navigate('/request-event', { state: { selectedDate } })}
    className="inline-flex items-center px-6 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 group bg-gradient-to-r from-green-700 via-green-700 to-green-800 text-white hover:from-green-800 hover:via-green-800 hover:to-green-900 focus:ring-green-600"
  >
    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    Request Event
  </button>
) : user?.role === 'Coordinator' || user?.role === 'Chairperson' || user?.role === 'Dean' || user?.role === 'Admin' ? (
  // Coordinators, Chairpersons, Deans, and Admins can create events directly
  <button
    onClick={() => navigate('/add-event', { state: { selectedDate } })}
    className="inline-flex items-center px-6 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 group bg-gradient-to-r from-green-700 via-green-700 to-green-800 text-white hover:from-green-800 hover:via-green-800 hover:to-green-900 focus:ring-green-600"
  >
    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
    Add Event
  </button>
) : null}
```

#### 2. Dashboard.jsx - Empty State Button
**Location:** `frontend/src/pages/Dashboard.jsx` (lines 1533-1548)

**Updated Logic:**
- Faculty Members: "Request Your First Event" → navigates to `/request-event`
- All other roles: "Create Your First Event" → navigates to `/add-event`

### Backend Changes

#### 1. EventRequestController.php - Faculty Only Restriction
**Location:** `backend/app/Http/Controllers/EventRequestController.php` (lines 40-62)

**Before:**
```php
// Only Coordinators and Chairpersons can submit event requests
if (!in_array($user->role, ['Coordinator', 'Chairperson'])) {
    return response()->json([
        'message' => 'Unauthorized. Only Coordinators and Chairpersons can submit event requests.'
    ], 403);
}

// Complex logic for different roles...
```

**After:**
```php
// Only Faculty Members can submit event requests
if ($user->role !== 'Faculty Member') {
    return response()->json([
        'message' => 'Unauthorized. Only Faculty Members can submit event requests.'
    ], 403);
}

// Faculty Members need approval from Dean and/or Chairperson (whoever is available)
$requiredApprovers = [];

$dean = User::where('role', 'Dean')->first();
$chair = User::where('role', 'Chairperson')->first();

if ($dean) {
    $requiredApprovers[] = $dean->id;
}
if ($chair) {
    $requiredApprovers[] = $chair->id;
}

if (empty($requiredApprovers)) {
    return response()->json([
        'message' => 'No approvers available. Please contact an administrator.'
    ], 400);
}
```

#### 2. EventController.php - Updated Error Message
**Location:** `backend/app/Http/Controllers/EventController.php` (line 140-144)

**Before:**
```php
if ($user->role === 'Faculty Member') {
    return response()->json([
        'error' => 'Faculty Members cannot create events.'
    ], 403);
}
```

**After:**
```php
if ($user->role === 'Faculty Member') {
    return response()->json([
        'error' => 'Faculty Members cannot create events directly. Please submit an event request.'
    ], 403);
}
```

## Feature Behavior

### Faculty Members
- **Can:** Submit event requests ONLY
- **Cannot:** Create events directly
- **Workflow:** Faculty → Request Event → Dean/Chairperson Review → Approval/Rejection
- **Approvers:** Dean and/or Chairperson (whoever is available)

### Coordinators
- **Can:** Create events directly
- **Cannot:** Submit event requests (no longer needed)
- **Workflow:** Direct event creation
- **No approval needed:** Can create events immediately

### Chairpersons
- **Can:** Create events directly
- **Cannot:** Submit event requests (no longer needed)
- **Workflow:** Direct event creation
- **No approval needed:** Can create events immediately

### Deans & Admins
- **Can:** Create events directly
- **Cannot:** Submit event requests (no longer needed)
- **Workflow:** Direct event creation
- **No approval needed:** Can create events immediately

## Rationale

This change simplifies the event creation workflow:

1. **Faculty Members** are the only ones who need approval, so they use the request system
2. **All other roles** (Coordinator, Chairperson, Dean, Admin) have sufficient authority to create events directly
3. Removes unnecessary complexity of the request/approval workflow for higher-level roles
4. Streamlines the UI by showing only one button per role

## Impact on Existing Data

- Existing event requests from Coordinators/Chairpersons remain in the database
- These can still be reviewed and approved/rejected by Deans/Chairpersons
- New requests can only be created by Faculty Members going forward

## Testing Recommendations

1. **Faculty Member Login:**
   - ✓ Verify "Request Event" button appears
   - ✓ Can submit event requests
   - ✓ Cannot access "Add Event" directly
   - ✓ Receives proper error if trying to create event via API

2. **Coordinator Login:**
   - ✓ Verify "Add Event" button appears (no Request Event)
   - ✓ Can create events directly
   - ✓ Cannot submit event requests (blocked by backend)

3. **Chairperson Login:**
   - ✓ Verify "Add Event" button appears (no Request Event)
   - ✓ Can create events directly
   - ✓ Can review Faculty event requests

4. **Dean Login:**
   - ✓ Verify "Add Event" button appears
   - ✓ Can create events directly
   - ✓ Can review Faculty event requests

## Files Modified
- `frontend/src/pages/Dashboard.jsx`
- `backend/app/Http/Controllers/EventRequestController.php`
- `backend/app/Http/Controllers/EventController.php`

## Related Files (No Changes)
- `frontend/src/pages/RequestEvent.jsx` - Still accessible but only Faculty can use it
- `frontend/src/pages/AddEvent.jsx` - Accessible to all roles except Faculty
- `backend/app/Models/EventRequest.php` - No changes needed

## Date
March 4, 2026
