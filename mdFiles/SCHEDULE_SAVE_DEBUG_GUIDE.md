# Schedule Save Issue - Debug Guide

## Changes Made

I've improved the schedule saving functionality with better error handling and validation:

### 1. Backend Improvements (ScheduleController.php)

- Added detailed error logging with user_id, error message, and stack trace
- Added validation for time format (H:i - 24-hour format like "14:30")
- Added validation to ensure day names are valid (Monday-Sunday)
- Added validation to ensure start_time < end_time
- Now returns the actual error message to frontend for debugging

### 2. User Model Improvements (User.php)

- Added `schedule_initialized` to the `$fillable` array
- Added `schedule_initialized` to the casts array as boolean

## How to Debug

### Step 1: Check Laravel Logs

The backend now logs detailed error information. Check:
```
backend/storage/logs/laravel.log
```

Look for entries with "Schedule save failed" - they will show:
- User ID
- Error message
- Full stack trace

### Step 2: Check Browser Console

The frontend logs the schedule data being sent and the response. Open browser DevTools and check:
- "Saving schedule:" - shows the data structure being sent
- "Response status:" - shows HTTP status code
- "Save failed:" - shows error details from backend

### Step 3: Common Issues to Check

1. **Time Format Issue**
   - Frontend should send times in 24-hour format: "14:30" not "2:30 PM"
   - Check the schedule object in browser console

2. **Empty Schedule**
   - If all days have empty arrays, the schedule will save but with no entries
   - This is valid - schedule_initialized will still be set to true

3. **Invalid Day Names**
   - Days must be exactly: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
   - Case-sensitive!

4. **Database Connection**
   - Ensure MySQL is running
   - Check .env database credentials

5. **Authentication**
   - Ensure the token is valid
   - Check if user is properly authenticated

### Step 4: Test with Sample Data

Try saving this minimal schedule to test:
```json
{
  "schedule": {
    "Monday": [
      {
        "id": 1,
        "startTime": "09:00",
        "endTime": "10:00",
        "description": "Test Class"
      }
    ],
    "Tuesday": [],
    "Wednesday": [],
    "Thursday": [],
    "Friday": [],
    "Saturday": [],
    "Sunday": []
  }
}
```

### Step 5: Check Database

After attempting to save, check the database:

```sql
-- Check if schedule_initialized was set
SELECT id, name, email, schedule_initialized FROM users WHERE id = [your_user_id];

-- Check if any schedules were saved
SELECT * FROM user_schedules WHERE user_id = [your_user_id];
```

## Expected Behavior

When schedule saves successfully:
1. All existing schedules for the user are deleted
2. New schedules are inserted (if any)
3. `schedule_initialized` is set to true on the user
4. Frontend receives success message
5. Schedule edit mode exits
6. User context is updated
7. Dashboard is notified to refresh

## Next Steps

1. Try saving a schedule again
2. Check the browser console for the exact error
3. Check Laravel logs for detailed error information
4. Share the error message so I can help further

The improved error handling will now show you exactly what's going wrong!
