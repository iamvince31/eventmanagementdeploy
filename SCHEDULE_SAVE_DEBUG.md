# Schedule Save Debugging Guide

## Issue
Class schedule is not saving when clicking "Save Schedule" button.

## Debugging Steps

### 1. Check Browser Console
Open browser DevTools (F12) and check the Console tab for:
- Any error messages when clicking "Save Schedule"
- Look for the console.log messages:
  - "Saving schedule:" - Shows the schedule data being sent
  - "Response status:" - Shows HTTP response code
  - "Save successful:" or error messages

### 2. Check Network Tab
In DevTools Network tab:
- Click "Save Schedule" button
- Look for a POST request to `http://localhost:8000/api/schedules`
- Check the request:
  - Status code (should be 200)
  - Request payload (should contain schedule data)
  - Response (should show success message)
- Common issues:
  - 401 Unauthorized - Token expired or invalid
  - 422 Validation Error - Data format issue
  - 500 Server Error - Backend error
  - Failed to fetch - Backend not running

### 3. Verify Backend is Running
Check if Laravel backend is running:
```bash
# Should see "Server running on http://localhost:8000"
php artisan serve
```

### 4. Check Token
In browser console, run:
```javascript
console.log('Token:', localStorage.getItem('token'));
```
- Should show a long string
- If null, you need to log in again

### 5. Test API Directly
Use browser console to test:
```javascript
fetch('http://localhost:8000/api/schedules', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    schedule: {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    }
  })
})
.then(r => r.json())
.then(d => console.log('Result:', d))
.catch(e => console.error('Error:', e));
```

## Common Fixes

### Backend Not Running
```bash
cd backend
php artisan serve
```

### Token Expired
- Log out and log back in
- Or clear localStorage and log in again

### CORS Issues
Check `backend/bootstrap/app.php` has CORS middleware configured

### Database Issues
```bash
cd backend
php artisan migrate:fresh
```

## Expected Behavior

When clicking "Save Schedule":
1. Button shows "Saving..." with spinner
2. Console shows "Saving schedule:" with data
3. Console shows "Response status: 200"
4. Console shows "Save successful:" with response
5. Green success message appears: "Schedule saved! You can now create events."
6. Required badge disappears from header
7. User can now create events

## Code Changes Made

Added detailed logging to `handleScheduleSave` function in `AccountDashboard.jsx`:
- Logs schedule data before sending
- Logs response status
- Logs success/error details
- Better error messages

Check browser console for these logs to diagnose the issue.
