# Approved Requests Display Fix

## Summary
Fixed the issue where approved event requests were not showing up for Faculty/Staff after both Dean and Chairperson approved them. The approved requests now properly appear and can be used to create events.

## Problem
After both Dean and Chairperson approved a Faculty/Staff event request, the approved request was not showing up in the Dashboard or Add Event page. This prevented Faculty/Staff from creating the approved event.

## Root Causes

### 1. Backend Query Issue
The `hasApprovedRequests()` method was only checking:
- `status === 'approved'`
- `all_approvals_received === true`

But with the new independent approval/decline system, it also needed to check that neither approver had declined (no decline reasons).

### 2. Frontend State Passing Issue
The Dashboard's "Add Event" button for Faculty/Staff was not passing the `approvedRequests` state to the AddEvent page, so even if approved requests existed, they weren't being displayed.

## Solutions Implemented

### 1. Backend - EventRequestController.php

#### hasApprovedRequests() Method:
Added additional checks to ensure requests are truly approved:
```php
->whereNull('dean_decline_reason')
->whereNull('chair_decline_reason')
```

Now the query checks:
- Status is 'approved'
- All approvals received is true
- Dean has NOT declined (dean_decline_reason is null)
- Chairperson has NOT declined (chair_decline_reason is null)
- Event hasn't been created yet (whereDoesntHave('event'))

### 2. Frontend - Dashboard.jsx

#### Add Event Button:
Updated the Faculty/Staff "Add Event" button to pass `approvedRequests`:
```javascript
onClick={() => navigate('/add-event', { state: { selectedDate, approvedRequests } })}
```

This ensures approved requests are available in the AddEvent page.

## How It Works Now

### Complete Workflow:

1. **Faculty/Staff** submits event request
2. **Dean** approves (no decline reason)
3. **Chairperson** approves (no decline reason)
4. Backend sets:
   - `status = 'approved'`
   - `all_approvals_received = true`
   - Both decline reasons remain null

5. **Dashboard** calls `/event-requests/has-approved`
6. Backend returns approved requests that meet ALL criteria
7. **Dashboard** stores approved requests in state
8. **Faculty/Staff** clicks "Add Event" button
9. Approved requests are passed to AddEvent page
10. **AddEvent** page displays approved request selector
11. **Faculty/Staff** selects approved request
12. Event form auto-fills with request details
13. Dean and Chairperson are auto-invited as members
14. **Faculty/Staff** creates the event
15. Event appears on calendar for all invited members

## Edge Cases Handled

### Mixed Approval/Decline States:
- Dean approves, Chair declines → NOT in approved requests (chair_decline_reason exists)
- Dean declines, Chair approves → NOT in approved requests (dean_decline_reason exists)
- Both decline → NOT in approved requests (both decline reasons exist)
- Both approve → IN approved requests (no decline reasons)

### After Revert:
- If Dean declines then reverts → decline_reason cleared → can approve
- If Chair declines then reverts → decline_reason cleared → can approve
- Once both approve with no decline reasons → appears in approved requests

## Benefits

1. **Accurate Filtering**: Only truly approved requests (both approved, neither declined) appear
2. **State Consistency**: Approved requests properly passed through navigation
3. **User Experience**: Faculty/Staff can now see and use their approved requests
4. **Data Integrity**: Prevents creating events from partially approved/declined requests

## Files Modified
- `backend/app/Http/Controllers/EventRequestController.php`
- `frontend/src/pages/Dashboard.jsx`

## Testing Checklist
- [ ] Dean approves, Chair approves → Request appears in approved list
- [ ] Dean approves, Chair declines → Request does NOT appear
- [ ] Dean declines, Chair approves → Request does NOT appear
- [ ] Both decline → Request does NOT appear
- [ ] Dean declines, reverts, approves + Chair approves → Request appears
- [ ] Click "Add Event" from Dashboard → Approved requests visible
- [ ] Select approved request → Form auto-fills correctly
- [ ] Create event → Dean and Chair auto-invited

## Date
March 11, 2026
