# Time Format Fix for Event Requests

## Summary
Fixed the "Invalid Date" issue that appeared when displaying event request times. The problem was caused by incorrect time field casting in the EventRequest model.

## Problem
When viewing approved event requests, the time would display as "Invalid Date" instead of showing the actual time (e.g., "2:00 PM"). This occurred because:
1. The time field was being cast as `'datetime:H:i'` in the EventRequest model
2. This caused Laravel to try to parse the time string as a full datetime, which failed
3. When creating events from approved requests, the invalid time format was passed to the Event model

## Solution

### 1. EventRequest Model - Removed Incorrect Cast
**File**: `backend/app/Models/EventRequest.php`

Removed the problematic cast:
```php
// BEFORE
'time' => 'datetime:H:i',

// AFTER
// (removed - time is now treated as a string)
```

The time field should be stored and retrieved as a simple string in "H:i" format (e.g., "14:30", "09:00").

### 2. EventRequestController - Added Time Formatting
**File**: `backend/app/Http/Controllers/EventRequestController.php`

Added proper time formatting in `createEventFromRequest()` method:
```php
// Format time properly - ensure it's in H:i format
$time = $eventRequest->time;
if ($time instanceof \DateTime) {
    $time = $time->format('H:i');
} elseif (is_string($time) && strlen($time) > 5) {
    // If it's a full datetime string, extract just the time part
    $time = date('H:i', strtotime($time));
}
```

This ensures that regardless of how the time is stored, it's properly formatted as "H:i" before creating the event.

## How Time Should Be Handled

### Storage:
- Time should be stored in the database as a string in "H:i" format
- Examples: "14:30", "09:00", "16:45"
- Database column type: `TIME` or `VARCHAR`

### Display:
- Frontend can format for display: "2:30 PM", "9:00 AM", "4:45 PM"
- Use JavaScript Date formatting or moment.js

### Validation:
- Backend validates time format in EventController
- Frontend uses time input type which ensures proper format

## Benefits

1. **Correct Display**: Times now show properly in event requests
2. **Consistent Format**: Time is always in "H:i" format throughout the system
3. **No Parsing Errors**: Eliminates datetime parsing issues
4. **Backward Compatible**: Handles both string and datetime objects

## Testing Checklist
- [ ] Create event request with time "14:30" → Displays correctly
- [ ] View event request → Time shows as "2:30 PM" (or similar)
- [ ] Approve request → Event created with correct time
- [ ] View created event → Time displays correctly
- [ ] Event appears on calendar at correct time

## Files Modified
- `backend/app/Models/EventRequest.php`
- `backend/app/Http/Controllers/EventRequestController.php`

## Date
March 11, 2026
