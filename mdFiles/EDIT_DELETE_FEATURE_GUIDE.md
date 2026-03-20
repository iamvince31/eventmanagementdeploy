# Edit & Delete Regular Events - Quick Visual Guide

## Feature Overview
Host users can now edit and delete their regular events and meetings directly from the calendar event detail modal.

## How to Use

### Step 1: Open Event Details
```
Click on any event in the calendar
↓
Event detail modal opens
```

### Step 2: Check Your Permissions
```
Are you the event host?
├─ YES → Edit and Delete buttons appear in modal header
└─ NO  → View-only mode (no action buttons)
```

### Step 3: Edit Event
```
Click Edit button (pencil icon)
↓
Redirected to event form with pre-filled data
↓
Make changes
↓
Save
↓
Calendar refreshes with updated event
```

### Step 4: Delete Event
```
Click Delete button (trash icon)
↓
Confirmation dialog: "Delete '[Event Title]'?"
├─ Confirm → Event deleted, calendar refreshes
└─ Cancel  → No action taken
```

## Visual Indicators

### Event Colors in Calendar
- 🔴 **Red** - Hosting Event
- 🟢 **Green** - Invited to Event
- 🟤 **Amber-800** - Hosting Meeting
- 🟡 **Yellow** - Invited to Meeting
- 🟣 **Purple** - Personal Event
- 🔵 **Blue** - Academic Event (view only)

### Modal Header Buttons (Host Only)
```
┌─────────────────────────────────────────────┐
│  Event Title                    [✏️] [🗑️] [✖️] │
│  Date and Time                               │
└─────────────────────────────────────────────┘
    ↑        ↑      ↑
    Edit   Delete Close
```

## Event Type Behavior

| Event Type | Can Edit? | Can Delete? | Edit Page |
|------------|-----------|-------------|-----------|
| Regular Event (Host) | ✅ Yes | ✅ Yes | /add-event |
| Regular Meeting (Host) | ✅ Yes | ✅ Yes | /add-event |
| Personal Event (Creator) | ✅ Yes | ✅ Yes | /personal-event |
| Invited Event | ❌ No | ❌ No | View only |
| Academic Event | ❌ No | ❌ No | Admin only |

## Authorization Rules

### Frontend Display
```javascript
Show Edit/Delete buttons IF:
  ✓ User is logged in
  ✓ Event has a host
  ✓ Current user ID === Event host ID
  ✓ Handler functions are provided
```

### Backend Validation
```php
Allow update/delete IF:
  ✓ User is authenticated
  ✓ User ID === Event host_id
  ✓ Event date is not in the past (for updates)
```

## User Scenarios

### Scenario 1: Faculty Member Hosting Meeting
```
1. Faculty creates meeting with colleagues
2. Meeting appears in calendar (amber-800 color)
3. Faculty clicks on meeting
4. Sees Edit and Delete buttons
5. Can modify meeting details or cancel it
```

### Scenario 2: Coordinator Hosting Event
```
1. Coordinator creates department event
2. Event appears in calendar (red color)
3. Coordinator clicks on event
4. Sees Edit and Delete buttons
5. Can update event or remove it
```

### Scenario 3: Invited Member
```
1. Member receives event invitation
2. Event appears in calendar (green color)
3. Member clicks on event
4. NO Edit/Delete buttons visible
5. Can only Accept/Decline invitation
```

### Scenario 4: Academic Event
```
1. Admin creates academic calendar event
2. Event appears for all users (blue color)
3. Any user clicks on event
4. NO Edit/Delete buttons visible
5. View-only mode for everyone
```

## Error Messages

### Delete Confirmation
```
"Delete '[Event Title]'?"
[Cancel] [OK]
```

### Delete Success
```
Event deleted successfully
Calendar refreshes automatically
```

### Delete Failure
```
"Failed to delete event: [error message]"
```

### Unauthorized Attempt
```
Backend returns: 403 Forbidden
Frontend shows: "Unauthorized"
```

## Technical Flow

### Edit Flow
```
User clicks Edit
    ↓
Modal closes
    ↓
Navigate to edit page with event data
    ↓
Form pre-populated
    ↓
User modifies fields
    ↓
Submit form
    ↓
API: PUT /api/events/{id}
    ↓
Backend validates & updates
    ↓
Return updated event
    ↓
Dashboard refreshes
    ↓
Calendar shows updated event
```

### Delete Flow
```
User clicks Delete
    ↓
Confirmation dialog
    ↓
User confirms
    ↓
Modal closes
    ↓
API: DELETE /api/events/{id}
    ↓
Backend validates & deletes
    ↓
Return success message
    ↓
Dashboard refreshes
    ↓
Event removed from calendar
```

## API Endpoints Used

### Update Event
```
PUT /api/events/{id}
Authorization: Bearer {token}
Body: {
  title, description, location,
  event_type, date, time,
  member_ids, images
}
Response: { message, event }
```

### Delete Event
```
DELETE /api/events/{id}
Authorization: Bearer {token}
Response: { message }
```

## Button Styling

### Edit Button
- Icon: Pencil/document edit
- Color: Green (text-green-600)
- Hover: Light green background (hover:bg-green-100)
- Tooltip: "Edit Event"

### Delete Button
- Icon: Trash bin
- Color: Red (text-red-600)
- Hover: Light red background (hover:bg-red-50)
- Tooltip: "Delete Event"

### Close Button
- Icon: X
- Color: Green (text-green-600)
- Hover: Light green background (hover:bg-green-100)
- Tooltip: "Close"

## Testing Steps

### Test as Host
1. ✅ Create a regular event
2. ✅ Click on the event in calendar
3. ✅ Verify Edit and Delete buttons appear
4. ✅ Click Edit, modify details, save
5. ✅ Verify changes appear in calendar
6. ✅ Click Delete, confirm
7. ✅ Verify event removed from calendar

### Test as Invitee
1. ✅ Get invited to an event
2. ✅ Click on the event in calendar
3. ✅ Verify NO Edit/Delete buttons
4. ✅ Can only view details and respond

### Test Academic Event
1. ✅ View academic calendar event
2. ✅ Click on the event
3. ✅ Verify NO Edit/Delete buttons
4. ✅ View-only mode

## Keyboard Shortcuts
- **Escape** - Close modal
- **Enter** (on confirmation) - Confirm delete

## Mobile Responsiveness
- Buttons stack properly on small screens
- Touch-friendly button sizes
- Confirmation dialog works on mobile browsers

## Accessibility
- Buttons have proper ARIA labels
- Tooltips provide context
- Confirmation dialog is keyboard accessible
- Focus management on modal open/close

## Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Known Limitations
1. Cannot edit past events (backend validation)
2. Cannot edit academic events (admin only)
3. Cannot edit events you're only invited to
4. Delete is permanent (no undo)

## Support
For issues or questions:
1. Check authorization (are you the host?)
2. Verify event type (regular vs academic)
3. Check browser console for errors
4. Review backend logs for API errors
