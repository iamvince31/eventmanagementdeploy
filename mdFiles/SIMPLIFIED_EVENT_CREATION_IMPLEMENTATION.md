# Simplified Event Creation - Request Feature Disabled

## Changes Made

### 1. Dashboard.jsx - Simplified Button Logic

Replace lines 727-840 (the entire button section) with this simplified version:

```jsx
            {/* COMMENTED OUT - Request Event Feature Disabled */}
            {/* Event Requests Link - Only for Dean, Chairperson, and Admin */}
            {/* {['Admin', 'Dean', 'Chairperson'].includes(user?.role) && (
              <button
                onClick={() => navigate('/event-requests')}
                className="inline-flex items-center px-6 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 group bg-white text-green-700 border-2 border-green-700 hover:bg-green-50 focus:ring-green-600"
              >
                <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Event Requests
              </button>
            )} */}
            
            {/* Simplified: All roles except Faculty Member can create events directly */}
            {user?.role !== 'Faculty Member' && (
              <button
                onClick={() => navigate('/add-event', { state: { selectedDate } })}
                className="inline-flex items-center px-6 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 group bg-gradient-to-r from-green-700 via-green-700 to-green-800 text-white hover:from-green-800 hover:via-green-800 hover:to-green-900 focus:ring-green-600"
              >
                <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Event
              </button>
            )}
```

### 2. Backend EventController.php - Remove Role Restrictions

In `backend/app/Http/Controllers/EventController.php`, update the `store()` method around line 90-110:

**COMMENT OUT** these lines:
```php
// COMMENTED OUT - Allow all roles to create events
/*
// Role-based restrictions for event creation (allow Coordinators with approved requests)
if (!in_array($user->role, ['Admin', 'Dean', 'Chairperson', 'Coordinator'])) {
    return response()->json([
        'error' => 'Unauthorized. Only Admin, Dean, Chairperson, and Coordinator (with approved requests) can create events.'
    ], 403);
}

// Coordinators must have an approved request
if ($user->role === 'Coordinator' && !$approvedRequest) {
    return response()->json([
        'error' => 'Coordinators must have an approved event request to create events.'
    ], 403);
}
*/

// Simplified: Only Faculty Members cannot create events
if ($user->role === 'Faculty Member') {
    return response()->json([
        'error' => 'Faculty Members cannot create events.'
    ], 403);
}
```

### 3. App.jsx - Update Route Protection

In `frontend/src/App.jsx`, find the `/add-event` route and update it:

```jsx
{/* Add Event - All roles except Faculty Member */}
<Route
  path="/add-event"
  element={
    <RoleProtectedRoute allowedRoles={['Admin', 'Dean', 'Chairperson', 'Coordinator']}>
      <AddEvent />
    </RoleProtectedRoute>
  }
/>
```

### 4. EventForm.jsx - Comment Out Approved Request Logic

In `frontend/src/components/EventForm.jsx`, comment out the approved request selector section (around lines 300-370):

```jsx
{/* COMMENTED OUT - Request Event Feature Disabled */}
{/* Approved Request Selector - Only show if there are approved requests */}
{/* {approvedRequests.length > 0 && !editingEvent && (
  <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 shadow-sm">
    ... entire approved request selector section ...
  </div>
)} */}
```

## Summary of Changes

### What's Disabled:
- ❌ Request Event button
- ❌ Event Requests page link
- ❌ Approved request workflow
- ❌ Role-based restrictions (except Faculty Member)
- ❌ Coordinator approval requirements

### What's Enabled:
- ✅ All roles (except Faculty Member) can create events directly
- ✅ Simple "Add Event" button for everyone
- ✅ No approval process needed
- ✅ Direct event creation

### Roles That Can Create Events:
- ✅ Admin
- ✅ Dean
- ✅ Chairperson
- ✅ Coordinator
- ❌ Faculty Member (cannot create events)

## Testing

1. Login as Coordinator
2. Go to Dashboard
3. Click "Add Event" button (should work directly)
4. Create an event
5. Event should appear on calendar immediately

## To Re-enable Request Feature Later

Simply uncomment all the sections marked with:
```
/* COMMENTED OUT - Request Event Feature Disabled */
```

And remove the simplified button logic.

## Date: March 4, 2026
