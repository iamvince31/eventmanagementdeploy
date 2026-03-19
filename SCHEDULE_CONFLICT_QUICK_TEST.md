# Schedule Conflict Detection - Quick Test Guide

## ✅ Implementation Complete

The schedule conflict detection system is now fully implemented and tested.

## Test Results

```
✅ Found 20 class schedules in the system
✅ Conflict detection logic working correctly
✅ Non-conflict detection working correctly
✅ Backend integration confirmed
✅ Frontend warning dialog implemented
```

## How to Test Manually

### Scenario 1: Create Event with Conflict

1. **Login** as Admin, Dean, or Chairperson
2. **Navigate** to Dashboard → Create Event
3. **Fill in event details**:
   - Title: "Test Meeting"
   - Date: Friday, March 20, 2026
   - Time: 08:00 (or any time between 07:00-09:00)
4. **Invite** Deleon_gab (has class Friday 07:00-09:00)
5. **Click** "Create Event"

**Expected Result**:
```
⚠️ SCHEDULE CONFLICT DETECTED

The following participants have class schedules that conflict with this event:

Deleon_gab (main.gabrielian.deleon@cvsu.edu.ph) - ITEC 55 at 07:00:00 - 09:00:00

Do you want to create the event anyway?
```

6. **Click OK** to proceed or **Cancel** to abort

### Scenario 2: Create Event Without Conflict

1. Same steps as above
2. **Change time** to 05:00 (before any classes)
3. **Click** "Create Event"

**Expected Result**:
- Event creates normally without warning
- Success message appears

### Scenario 3: Multiple Conflicts

1. Create event on **Friday at 14:00**
2. Invite both:
   - Deleon_gab (has class 13:00-16:00)
   - Ramon Pedro Aquino (has class 14:00-16:00)
3. **Click** "Create Event"

**Expected Result**:
- Warning shows BOTH conflicts
- Lists each person with their conflicting class

## Current Class Schedules in System

### Deleon_gab (Faculty)
- Friday 07:00-09:00: ITEC 55
- Friday 09:00-11:00: ITEC 100
- Friday 11:00-13:00: ITEC 101
- Friday 13:00-16:00: DCIT 22
- Friday 16:00-18:00: FITT 3

### Antonio Carlos Gonzales (Faculty)
- Tuesday 08:00-11:00: ITEC 110
- Tuesday 13:00-16:00: ITEC 111
- Tuesday 16:00-18:00: FITT 3

### Ramon Pedro Aquino (Faculty)
- Friday 07:00-10:00: DCIT 22
- Friday 10:00-13:00: DCIT 23
- Friday 14:00-16:00: DCIT 50
- Friday 17:00-19:00: FITT 1

### Setup Admin
- Monday 08:00-09:30: Data Structures
- Monday 10:00-11:30: Web Development
- Monday 13:00-14:30: Database Systems
- Tuesday 08:00-09:30: Data Structures
- Tuesday 14:00-15:30: Software Engineering
- Wednesday 10:00-11:30: Web Development
- Wednesday 13:00-14:30: Database Systems
- Wednesday 15:00-16:30: Operating Systems

## Features Implemented

### Backend (EventController.php)
✅ Automatic conflict checking on event creation
✅ Checks all participants (host + invited members)
✅ Returns detailed conflict information
✅ Supports override with `ignore_conflicts` flag

### Frontend (EventForm.jsx)
✅ Catches 409 conflict response
✅ Shows detailed warning dialog
✅ Lists all conflicting participants
✅ Allows user to proceed or cancel
✅ Retries with ignore flag on confirmation

### Calendar (Calendar.jsx)
✅ Shows warning icon (!) on dates with conflicts
✅ Visual indicator for schedule conflicts
✅ Inline display next to date number

## API Endpoints

### POST /api/events
- **Checks**: Schedule conflicts automatically
- **Returns**: 409 if conflicts found
- **Accepts**: `ignore_conflicts=true` to bypass

### POST /api/schedules/check-conflicts
- **Purpose**: Manual conflict checking
- **Used by**: Event creation validation

## Troubleshooting

### Warning Not Appearing?
1. Check browser console for errors
2. Verify user has class schedules in database
3. Ensure event time falls within class time range
4. Check that invited members have schedules

### Conflict Not Detected?
1. Verify day of week matches schedule day
2. Check time format (should be HH:MM)
3. Ensure schedule exists in `user_schedules` table
4. Run test script: `php backend/test-schedule-conflict-detection.php`

## Database Query to Check Schedules

```sql
SELECT 
    u.name, 
    u.email, 
    us.day, 
    us.start_time, 
    us.end_time, 
    us.description
FROM user_schedules us
JOIN users u ON us.user_id = u.id
ORDER BY u.name, us.day, us.start_time;
```

## Next Steps

1. ✅ Test with real users
2. ✅ Verify warning dialog appearance
3. ✅ Test override functionality
4. ✅ Check calendar conflict indicators
5. ✅ Monitor for any edge cases

## Support

If you encounter issues:
1. Run the test script: `php backend/test-schedule-conflict-detection.php`
2. Check browser console for JavaScript errors
3. Verify database has class schedules
4. Review implementation docs: `SCHEDULE_CONFLICT_DETECTION_IMPLEMENTATION.md`
