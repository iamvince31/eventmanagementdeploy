# Default Events Calendar Display Fix

## Problem Identified

When setting dates for default events (academic calendar events) in a different school year, they were not appearing highlighted on the calendar dashboard.

### Example from Screenshot:
- Current date: March 3, 2026 (School Year 2025-2026)
- Viewing: September 2026 calendar (School Year 2026-2027)
- Issue: "Registration Period" (Sep 7-18, 2026) not showing on calendar

## Root Cause

The Dashboard was only fetching default events for the **current school year** based on today's date, not for the school year of the month being viewed in the calendar.

### Previous Logic:
```javascript
// Only fetched current school year
const schoolYear = currentMonth >= 9 
  ? `${currentYear}-${currentYear + 1}` 
  : `${currentYear - 1}-${currentYear}`;

api.get(`/default-events?school_year=${schoolYear}`)
```

### Problem Scenario:
- Today: March 2026 → Current school year: 2025-2026
- Calendar showing: September 2026 → Belongs to: 2026-2027
- Dashboard only fetched 2025-2026 events
- September 2026 events (2026-2027) were not fetched
- Result: No highlighting on calendar

## Solution Implemented

Fetch default events for **both current and next school year** to ensure all visible calendar months have their events displayed.

### New Logic:
```javascript
// Get current school year
const schoolYear = currentMonth >= 9 
  ? `${currentYear}-${currentYear + 1}` 
  : `${currentYear - 1}-${currentYear}`;

// Also get next school year
const nextSchoolYear = currentMonth >= 9
  ? `${currentYear + 1}-${currentYear + 2}`
  : `${currentYear}-${currentYear + 1}`;

// Fetch both school years
const [currentYearEventsRes, nextYearEventsRes] = await Promise.all([
  api.get(`/default-events?school_year=${schoolYear}`),
  api.get(`/default-events?school_year=${nextSchoolYear}`),
]);

// Combine events from both years
const fetchedDefaultEvents = [
  ...currentYearEventsRes.data.events || [],
  ...nextYearEventsRes.data.events || []
];
```

## How It Works Now

### Scenario 1: Current Date in March 2026
- Current school year: 2025-2026
- Next school year: 2026-2027
- Fetches events from both years
- Calendar can show events from September 2025 to August 2027

### Scenario 2: Current Date in September 2026
- Current school year: 2026-2027
- Next school year: 2027-2028
- Fetches events from both years
- Calendar can show events from September 2026 to August 2028

### Coverage:
The calendar can navigate 2 months back and 1 year forward from today, and now all default events within that range will be displayed.

## Files Modified

### Dashboard.jsx (`frontend/src/pages/Dashboard.jsx`)

**Changed:**
- `fetchData()` function now fetches two school years
- Combines default events from both years
- Passes combined list to Calendar component

**Before:**
```javascript
const [eventsRes, membersRes, defaultEventsRes] = await Promise.all([
  api.get('/events'),
  api.get('/users'),
  api.get(`/default-events?school_year=${schoolYear}`),
]);
const fetchedDefaultEvents = defaultEventsRes.data.events || [];
```

**After:**
```javascript
const [eventsRes, membersRes, currentYearEventsRes, nextYearEventsRes] = await Promise.all([
  api.get('/events'),
  api.get('/users'),
  api.get(`/default-events?school_year=${schoolYear}`),
  api.get(`/default-events?school_year=${nextSchoolYear}`),
]);
const currentYearDefaultEvents = currentYearEventsRes.data.events || [];
const nextYearDefaultEvents = nextYearEventsRes.data.events || [];
const fetchedDefaultEvents = [...currentYearDefaultEvents, ...nextYearDefaultEvents];
```

## User Experience

### Before Fix:
1. User sets "Registration Period" for Sep 7-18, 2026
2. User navigates to Dashboard
3. User views September 2026 calendar
4. ❌ No highlighting - event not visible
5. User confused - where is the event?

### After Fix:
1. User sets "Registration Period" for Sep 7-18, 2026
2. User navigates to Dashboard
3. User views September 2026 calendar
4. ✅ Sep 7-18 highlighted in blue
5. User can see the event clearly

## Calendar Highlighting

Default events appear with:
- Blue gradient background (`bg-gradient-to-br from-blue-100 to-blue-50`)
- Blue border (`border-2 border-blue-400`)
- Calendar icon indicator
- Tooltip showing event name and date range

### Example:
```
September 2026
Su  Mo  Tu  We  Th  Fr  Sa
        1   2   3   4   5
6   [7] [8] [9] [10][11][12]  ← Blue highlighted
    [13][14][15][16][17][18]  ← Registration Period
```

## Testing

### Test Case 1: Current School Year Events
1. Set a default event for current month
2. Go to Dashboard
3. View current month calendar
4. ✅ Event should be highlighted

### Test Case 2: Next School Year Events
1. Set a default event for September (next school year)
2. Go to Dashboard
3. Navigate to September calendar
4. ✅ Event should be highlighted

### Test Case 3: Date Range Events
1. Set a default event with date range (e.g., Sep 7-18)
2. Go to Dashboard
3. Navigate to September
4. ✅ All dates in range should be highlighted

### Test Case 4: Multiple School Years
1. Set events in both current and next school year
2. Go to Dashboard
3. Navigate between months
4. ✅ All events should appear in their respective months

## Performance Considerations

### API Calls:
- Before: 3 parallel API calls
- After: 4 parallel API calls
- Impact: Minimal (all calls are parallel)

### Data Size:
- Typical default events per school year: 10-20 events
- Total events loaded: 20-40 events
- Impact: Negligible (small data size)

### Benefits:
- ✅ Complete calendar coverage
- ✅ No missing events
- ✅ Better user experience
- ✅ Minimal performance impact

## Edge Cases Handled

### 1. Empty School Years
If a school year has no events:
```javascript
const events = defaultEventsRes.data.events || [];
// Returns empty array, no errors
```

### 2. Duplicate Events
Events are school-year specific, so no duplicates possible:
- Event in 2025-2026 has `school_year: "2025-2026"`
- Event in 2026-2027 has `school_year: "2026-2027"`
- Different events, no conflict

### 3. Calendar Navigation Limits
Calendar can navigate:
- Past: 2 months back from today
- Future: 1 year forward from today
- Coverage: Current + Next school year = sufficient

## Alternative Solutions Considered

### Option 1: Fetch All School Years
```javascript
// Fetch all default events without school year filter
api.get('/default-events')
```
**Pros:** Complete coverage
**Cons:** Loads unnecessary data, slower

### Option 2: Dynamic Fetching on Month Change
```javascript
// Fetch events when user changes calendar month
onMonthChange={(month, year) => fetchEventsForMonth(month, year)}
```
**Pros:** Only loads needed data
**Cons:** Complex implementation, loading delays

### Option 3: Current + Next School Year (CHOSEN)
```javascript
// Fetch current and next school year
api.get(`/default-events?school_year=${schoolYear}`)
api.get(`/default-events?school_year=${nextSchoolYear}`)
```
**Pros:** Simple, covers all visible months, minimal overhead
**Cons:** None significant

## Clear Cache

After this update, clear browser cache:
1. `Ctrl + F5` (hard refresh)
2. Or `Ctrl + Shift + Delete` → Clear cache
3. Or open in incognito mode

## Summary

✅ Dashboard now fetches default events for both current and next school year
✅ All default events appear on calendar regardless of which month is viewed
✅ September 2026 events now visible when viewing September calendar
✅ Minimal performance impact (one additional API call)
✅ Complete calendar coverage for all navigable months

The fix ensures that academic calendar events are always visible on the dashboard calendar, providing a better user experience and eliminating confusion about "missing" events.
