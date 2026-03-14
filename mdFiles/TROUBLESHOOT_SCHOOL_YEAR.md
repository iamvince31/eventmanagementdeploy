# Troubleshooting School Year Not Saving

## Issue
School year is not being saved to the database when creating events.

## Diagnostic Steps

### 1. Check Database Column
Run the test script to verify the column exists:
```bash
cd backend
php test-school-year-save.php
```

This will show:
- If the `school_year` column exists
- Latest event and its school_year value
- All recent events with their school years

### 2. Check Browser Console
When creating an event, check the browser console (F12) for:
- "School year calculated: [value] for date: [date]"
- "Initial school year: [value]"
- "Submitting with school_year: [value]"

These logs confirm the school year is being calculated and sent.

### 3. Check Network Tab
In browser DevTools Network tab:
1. Create an event
2. Find the POST request to `/api/events`
3. Check the "Payload" or "Form Data" section
4. Verify `school_year` is included

### 4. Check Backend Logs
Check Laravel logs for any errors:
```bash
cd backend
tail -f storage/logs/laravel.log
```

## Common Issues & Solutions

### Issue 1: Column Doesn't Exist
**Symptom**: Test script shows "school_year column DOES NOT EXIST"

**Solution**: Run the migration
```bash
cd backend
php artisan migrate --path=database/migrations/2026_03_09_100000_add_school_year_to_events_table.php
```

### Issue 2: School Year is Empty String
**Symptom**: Console shows "Submitting with school_year: " (empty)

**Solution**: 
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Check if date is being set properly

### Issue 3: Backend Not Accepting school_year
**Symptom**: Column exists but value is NULL in database

**Solution**: Verify Event model has school_year in fillable array
```php
// backend/app/Models/Event.php
protected $fillable = [
    'title',
    'description',
    'location',
    'date',
    'time',
    'school_year',  // <-- Must be here
    'host_id',
    // ...
];
```

### Issue 4: Frontend Not Calculating
**Symptom**: School year field is empty in the form

**Solution**:
1. Check if date is set
2. Verify the calculation function is working
3. Check browser console for errors

## Manual Test

### Create Event Manually:
```sql
-- Connect to your database and run:
UPDATE events 
SET school_year = '2025-2026' 
WHERE id = [your_event_id];
```

Then view the event in the calendar to verify the blue box appears.

## Expected Behavior

1. **Form Load**: School year field shows calculated value (e.g., "2025-2026")
2. **Date Change**: School year updates automatically
3. **Form Submit**: Console shows "Submitting with school_year: 2025-2026"
4. **Database**: events table has school_year value
5. **Display**: Blue box appears in event detail modal

## Debug Checklist

- [ ] Migration ran successfully
- [ ] school_year column exists in events table
- [ ] Event model has school_year in $fillable
- [ ] Browser console shows school year being calculated
- [ ] Network tab shows school_year in form data
- [ ] Database shows school_year value after creating event
- [ ] Blue box appears when viewing event

## Quick Fix

If nothing works, try this complete reset:

1. **Clear everything**:
```bash
# Clear browser cache
Ctrl+Shift+Delete

# Clear Laravel cache
cd backend
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

2. **Verify migration**:
```bash
php artisan migrate:status
```

3. **Create a test event** and check database immediately:
```sql
SELECT id, title, date, school_year FROM events ORDER BY id DESC LIMIT 1;
```

## Contact Points

If school_year is still not saving:
1. Check the console logs (both browser and Laravel)
2. Verify the POST request payload
3. Check database directly after creating event
4. Review Event model fillable array
