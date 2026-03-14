# Separate Decline Reasons Feature

## Summary
Implemented separate decline reason fields for Dean and Chairperson so each approver's specific decline reason is displayed independently on the event requests interface.

## Problem
Previously, there was only one `decline_reason` field, so if both Dean and Chairperson declined a request, only the most recent decline reason would be stored and displayed. Users couldn't see both reasons.

## Solution
Added separate fields for Dean and Chairperson decline reasons:
- `dean_decline_reason` - Stores Dean's specific decline reason
- `chair_decline_reason` - Stores Chairperson's specific decline reason
- Kept `decline_reason` for backward compatibility

## Changes Made

### 1. Database Migration
- **File**: `backend/database/migrations/2026_03_11_000006_add_separate_decline_reasons.php`
- Added two new columns to `event_requests` table:
  - `dean_decline_reason` (text, nullable)
  - `chair_decline_reason` (text, nullable)

### 2. Backend - EventRequest Model
- **File**: `backend/app/Models/EventRequest.php`
- Added `dean_decline_reason` and `chair_decline_reason` to `$fillable` array

### 3. Backend - EventRequestController
- **File**: `backend/app/Http/Controllers/EventRequestController.php`

#### decline() Method:
- When Dean declines: Sets `dean_decline_reason` with their specific reason
- When Chairperson declines: Sets `chair_decline_reason` with their specific reason
- Keeps `decline_reason` field updated for backward compatibility

#### revert() Method:
- Clears the specific decline reason when user reverts their action
- Dean revert: Clears `dean_decline_reason`
- Chairperson revert: Clears `chair_decline_reason`

#### index() Method:
- Returns both `dean_decline_reason` and `chair_decline_reason` in API response

### 4. Frontend - EventRequests.jsx
- **File**: `frontend/src/pages/EventRequests.jsx`

#### Enhanced Decline Display:
- Shows Dean's decline reason separately with their name
- Shows Chairperson's decline reason separately with their name
- Each reason is displayed in its own section with:
  - Decline icon
  - Approver name and role
  - Reason text in a highlighted box
- Fallback to old `decline_reason` field if no specific reasons exist

## User Experience

### Scenario 1: Dean Declines
```
Request Declined
✗ Declined by Dr. John Smith (Dean)
  "Budget constraints for this semester"
```

### Scenario 2: Chairperson Declines
```
Request Declined
✗ Declined by Dr. Jane Doe (Chairperson)
  "Conflicts with department schedule"
```

### Scenario 3: Both Decline (Different Reasons)
```
Request Declined
✗ Declined by Dr. John Smith (Dean)
  "Budget constraints for this semester"

✗ Declined by Dr. Jane Doe (Chairperson)
  "Conflicts with department schedule"
```

### Scenario 4: One Approves, One Declines
- If Dean approves but Chairperson declines:
  - Status shows "Declined"
  - Only Chairperson's decline reason is shown
  - Dean's approval is still visible in approval status section

## Benefits

1. **Transparency**: Faculty/Staff can see exactly why each approver declined
2. **Clarity**: No confusion about who declined and why
3. **Accountability**: Each approver's decision is clearly documented
4. **Better Communication**: Specific feedback from each approver helps requesters understand what needs to be improved
5. **Audit Trail**: Complete record of all decline reasons

## Example Workflow

1. **Faculty Member** submits event request
2. **Dean** reviews and declines with reason: "Insufficient budget allocation"
3. **Chairperson** also reviews and declines with reason: "Conflicts with final exams schedule"
4. **Faculty Member** sees both decline reasons clearly displayed:
   - Dean's reason about budget
   - Chairperson's reason about scheduling conflict
5. Faculty Member can address both concerns in a revised request

## Files Modified
- `backend/database/migrations/2026_03_11_000006_add_separate_decline_reasons.php` (created)
- `backend/app/Models/EventRequest.php`
- `backend/app/Http/Controllers/EventRequestController.php`
- `frontend/src/pages/EventRequests.jsx`

## Date
March 11, 2026
