# Schedule Database Checker Guide

## Overview
I've created tools to check if schedules are being saved correctly in the database and diagnose any issues.

## How to Check Schedules

### Method 1: Browser-Based Checker (Recommended)

1. Open your browser and navigate to:
   ```
   http://localhost/EventManagementSystemOJT/check-schedules.php
   ```

2. This will show you:
   - ✅ All users and their schedule status
   - ✅ All schedule entries in the database
   - ✅ Schedules grouped by user with weekly view
   - ✅ Data consistency checks
   - ✅ Any inconsistencies between schedule_initialized flag and actual schedules

### Method 2: Command Line (Alternative)

If you prefer command line, navigate to the backend folder and run:
```bash
cd backend
php check-schedules-simple.php
```

## What to Look For

### 1. Users Overview
- Check if users have `schedule_initialized` set to `true` or `false`
- Users should have `schedule_initialized = true` if they've set up their schedule

### 2. Schedule Entries
- Look for entries in the `user_schedules` table
- Each entry should have:
  - `user_id` - which user it belongs to
  - `day` - day of the week (Monday-Sunday)
  - `start_time` - class start time (HH:MM format)
  - `end_time` - class end time (HH:MM format)
  - `description` - class name/description

### 3. Data Consistency
The checker will flag these issues:
- ⚠️ Users with `schedule_initialized = true` but no schedules in database
- ⚠️ Users with schedules in database but `schedule_initialized = false`

## Common Issues and Solutions

### Issue 1: Schedules Not Displaying
**Symptoms:** User saved schedule but it doesn't show on the page

**Check:**
1. Run the checker to see if data is in database
2. If data exists in DB but not showing:
   - Check browser console for JavaScript errors
   - Verify API endpoint `/schedules` is working
   - Check if `schedule_initialized` flag is set correctly

**Solution:**
- If data is in DB: The frontend syntax error we just fixed should resolve this
- If no data in DB: There's an issue with the save process

### Issue 2: Schedule Save Error
**Symptoms:** Error message when trying to save schedule

**Check:**
1. Browser console for the exact error message
2. Backend logs in `backend/storage/logs/laravel.log`
3. Network tab to see the API response

**Common causes:**
- Invalid time format
- Missing required fields
- Database connection issues

### Issue 3: Inconsistent Data
**Symptoms:** Checker shows inconsistencies

**Solution:**
If user has schedules but `schedule_initialized = false`:
```sql
UPDATE users 
SET schedule_initialized = 1 
WHERE id IN (
    SELECT DISTINCT user_id FROM user_schedules
);
```

If user has `schedule_initialized = true` but no schedules:
```sql
UPDATE users 
SET schedule_initialized = 0 
WHERE id NOT IN (
    SELECT DISTINCT user_id FROM user_schedules
);
```

## Testing the Fix

After fixing the syntax error, test the schedule functionality:

1. **Login** to your account
2. **Navigate** to Account Dashboard (`/account`)
3. **Click** "Edit Schedule"
4. **Add** a class:
   - Select a day
   - Click "Add Class"
   - Enter start time (e.g., 08:00)
   - Enter end time (e.g., 10:00)
   - Enter description (e.g., "Math 101")
5. **Click** "Save Schedule"
6. **Verify** success message appears
7. **Refresh** the page
8. **Check** if schedule displays correctly
9. **Run** the checker to verify database entry

## Database Schema Reference

### users table
- `id` - User ID
- `username` - Username
- `email` - Email address
- `schedule_initialized` - Boolean flag (0 or 1)

### user_schedules table
- `id` - Schedule entry ID
- `user_id` - Foreign key to users table
- `day` - Day of week (Monday-Sunday)
- `start_time` - Start time (HH:MM format, 24-hour)
- `end_time` - End time (HH:MM format, 24-hour)
- `description` - Class description
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Files Created

1. **check-schedules.php** - Browser-based visual checker (root directory)
2. **backend/check-schedules-simple.php** - Command line checker
3. **backend/check-user-schedules.php** - Detailed Laravel-based checker

## Next Steps

1. Run the checker to see current database state
2. Try creating a new schedule
3. Run the checker again to verify it was saved
4. Report any issues you find with specific error messages
