# Event Display Debugging Added

## Issue Reported
Events created via `/add-event` are not showing up on the calendar view in `/dashboard` after creation.

## Investigation

### Expected Flow
1. User creates event on `/add-event`
2. EventForm submits to backend
3. Backend creates event and returns success
4. AddEvent.jsx navigates to `/dashboard` with `refresh` flag
5. Dashboard detects refresh flag
6. Dashboard calls `fetchData()` to reload events
7. Events appear on calendar

### Potential Issues Identified

#### 1. Timing Issue
The navigation might happen before the backend fully commits the event to the database.

#### 2. Caching Issue
Browser or API might be caching the old event list.

#### 3. Filter Issue
Events might be incorrectly filtered out as default events.

#### 4. State Update Issue
React state might not be updating properly after fetch.

## Debugging Added

### File: `frontend/src/pages/Dashboard.jsx`

#### Added Console Logging in fetchData()
```javascript
const fetchedEvents = eventsRes.data.events;
const currentYearDefaultEvents = currentYearEventsRes.data.events || [];
const nextYearDefaultEvents = nextYearEventsRes.data.events || [];

console.log('Fetched events from API:', fetchedEvents.length, 'events');

// Combine default events from both school years
const fetchedDefaultEvents = [...currentYearDefaultEvents, ...nextYearDefaultEvents];

// Filter out default events from the regular events list to avoid duplicates
const regularEventsOnly = fetchedEvents.filter(event => !event.is_default_event);

console.log('Regular events after filtering:', regularEventsOnly.length, 'events');
console.log('Regular events:', regularEventsOnly);

setEvents(regularEventsOnly);
```

This will show:
- How many events were fetched from the API
- How many events remain after filtering
- The actual event objects

#### Added Console Logging in Refresh Handler
```javascript
// Listen for refresh from navigation state (e.g., after creating event)
useEffect(() => {
  if (location.state?.refresh) {
    console.log('Refresh triggered from navigation, fetching data...');
    fetchData();
    checkApprovedRequests();
    fetchMyEventRequests();
    // Clear the state to prevent re-fetching on every render
    navigate(location.pathname, { replace: true, state: {} });
  }
}, [location.state]);
```

This will confirm:
- Whether the refresh is being triggered
- When the data fetch starts

## How to Debug

### Step 1: Open Browser DevTools
1. Press F12 to open DevTools
2. Go to Console tab
3. Clear the console (click trash icon)

### Step 2: Create an Event
1. Navigate to `/add-event`
2. Fill in event details
3. Click "Create Event"

### Step 3: Check Console Output
You should see:
```
Refresh triggered from navigation, fetching data...
Fetched events from API: X events
Regular events after filtering: X events
Regular events: [Array of event objects]
```

### Step 4: Analyze the Output

#### If you see "Fetched events from API: 0 events"
**Problem:** Backend is not returning the event
**Possible causes:**
- Event wasn't created successfully
- User is not the host or member
- Backend query is incorrect

**Solution:** Check backend logs and database

#### If you see "Fetched events from API: X events" but "Regular events after filtering: 0 events"
**Problem:** All events are being filtered out
**Possible causes:**
- Events have `is_default_event: true` incorrectly
- Filter logic is wrong

**Solution:** Check the event objects in console to see their properties

#### If you see events in console but not on calendar
**Problem:** Calendar component is not receiving or displaying events
**Possible causes:**
- State not updating
- Calendar component filtering incorrectly
- Date format mismatch

**Solution:** Check Calendar component props and rendering logic

### Step 5: Check Network Tab
1. Go to Network tab in DevTools
2. Filter by "Fetch/XHR"
3. Look for the `/api/events` request
4. Click on it and check:
   - **Status:** Should be 200 OK
   - **Response:** Should contain your newly created event

## Additional Checks

### Check Event Object Structure
In console, expand the event objects and verify:
```javascript
{
  id: 123,
  title: "Your Event Title",
  date: "2026-03-04",  // ← Should be YYYY-MM-DD format
  time: "10:00",
  host: { id: X, username: "...", email: "..." },
  members: [...],
  is_default_event: false,  // ← Should be false for regular events
  // ...
}
```

### Check Calendar Props
Add this to Calendar component temporarily:
```javascript
useEffect(() => {
  console.log('Calendar received events:', events.length);
  console.log('Calendar events:', events);
}, [events]);
```

## Common Issues and Solutions

### Issue 1: Event Created But Not Returned by API
**Symptom:** Backend returns 201 Created, but GET /api/events doesn't include it

**Cause:** Event was created but user is not set as host or member

**Solution:** Check EventController store() method - ensure host_id is set correctly

### Issue 2: Date Format Mismatch
**Symptom:** Event exists but doesn't show on correct calendar day

**Cause:** Date format inconsistency (e.g., "2026-3-4" vs "2026-03-04")

**Solution:** Ensure backend returns dates in YYYY-MM-DD format with zero-padding

### Issue 3: React State Not Updating
**Symptom:** Console shows events but calendar doesn't update

**Cause:** State update not triggering re-render

**Solution:** Check if setEvents() is being called and component is re-rendering

### Issue 4: Browser Caching
**Symptom:** Old data persists even after refresh

**Cause:** Browser or service worker caching API responses

**Solution:** 
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Disable cache in DevTools Network tab
- Add cache-busting query parameter

## Next Steps

After running the debugging:

1. **Share console output** - Copy the console logs
2. **Share network response** - Copy the `/api/events` response
3. **Share event object** - Copy one of the event objects from console

This will help identify exactly where the issue is occurring.

## Temporary Workaround

If events still don't appear, try:
1. Manually refresh the page (F5) after creating event
2. Navigate away and back to dashboard
3. Check if event appears in "Your Events" modal

## Date: March 4, 2026
