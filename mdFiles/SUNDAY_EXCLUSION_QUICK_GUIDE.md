# Sunday Exclusion - Quick Reference Guide

## What Changed?
Sundays are now excluded from all event scheduling throughout the system.

## Why?
When events span 1+ weeks, Sundays were being incorrectly highlighted in the calendar. By excluding Sundays entirely, we ensure clean date ranges and prevent scheduling conflicts.

## User Impact

### What Users Will See:
1. **DatePicker**: Sundays appear grayed out and cannot be clicked
2. **Calendar**: Sundays have a gray background and show "Sundays are not available for events" on hover
3. **Error Messages**: If somehow a Sunday date is submitted, users see: "Events cannot be scheduled on Sundays."

### What Users Can Do:
- Select any day Monday-Saturday for events
- Create multi-day events that automatically skip Sundays
- Edit existing events to any non-Sunday date

### What Users Cannot Do:
- Schedule new events on Sundays
- Move existing events to Sundays
- Set default/academic events to start or end on Sundays

## Technical Implementation

### Frontend Validation
```javascript
// DatePicker & Calendar
const isSunday = date.getDay() === 0; // 0 = Sunday
if (isSunday) {
  // Disable the date
}
```

### Backend Validation
```php
// EventController & DefaultEventController
$eventDate = new \DateTime($request->date);
if ($eventDate->format('w') == 0) { // 0 = Sunday
    return response()->json([
        'error' => 'Events cannot be scheduled on Sundays.'
    ], 422);
}
```

## Testing

### Quick Test Steps:
1. Open the event creation form
2. Try to select a Sunday in the date picker → Should be disabled
3. Click on a Sunday in the calendar → Should not be selectable
4. Hover over a Sunday → Should show tooltip

### API Test:
```bash
# This should fail with 422 error
curl -X POST /api/events \
  -H "Authorization: Bearer {token}" \
  -d '{"date": "2026-03-08", "title": "Test", "location": "Test", "time": "10:00"}'
```

## Files Modified
- `frontend/src/components/DatePicker.jsx` - Added Sunday detection and disabling
- `frontend/src/components/Calendar.jsx` - Added Sunday visual styling and click prevention
- `backend/app/Http/Controllers/EventController.php` - Added Sunday validation in store() and update()
- `backend/app/Http/Controllers/DefaultEventController.php` - Added Sunday validation in updateDate()

## Verification
Run the test script to verify validation logic:
```bash
php backend/test-sunday-validation.php
```

Expected output: Sunday (2026-03-08) should show "❌ BLOCKED"

## Support
If users report issues:
1. Check browser console for JavaScript errors
2. Verify backend logs for validation errors
3. Confirm date format is correct (YYYY-MM-DD)
4. Test with the validation script above
