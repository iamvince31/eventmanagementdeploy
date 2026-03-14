# Faculty/Staff Flexible Event Creation System

## Overview

Faculty and Staff members now have flexible event creation capabilities:
- **Meetings**: Can be created freely without approval (immediate posting to calendar)
- **Events**: Require approval from both Dean and Chairperson before posting to calendar

## Changes Implemented

### Backend Changes

#### 1. EventController.php
- **Removed restriction** that blocked Faculty/Staff from accessing `/add-event`
- **Added logic** to differentiate between meetings and events:
  - **Meetings** (`event_type === 'meeting'`): Created directly via `createEventDirectly()`
  - **Events** (`event_type === 'event'`): Submitted for approval via `createEventRequest()`
- **New method** `createEventRequest()`: Creates event request requiring Dean + Chairperson approval

#### 2. Database Migrations
Created 2 new migrations:

**a. 2026_03_11_000000_add_member_ids_to_event_requests_table.php**
- Adds `member_ids` JSON column to store invited members for later use when event is approved

**b. 2026_03_11_000001_add_event_type_and_school_year_to_event_requests.php**
- Adds `event_type` enum column ('event', 'meeting')
- Adds `school_year` string column

#### 3. EventRequest Model
Updated fillable fields and casts to include:
- `event_type`
- `school_year`
- `member_ids` (cast to array)
- `requires_dean_approval` (boolean)
- `requires_chair_approval` (boolean)

### Frontend Changes

#### 1. AddEvent.jsx
- **Removed redirect** that sent Faculty/Staff to `/request-event`
- Faculty/Staff can now access `/add-event` page directly

#### 2. EventForm.jsx

**a. Updated Information Notice**
- Changed from "Meeting Approval Required" to "Event Type Information"
- Clearly explains:
  - Meetings: Created freely without approval
  - Events: Require Dean + Chairperson approval

**b. Event Type Selection**
- Faculty/Staff can now choose between "Event" and "Meeting"
- Visual indicators show approval requirements:
  - **Event selected**: Shows amber warning "Requires Dean + Chairperson approval"
  - **Meeting selected**: Shows green checkmark "No approval needed - created immediately"

**c. Default Event Type**
- Faculty/Staff default to 'meeting' (but can change to 'event')
- Other roles default to 'event'

## User Experience Flow

### For Faculty/Staff Creating a Meeting

1. Navigate to `/add-event`
2. See information notice explaining the difference between events and meetings
3. Select "Meeting" radio button (default)
4. See green indicator: "No approval needed - created immediately"
5. Fill in event details and invite members
6. Click "Create Event"
7. Meeting is created immediately and appears on calendar

### For Faculty/Staff Creating an Event

1. Navigate to `/add-event`
2. See information notice explaining the difference between events and meetings
3. Select "Event" radio button
4. See amber warning: "Requires Dean + Chairperson approval"
5. Fill in event details and invite members
6. Click "Create Event"
7. Event request is submitted for approval
8. Receive confirmation: "Event submitted for approval. Requires approval from Dean and Chairperson."
9. Event appears in "Your Events" as pending
10. Once both Dean and Chairperson approve, event is posted to calendar

### For Dean/Chairperson Approving Faculty/Staff Events

1. Receive notification of pending event request
2. Review event details in Event Requests page
3. Approve or reject the request
4. If both Dean and Chairperson approve:
   - Event is automatically created
   - Invited members are added
   - Event appears on calendar
   - Faculty/Staff member is notified

## Benefits

1. **Flexibility**: Faculty/Staff can conduct meetings freely without bureaucratic delays
2. **Control**: Important events still require proper approval from leadership
3. **Efficiency**: Reduces approval bottleneck for routine meetings
4. **Clarity**: Clear visual indicators show which type requires approval
5. **Consistency**: Same interface and workflow as other roles

## Technical Details

### Event Creation Logic (Backend)

```php
// Faculty/Staff logic in EventController::store()
if (in_array($user->role, ['Faculty Member', 'Staff'])) {
    if ($request->event_type === 'meeting') {
        // Create meeting directly
        return $this->createEventDirectly($request, $user, $memberIds);
    } else {
        // Create event request for approval
        return $this->createEventRequest($request, $user, $memberIds);
    }
}
```

### Event Request Structure

```php
EventRequest::create([
    'title' => $request->title,
    'description' => $request->description,
    'location' => $request->location,
    'event_type' => 'event', // or 'meeting'
    'date' => $request->date,
    'time' => $request->time,
    'school_year' => $request->school_year,
    'requested_by' => $user->id,
    'status' => 'pending',
    'requires_dean_approval' => true,
    'requires_chair_approval' => true,
    'member_ids' => json_encode($memberIds), // Stored for later use
]);
```

## Database Schema Updates

### event_requests Table
New columns:
- `event_type` ENUM('event', 'meeting') DEFAULT 'meeting'
- `school_year` VARCHAR(255) NULLABLE
- `member_ids` JSON NULLABLE

## Permissions Summary

| Role | Can Create Meetings | Can Create Events | Approval Required |
|------|-------------------|------------------|-------------------|
| Faculty Member | ✅ Yes (immediate) | ✅ Yes (with approval) | Events: Dean + Chairperson |
| Staff | ✅ Yes (immediate) | ✅ Yes (with approval) | Events: Dean + Chairperson |
| Chairperson | ✅ Yes (immediate) | ✅ Yes (immediate) | None |
| Coordinator | ✅ Yes (immediate) | ✅ Yes (immediate) | None |
| Dean | ✅ Yes (immediate) | ✅ Yes (immediate) | None |
| CEIT Official | ✅ Yes (immediate) | ✅ Yes (immediate) | None |
| Admin | ✅ Yes (immediate) | ✅ Yes (immediate) | None |

## Testing Checklist

- [ ] Faculty member can create meeting without approval
- [ ] Faculty member can create event that requires approval
- [ ] Staff member can create meeting without approval
- [ ] Staff member can create event that requires approval
- [ ] Meeting appears immediately on calendar
- [ ] Event appears as pending until approved
- [ ] Dean can approve Faculty/Staff events
- [ ] Chairperson can approve Faculty/Staff events
- [ ] Event is created after both approvals
- [ ] Invited members are added to approved event
- [ ] Visual indicators show correct approval status
- [ ] Other roles (Dean, Chairperson, etc.) unaffected

## Migration Commands

```bash
# Run new migrations
php artisan migrate

# Check migration status
php artisan migrate:status
```

## Files Modified

### Backend
1. `backend/app/Http/Controllers/EventController.php` - Updated store() method
2. `backend/app/Models/EventRequest.php` - Added new fillable fields and casts
3. `backend/database/migrations/2026_03_11_000000_add_member_ids_to_event_requests_table.php` - New
4. `backend/database/migrations/2026_03_11_000001_add_event_type_and_school_year_to_event_requests.php` - New

### Frontend
1. `frontend/src/pages/AddEvent.jsx` - Removed Faculty/Staff redirect
2. `frontend/src/components/EventForm.jsx` - Updated UI and logic for event type selection

## Notes

- The `/request-event` page is still available but no longer required for Faculty/Staff
- Faculty/Staff can use either `/add-event` or `/request-event` (both work)
- The approval workflow for events is the same as before (Dean + Chairperson)
- Meetings bypass the approval system entirely
