# Duplicate Multi-Day Event Fix

## Problem
Multi-day academic events (e.g., "Midterm Exam" from Apr 13-17) were showing up twice in the event list:
1. First entry: Shows "00:00" time and "TBD" location
2. Second entry: Shows "All Day" with the full date range (Apr 13 - Apr 17, 2026)

Additionally, when viewing a multi-day event in the modal, the date was showing with full ISO timestamp including timezone (e.g., "2026-04-13T00:00:00.000000Z at All Day") instead of a clean date range format.

## Root Cause
1. The `/events` API endpoint was returning default events with `is_default_event: true`, and the frontend was ALSO fetching default events separately from `/default-events` endpoint and transforming them. This created duplicate entries for the same event.
2. The event modal was displaying the raw date field without checking if it's a multi-day event, resulting in timezone information being shown.

## Solution
1. Filter out default events from the regular events list in the Dashboard component since they're being handled separately through the `/default-events` endpoint.
2. Update the event modal to detect multi-day events (events with `end_date`) and display them as a formatted date range without time information.

## Changes Made

### frontend/src/pages/Dashboard.jsx

#### Fix 1: Remove duplicate events
- Added filter to remove default events from the regular events list
- Changed `setEvents(fetchedEvents)` to `setEvents(regularEventsOnly)` where `regularEventsOnly` filters out events with `is_default_event: true`

```javascript
// Filter out default events from the regular events list to avoid duplicates
const regularEventsOnly = fetchedEvents.filter(event => !event.is_default_event);

setEvents(regularEventsOnly);
```

#### Fix 2: Format multi-day event dates properly
- Updated the event modal to check for `end_date` field
- For multi-day events: Display formatted date range (e.g., "Apr 13, 2026 - Apr 17, 2026")
- For single-day events: Display date and time as before (e.g., "2026-04-13 at 14:00")

```javascript
{selectedEvent.end_date ? (
  // Multi-day event: show date range without time
  <>
    {new Date(selectedEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
    {' - '}
    {new Date(selectedEvent.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
  </>
) : (
  // Single-day event: show date and time
  `${selectedEvent.date} at ${selectedEvent.time}`
)}
```

## Result
1. Multi-day academic events now appear only once in the event list, showing:
   - "All Day" as the time
   - The full date range (e.g., "Apr 13 - Apr 17, 2026")
   - "Academic" badge to identify them as academic calendar events

2. When viewing a multi-day event in the modal, it displays:
   - Clean formatted date range: "Apr 13, 2026 - Apr 17, 2026"
   - No timezone information
   - No time information (since it's an all-day event)

The duplicate entry with "00:00" time has been removed, and the timezone display issue is fixed.
