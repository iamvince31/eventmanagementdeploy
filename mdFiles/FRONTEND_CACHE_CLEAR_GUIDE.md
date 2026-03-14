# Frontend Cache Clear Guide

## Issue
The backend is working correctly and returning the proper events, but the frontend may not be displaying them due to browser caching.

## Backend Verification
The API endpoint `/api/default-events?school_year=2025-2026` is returning the correct data with 36 events, including school-year-specific events with dates.

## Steps to Fix Frontend Display

### 1. Clear Browser Cache
- Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
- Select "Cached images and files"
- Click "Clear data"

### 2. Hard Refresh the Page
- Press `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
- This forces the browser to reload all resources

### 3. Clear React Dev Server Cache (if running locally)
If you're running the frontend development server:

```bash
cd frontend
rm -rf node_modules/.cache
npm start
```

### 4. Check Browser Console
Open browser DevTools (F12) and check:
- Network tab: Verify the API call to `/api/default-events?school_year=XXXX-XXXX` is being made
- Console tab: Look for any JavaScript errors
- Response: Check if the API response contains the events with dates

### 5. Verify API Response
In the browser console, run:
```javascript
fetch('http://localhost:8000/api/default-events?school_year=2025-2026')
  .then(r => r.json())
  .then(data => console.log(data))
```

This should show all 36 events for 2025-2026.

## Expected Behavior

### For School Year 2025-2026:
- Should show 36 events total
- "Registration Period" in February should have date: March 2, 2026
- "Last Day of Adding/Changing Subjects" in February should have date: Feb 26, 2026
- All other events should show "No date set"

### For School Year 2024-2025:
- Should show 34 events total (only base events)
- All events should show "No date set"
- When you set a date for an event, it creates a school-year-specific copy

## How It Works Now

1. Base events (school_year = NULL) appear in ALL school years
2. When you set a date for an event in a specific school year, it creates a copy with that school_year
3. The school-year-specific version takes priority and is displayed instead of the base event
4. Other school years still see the base event (without the date)

## Testing

1. Navigate to Default Events page
2. Select school year 2025-2026
3. Check February events - should see dates for "Registration Period" and "Last Day of Adding/Changing Subjects"
4. Switch to school year 2024-2025
5. Check February events - should see "No date set" for all events
6. Set a date for an event in 2024-2025
7. Switch back to 2025-2026 - the event should still have its original date
