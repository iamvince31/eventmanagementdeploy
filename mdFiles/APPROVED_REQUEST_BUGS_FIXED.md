# Approved Request to Event - Bug Fixes

## Issues Found

### 1. Date Parsing Error (500 Internal Server Error)
**Error:** `Failed to parse time string (2026-03-03T00:00:00.000000Z 23:51) at position 28 (2): Double time specification`

**Root Cause:** 
The `request.date` field from the backend was coming as a full timestamp (`2026-03-03T00:00:00.000000Z`) instead of just a date string (`2026-03-03`). When this was set directly to the date field and combined with the time field, it created an invalid datetime string.

**Fix:**
```javascript
// Parse date properly - handle both date strings and timestamps
const requestDate = request.date.includes('T') 
  ? request.date.split('T')[0]  // Extract YYYY-MM-DD from timestamp
  : request.date;
setDate(requestDate);
```

### 2. Wrong Column Names for Approvers
**Error:** Approvers were not being auto-invited

**Root Cause:**
The code was looking for `dean_approver_id` and `chair_approver_id`, but the actual database columns are `dean_approved_by` and `chair_approved_by` (from the flexible approval migration).

**Fix:**
```javascript
// Auto-invite the approvers (Dean/Chairperson who approved)
const approverIds = [];
if (request.dean_approved_by) approverIds.push(request.dean_approved_by);
if (request.chair_approved_by) approverIds.push(request.chair_approved_by);
setSelectedMembers(approverIds);
```

### 3. Auto-Selection Dependency Issue
**Issue:** The auto-selection effect might not trigger properly due to missing dependency

**Fix:**
```javascript
useEffect(() => {
  // ... existing logic
}, [editingEvent, approvedRequests, selectedApprovedRequest]); // Added selectedApprovedRequest
```

## Debugging Improvements

### Added Console Logging
To help diagnose issues in production:

```javascript
// Log auto-selection
console.log('Auto-selecting approved request:', request);

// Log approver invitation
console.log('Auto-inviting approvers:', approverIds);

// Log approved_request_id being sent
console.log('Adding approved_request_id:', selectedApprovedRequest.id);

// Log errors
console.error('Error creating event:', err);
console.error('Error response:', err.response?.data);
```

## Testing Checklist

After these fixes, verify:

- [x] Date field shows correct format (YYYY-MM-DD) when approved request is selected
- [x] Time field shows correct time from request
- [x] Dean and/or Chairperson who approved are auto-invited as members
- [x] Form submission includes approved_request_id
- [x] No 500 errors on event creation
- [x] No 403 errors when Coordinator has valid approved request
- [x] Console logs show correct data flow
- [x] Event successfully created and linked to request

## Database Schema Reference

### event_requests table columns:
- `dean_approved_by` (foreignId to users)
- `dean_approved_at` (timestamp)
- `chair_approved_by` (foreignId to users)
- `chair_approved_at` (timestamp)
- `required_approvers` (JSON array)
- `all_approvals_received` (boolean)

### events table columns:
- `approved_request_id` (foreignId to event_requests)

## Related Files Modified

1. `frontend/src/components/EventForm.jsx`
   - Fixed date parsing
   - Fixed approver column names
   - Added console logging
   - Fixed useEffect dependencies

2. No backend changes needed (already correct)

## Date
March 2, 2026
