# Test Plan: Edit & Delete Regular Events Feature

## Test Environment Setup
- Backend server running on `http://localhost:8000`
- Frontend server running on `http://localhost:5173`
- Test user accounts with different roles
- Sample events created in the system

## Test Cases

### TC-01: Host Can See Edit/Delete Buttons
**Preconditions:**
- User is logged in
- User has created at least one regular event

**Steps:**
1. Navigate to Dashboard
2. Click on an event hosted by the current user
3. Observe the event detail modal header

**Expected Result:**
- ✅ Edit button (pencil icon) is visible
- ✅ Delete button (trash icon) is visible
- ✅ Close button (X icon) is visible
- ✅ Buttons are properly styled and aligned

**Status:** [ ] Pass [ ] Fail

---

### TC-02: Non-Host Cannot See Edit/Delete Buttons
**Preconditions:**
- User is logged in
- User is invited to an event (not the host)

**Steps:**
1. Navigate to Dashboard
2. Click on an event where user is invited
3. Observe the event detail modal header

**Expected Result:**
- ❌ Edit button is NOT visible
- ❌ Delete button is NOT visible
- ✅ Close button is visible
- ✅ Can view event details

**Status:** [ ] Pass [ ] Fail

---

### TC-03: Edit Regular Event Successfully
**Preconditions:**
- User is logged in as event host
- Event exists in the future

**Steps:**
1. Click on hosted event in calendar
2. Click Edit button
3. Modify event title to "Updated Event Title"
4. Modify event description
5. Click Save

**Expected Result:**
- ✅ Redirected to `/add-event` with pre-filled form
- ✅ Form contains existing event data
- ✅ Changes save successfully
- ✅ Redirected back to Dashboard
- ✅ Calendar shows updated event
- ✅ Updated title visible in calendar

**Status:** [ ] Pass [ ] Fail

---

### TC-04: Edit Regular Meeting Successfully
**Preconditions:**
- User is logged in as meeting host
- Meeting exists in the future

**Steps:**
1. Click on hosted meeting in calendar
2. Click Edit button
3. Modify meeting details
4. Click Save

**Expected Result:**
- ✅ Redirected to `/add-event` with pre-filled form
- ✅ Event type shows "meeting"
- ✅ Changes save successfully
- ✅ Calendar shows updated meeting
- ✅ Meeting color remains amber-800

**Status:** [ ] Pass [ ] Fail

---

### TC-05: Edit Personal Event Successfully
**Preconditions:**
- User is logged in
- Personal event exists

**Steps:**
1. Click on personal event in calendar
2. Click Edit button
3. Modify event details
4. Click Save

**Expected Result:**
- ✅ Redirected to `/personal-event` with pre-filled form
- ✅ Changes save successfully
- ✅ Calendar shows updated event
- ✅ Event color remains purple

**Status:** [ ] Pass [ ] Fail

---

### TC-06: Delete Event with Confirmation
**Preconditions:**
- User is logged in as event host
- Event exists

**Steps:**
1. Click on hosted event in calendar
2. Click Delete button
3. Observe confirmation dialog
4. Click "OK" to confirm

**Expected Result:**
- ✅ Confirmation dialog appears: "Delete '[Event Title]'?"
- ✅ Modal closes after confirmation
- ✅ Event is deleted from database
- ✅ Calendar refreshes automatically
- ✅ Event no longer appears in calendar
- ✅ No error messages

**Status:** [ ] Pass [ ] Fail

---

### TC-07: Cancel Delete Operation
**Preconditions:**
- User is logged in as event host
- Event exists

**Steps:**
1. Click on hosted event in calendar
2. Click Delete button
3. Observe confirmation dialog
4. Click "Cancel"

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ Modal remains open
- ✅ Event is NOT deleted
- ✅ Event still appears in calendar
- ✅ No changes made

**Status:** [ ] Pass [ ] Fail

---

### TC-08: Backend Authorization - Update
**Preconditions:**
- User A is logged in
- Event is hosted by User B

**Steps:**
1. Manually call API: `PUT /api/events/{event_id}`
2. Use User A's token
3. Attempt to update User B's event

**Expected Result:**
- ❌ Request fails with 403 Forbidden
- ✅ Error message: "Unauthorized"
- ✅ Event remains unchanged

**Status:** [ ] Pass [ ] Fail

---

### TC-09: Backend Authorization - Delete
**Preconditions:**
- User A is logged in
- Event is hosted by User B

**Steps:**
1. Manually call API: `DELETE /api/events/{event_id}`
2. Use User A's token
3. Attempt to delete User B's event

**Expected Result:**
- ❌ Request fails with 403 Forbidden
- ✅ Error message: "Unauthorized"
- ✅ Event remains in database

**Status:** [ ] Pass [ ] Fail

---

### TC-10: Cannot Edit Past Events
**Preconditions:**
- User is logged in as event host
- Event date is in the past

**Steps:**
1. Click on past event in calendar
2. Click Edit button
3. Try to save without changing date
4. Observe validation

**Expected Result:**
- ✅ Edit button is visible (frontend allows attempt)
- ❌ Backend rejects update with 422 error
- ✅ Error message: "Event date and time cannot be in the past"
- ✅ Event remains unchanged

**Status:** [ ] Pass [ ] Fail

---

### TC-11: Academic Events Not Editable
**Preconditions:**
- User is logged in (any role)
- Academic event exists in calendar

**Steps:**
1. Click on academic event (blue color)
2. Observe event detail modal

**Expected Result:**
- ❌ Edit button is NOT visible
- ❌ Delete button is NOT visible
- ✅ Event details are viewable
- ✅ School year information displayed

**Status:** [ ] Pass [ ] Fail

---

### TC-12: Multiple Events Same Day
**Preconditions:**
- User hosts multiple events on same day

**Steps:**
1. Click on first event
2. Delete it
3. Click on second event
4. Edit it
5. Verify both operations

**Expected Result:**
- ✅ First event deleted successfully
- ✅ Second event editable
- ✅ Calendar updates correctly
- ✅ No interference between operations

**Status:** [ ] Pass [ ] Fail

---

### TC-13: Edit Event with Images
**Preconditions:**
- User is logged in as event host
- Event has attached images

**Steps:**
1. Click on event with images
2. Click Edit button
3. Add new images
4. Remove old images
5. Save changes

**Expected Result:**
- ✅ Existing images shown in form
- ✅ Can add new images
- ✅ Can remove old images
- ✅ Changes save successfully
- ✅ Updated images display in event details

**Status:** [ ] Pass [ ] Fail

---

### TC-14: Edit Event Members
**Preconditions:**
- User is logged in as event host
- Event has invited members

**Steps:**
1. Click on event
2. Click Edit button
3. Add new members
4. Remove existing members
5. Save changes

**Expected Result:**
- ✅ Existing members shown in form
- ✅ Can add new members
- ✅ Can remove members
- ✅ Changes save successfully
- ✅ New members receive invitations
- ✅ Removed members no longer see event

**Status:** [ ] Pass [ ] Fail

---

### TC-15: UI Responsiveness
**Preconditions:**
- User is logged in
- Event exists

**Steps:**
1. Open event detail modal on desktop
2. Verify button layout
3. Resize to tablet view
4. Verify button layout
5. Resize to mobile view
6. Verify button layout

**Expected Result:**
- ✅ Buttons properly aligned on desktop
- ✅ Buttons accessible on tablet
- ✅ Buttons touch-friendly on mobile
- ✅ No layout issues at any size

**Status:** [ ] Pass [ ] Fail

---

### TC-16: Keyboard Navigation
**Preconditions:**
- User is logged in
- Event modal is open

**Steps:**
1. Open event detail modal
2. Press Tab to navigate buttons
3. Press Enter on Edit button
4. Press Escape to close modal

**Expected Result:**
- ✅ Tab cycles through buttons
- ✅ Focus visible on buttons
- ✅ Enter activates buttons
- ✅ Escape closes modal

**Status:** [ ] Pass [ ] Fail

---

### TC-17: Concurrent Edit Prevention
**Preconditions:**
- Two users (A and B) logged in
- User A hosts event

**Steps:**
1. User A opens event for editing
2. User B tries to edit same event
3. User A saves changes
4. User B attempts to save

**Expected Result:**
- ✅ User A can edit (is host)
- ❌ User B cannot see edit button (not host)
- ✅ Only host's changes are saved
- ✅ No data corruption

**Status:** [ ] Pass [ ] Fail

---

### TC-18: Delete Event with Pending Invitations
**Preconditions:**
- User is logged in as event host
- Event has pending invitations

**Steps:**
1. Create event with invited members
2. Before members respond, delete event
3. Check invited members' calendars

**Expected Result:**
- ✅ Event deletes successfully
- ✅ Event removed from all calendars
- ✅ Invitations become invalid
- ✅ No orphaned data

**Status:** [ ] Pass [ ] Fail

---

### TC-19: Network Error Handling
**Preconditions:**
- User is logged in
- Event exists

**Steps:**
1. Disconnect network
2. Try to delete event
3. Observe error handling
4. Reconnect network
5. Retry operation

**Expected Result:**
- ✅ Error message displayed
- ✅ Event not deleted locally
- ✅ User can retry
- ✅ Operation succeeds after reconnect

**Status:** [ ] Pass [ ] Fail

---

### TC-20: Button Tooltips
**Preconditions:**
- User is logged in as event host
- Event modal is open

**Steps:**
1. Hover over Edit button
2. Hover over Delete button
3. Hover over Close button

**Expected Result:**
- ✅ Edit button shows "Edit Event" tooltip
- ✅ Delete button shows "Delete Event" tooltip
- ✅ Close button shows "Close" tooltip

**Status:** [ ] Pass [ ] Fail

---

## Test Summary

| Category | Total | Passed | Failed | Skipped |
|----------|-------|--------|--------|---------|
| Functionality | 10 | | | |
| Authorization | 4 | | | |
| UI/UX | 4 | | | |
| Edge Cases | 2 | | | |
| **TOTAL** | **20** | | | |

## Test Execution Notes

**Date:** _______________
**Tester:** _______________
**Environment:** _______________
**Build Version:** _______________

### Issues Found
1. 
2. 
3. 

### Recommendations
1. 
2. 
3. 

## Sign-off

**Tested By:** _______________ **Date:** _______________
**Reviewed By:** _______________ **Date:** _______________
**Approved By:** _______________ **Date:** _______________
