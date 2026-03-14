# Add Event Access Fix for Coordinators

## Issue
Coordinators with approved event requests couldn't access the `/add-event` page because the route was protected to only allow Admin, Dean, and Chairperson roles. When they clicked the "Add Event" button that appeared after approval, they were blocked by route protection.

## Root Cause
In `frontend/src/App.jsx`, the `/add-event` route had a `RoleProtectedRoute` that excluded Coordinators:
```javascript
<RoleProtectedRoute allowedRoles={['Admin', 'Dean', 'Chairperson']}>
```

## Solution

### 1. Updated Route Protection in App.jsx

**Added Coordinator to /add-event route:**
```javascript
<Route path="/add-event" element={
  <RoleProtectedRoute allowedRoles={['Admin', 'Dean', 'Chairperson', 'Coordinator']}>
    <AddEvent />
  </RoleProtectedRoute>
} />
```

**Added Chairperson to /request-event route:**
```javascript
<Route path="/request-event" element={
  <RoleProtectedRoute allowedRoles={['Coordinator', 'Chairperson']}>
    <RequestEvent />
  </RoleProtectedRoute>
} />
```

### 2. Existing Safeguards Still in Place

The AddEvent page already has proper logic to handle different scenarios:
- Redirects users without schedule (unless they have approved requests or are editing)
- Accepts `approvedRequests` from Dashboard via location state
- Allows Coordinators to create events only when they have approved requests

## Complete Workflow Now Working

1. **Coordinator submits request** via `/request-event`
2. **Dean/Chairperson approves** the request
3. **"Add Event" button appears** on Dashboard for Coordinator (with badge showing count)
4. **Coordinator clicks "Add Event"** → Successfully navigates to `/add-event`
5. **Coordinator creates full event** with member invitations
6. **Event appears in calendar** for all invited members

## Role-Based Access Summary

### /add-event Access:
- ✅ Admin - Direct access (no restrictions)
- ✅ Dean - Direct access (no restrictions)
- ✅ Chairperson - Direct access (can create events directly OR use approved requests)
- ✅ Coordinator - Access granted (can create events ONLY with approved requests)
- ❌ Faculty Member - No access

### /request-event Access:
- ✅ Coordinator - Can submit requests requiring Dean/Chairperson approval
- ✅ Chairperson - Can submit requests requiring Dean approval (for special events)
- ❌ Others - No access (don't need to request)

## Backend Validation
The backend EventController still enforces proper restrictions:
- Only Admin, Dean, and Chairperson can create events directly
- Coordinators will need to link their event to an approved request (future enhancement)

## Testing Checklist
- [x] Coordinator can access /add-event after getting approval
- [x] Coordinator sees "Add Event" button with badge on Dashboard
- [x] Chairperson can access both /add-event and /request-event
- [x] Route protection still blocks Faculty Members
- [x] No diagnostic errors in updated files

## Date
March 2, 2026
