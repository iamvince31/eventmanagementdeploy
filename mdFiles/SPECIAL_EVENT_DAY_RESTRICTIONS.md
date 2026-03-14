# Special Event Day Restrictions Feature

## Summary
Implemented a special event system with day-of-week restrictions. Regular events can only be scheduled Monday-Thursday, while special events can only be scheduled Friday-Sunday. Past dates are blocked for all events.

## Features Implemented

### 1. Event Type System

#### Regular Events (Default)
- Can only be scheduled on: Monday, Tuesday, Wednesday, Thursday
- Blocked days: Friday, Saturday, Sunday
- Use case: Normal academic/work events

#### Special Events (Checkbox)
- Can only be scheduled on: Friday, Saturday, Sunday
- Blocked days: Monday, Tuesday, Wednesday, Thursday
- Use case: Weekend events, special occasions

### 2. Frontend Validation (EventForm)

#### Special Event Checkbox
- Blue-themed checkbox with clear labeling
- Shows current mode: "Regular event (Monday-Thursday only)" or "Can schedule on Friday-Sunday only"
- Located above date/time inputs for visibility

#### Date Input Enhancements
- Shows allowed days in label: "(Mon-Thu)" or "(Fri-Sun)"
- Minimum date set to today (prevents past dates)
- Real-time validation on date change
- Visual feedback: Red border when invalid date selected
- Error messages displayed immediately

#### Validation Logic
```javascript
- Check if date is in the past → Error
- Regular event + (Fri/Sat/Sun) → Error
- Special event + (Mon/Tue/Wed/Thu) → Error
- Otherwise → Valid
```

#### Error Messages
- "Cannot set event date in the past"
- "Regular events can only be scheduled on Monday to Thursday"
- "Special events can only be scheduled on Friday, Saturday, or Sunday"

### 3. Backend Validation (EventController)

#### Database
- Added `is_special_event` boolean column to events table
- Default: false (regular event)

#### Validation Rules
```php
'date' => 'required|date|after_or_equal:today'
'is_special_event' => 'nullable|boolean'
```

#### Day-of-Week Validation
- Calculates day of week from date (0=Sunday, 1=Monday, ..., 6=Saturday)
- Regular events: Only allows days 1-4 (Mon-Thu)
- Special events: Only allows days 0, 5, 6 (Sun, Fri, Sat)
- Returns 422 error with message if invalid

#### Applied To
- Event creation (store method)
- Event updates (update method)

## User Experience

### Creating a Regular Event
1. Open event creation form
2. Checkbox unchecked by default (Regular event)
3. Date label shows "(Mon-Thu)"
4. Select a date
5. If Friday-Sunday selected → Red border + error message
6. If Monday-Thursday selected → Proceeds normally
7. Cannot select past dates

### Creating a Special Event
1. Open event creation form
2. Check "Special Event" checkbox
3. Checkbox turns blue, label updates
4. Date label changes to "(Fri-Sun)"
5. Select a date
6. If Monday-Thursday selected → Red border + error message
7. If Friday-Sunday selected → Proceeds normally
8. Cannot select past dates

### Visual Feedback
- **Valid date**: Normal green border on date input
- **Invalid date**: Red border + error message above form
- **Checkbox checked**: Blue background, checkmark visible
- **Checkbox unchecked**: White background, no checkmark

## Technical Details

### Frontend State
```javascript
const [isSpecialEvent, setIsSpecialEvent] = useState(false);
const [date, setDate] = useState('');
const [error, setError] = useState('');
```

### Validation Function
```javascript
const validateDate = (selectedDate) => {
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();
  
  // Check past date
  if (selected < today) return false;
  
  // Check day restrictions
  if (isSpecialEvent) {
    if (dayOfWeek >= 1 && dayOfWeek <= 4) return false;
  } else {
    if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) return false;
  }
  
  return true;
};
```

### Backend Validation
```php
$dayOfWeek = (int) $date->format('w');

if ($isSpecialEvent) {
    if ($dayOfWeek >= 1 && $dayOfWeek <= 4) {
        return response()->json(['error' => '...'], 422);
    }
} else {
    if ($dayOfWeek === 0 || $dayOfWeek === 5 || $dayOfWeek === 6) {
        return response()->json(['error' => '...'], 422);
    }
}
```

## Day of Week Reference

| Day | Number | Regular Event | Special Event |
|-----|--------|---------------|---------------|
| Sunday | 0 | ❌ Blocked | ✅ Allowed |
| Monday | 1 | ✅ Allowed | ❌ Blocked |
| Tuesday | 2 | ✅ Allowed | ❌ Blocked |
| Wednesday | 3 | ✅ Allowed | ❌ Blocked |
| Thursday | 4 | ✅ Allowed | ❌ Blocked |
| Friday | 5 | ❌ Blocked | ✅ Allowed |
| Saturday | 6 | ❌ Blocked | ✅ Allowed |

## Database Schema

### Migration
```php
Schema::table('events', function (Blueprint $table) {
    $table->boolean('is_special_event')->default(false)->after('time');
});
```

### Event Model
```php
protected $fillable = [
    'title', 'description', 'location', 
    'date', 'time', 'host_id', 'is_special_event'
];

protected $casts = [
    'is_special_event' => 'boolean',
];
```

## Files Modified

### Frontend
- ✅ `frontend/src/components/EventForm.jsx`
  - Added `isSpecialEvent` state
  - Added special event checkbox UI
  - Added `validateDate()` function
  - Added `handleDateChange()` function
  - Added `handleSpecialEventToggle()` function
  - Updated date input with min attribute and validation styling
  - Added day labels to date input
  - Updated form submission to include is_special_event

### Backend
- ✅ `backend/database/migrations/2026_02_24_015727_add_is_special_event_to_events_table.php` (created)
  - Added is_special_event column

- ✅ `backend/app/Models/Event.php`
  - Added is_special_event to fillable
  - Added is_special_event to casts

- ✅ `backend/app/Http/Controllers/EventController.php`
  - Added is_special_event validation (store method)
  - Added day-of-week validation (store method)
  - Added is_special_event validation (update method)
  - Added day-of-week validation (update method)
  - Added after_or_equal:today validation
  - Updated error messages

## Error Handling

### Frontend Errors
- Displayed above form in red alert box
- Clears when valid date selected
- Clears when special event checkbox toggled
- Date input shows red border when error present

### Backend Errors
- Returns 422 status code
- JSON response with error message
- Frontend displays error to user
- Prevents invalid event creation/update

## Use Cases

### Academic Events (Regular)
- Class meetings
- Lab sessions
- Tutorials
- Office hours
- Scheduled on weekdays only

### Special Events
- Weekend workshops
- Social gatherings
- Special seminars
- Holiday events
- Scheduled on weekends only

## Future Enhancements (Optional)
- Custom day restrictions per user/department
- Holiday calendar integration
- Recurring events with day patterns
- Visual calendar highlighting of allowed days
- Bulk event creation with day templates
- Admin override for day restrictions

---
**Date**: February 24, 2026
**Status**: Complete and functional
**Validation**: Both frontend and backend
