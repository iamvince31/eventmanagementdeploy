# Faculty/Staff Event Justification Feature

## Overview
Added a justification textbox that appears **strictly only for Faculty Members and Staff** when they select "Event" type in the Add Event form. This ensures proper documentation for events requiring Dean and Chairperson approval.

## Implementation Details

### Frontend Changes (`frontend/src/components/EventForm.jsx`)

#### 1. Justification Textarea UI
- Added conditional justification textarea that appears **only** when:
  - User role is "Faculty Member" OR "Staff"
  - Event type is "event" (not "meeting")
- Features:
  - Required field with red asterisk indicator
  - 3 rows for comfortable input
  - Placeholder text guiding users on what to write
  - Helper text explaining the justification will be reviewed by Dean and Chairperson
  - Amber-themed focus ring to match the approval warning above it

#### 2. Frontend Validation
- Added validation in `handleSubmit()` to check:
  - If user is Faculty/Staff
  - If event type is "event"
  - If justification is empty or whitespace-only
- Shows error message: "Justification is required for event requests"

#### 3. Form Submission
- Justification is included in FormData when:
  - User is Faculty Member or Staff
  - Event type is "event"
- Justification is NOT sent for meetings or for other roles

#### 4. Form Reset
- Justification is cleared when form is reset (already implemented in `resetForm()`)

### Backend Changes (`backend/app/Http/Controllers/EventController.php`)

#### 1. Validation in `createEventRequest()` Method
- Added server-side validation for justification:
  - `required`: Must be present
  - `string`: Must be text
  - `min:10`: Must be at least 10 characters
- Custom error messages:
  - "Justification is required for event requests."
  - "Justification must be at least 10 characters."

#### 2. Database Storage
- Justification is saved to `event_requests` table when creating event request
- Field already exists in database migration and EventRequest model fillable array

## User Experience Flow

### For Faculty/Staff Creating a Meeting:
1. Select "Meeting" radio button
2. Justification textbox does NOT appear
3. Can create meeting immediately without approval

### For Faculty/Staff Creating an Event:
1. Select "Event" radio button
2. Amber warning appears: "Requires Dean + Chairperson approval"
3. **Justification textbox appears below** with:
   - Required field indicator (*)
   - Placeholder text
   - Helper text about approval process
4. Must fill in justification (minimum 10 characters)
5. Submit creates event request for Dean/Chairperson approval

### For Other Roles (Dean, Chairperson, Coordinator, CEIT Official):
1. Can select "Event" or "Meeting"
2. Justification textbox does NOT appear
3. Can create events/meetings directly without approval

## Validation Rules

### Frontend Validation:
- Checks if justification is empty/whitespace for Faculty/Staff events
- Shows error before submission

### Backend Validation:
- Required field
- Minimum 10 characters
- Returns 422 error with message if validation fails

## Database Schema
The `justification` column already exists in the `event_requests` table:
- Type: `text`
- Nullable: No
- Purpose: Store the reason/justification for Faculty/Staff event requests

## Files Modified
1. `frontend/src/components/EventForm.jsx` - Added justification UI and validation
2. `backend/app/Http/Controllers/EventController.php` - Added backend validation

## Testing Checklist
- [x] Justification textbox appears only for Faculty/Staff when "Event" is selected
- [x] Justification textbox does NOT appear for Faculty/Staff when "Meeting" is selected
- [x] Justification textbox does NOT appear for other roles (Dean, Chairperson, etc.)
- [x] Frontend validation prevents submission without justification
- [x] Backend validation requires justification (minimum 10 characters)
- [x] Justification is saved to database in event_requests table
- [x] Form reset clears justification field
- [x] No diagnostic errors in code

## Meeting Feature Remains Unrestricted
As requested, the meeting feature for Faculty/Staff has **NO restrictions**:
- No justification required
- No approval needed
- Created immediately like normal events
- Can invite anyone freely

## Status
✅ **COMPLETE** - Justification feature fully implemented for Faculty/Staff event requests
