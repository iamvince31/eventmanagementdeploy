# Sunday Exclusion Implementation

## Overview
Sundays are now excluded from event date selection and scheduling throughout the system. This prevents events from being scheduled on Sundays and ensures that multi-day events spanning weeks do not incorrectly highlight Sundays.

## Changes Made

### Frontend Changes

#### 1. DatePicker Component (`frontend/src/components/DatePicker.jsx`)
- Updated `isDateDisabled()` function to check if a date is Sunday (day === 0)
- Sundays are now disabled and cannot be selected
- Added tooltip on Sunday dates: "Sundays are not available"
- Updated legend to show "Unavailable" instead of "Past Date" and added note "Sundays are excluded"
- Previous and next month Sundays are also visually dimmed (text-gray-200 vs text-gray-300)

```javascript
const isDateDisabled = (day) => {
  const date = new Date(year, month, day);
  
  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  // Check if date is Sunday (0 = Sunday)
  const isSunday = date.getDay() === 0;
  
  return date < today || isSunday;
};

// Current month days rendering
for (let day = 1; day <= daysInMonth; day++) {
  const date = new Date(year, month, day);
  const isSunday = date.getDay() === 0;
  const disabled = isDateDisabled(day);
  
  // Sundays get gray background and are disabled
  <button
    disabled={disabled}
    title={isSunday ? 'Sundays are not available' : ''}
    className={disabled ? 'text-gray-300 bg-gray-100 cursor-not-allowed' : '...'}
  >
    {day}
  </button>
}
```

#### 2. Calendar Component (`frontend/src/components/Calendar.jsx`)
- Added `isSunday` check for each calendar cell
- Sundays are visually dimmed (opacity-40) and have a gray background
- Sundays are not clickable (cursor-not-allowed)
- Added tooltip on Sunday cells: "Sundays are not available for events"
- Prevents date selection on Sundays in the onClick handler

```javascript
const isSunday = cellDate.getDay() === 0;

// In onClick handler:
onClick={() => {
  if (isCurrentMonth && !isSunday) {
    // ... handle date selection
  }
}}
```

### Backend Changes

#### 1. EventController (`backend/app/Http/Controllers/EventController.php`)

**store() method:**
- Added Sunday validation after date validation
- Returns 422 error if date is Sunday
- Error message: "Events cannot be scheduled on Sundays."

```php
// Validate that the date is not a Sunday
$eventDate = new \DateTime($request->date);
if ($eventDate->format('w') == 0) { // 0 = Sunday
    return response()->json([
        'error' => 'Events cannot be scheduled on Sundays.'
    ], 422);
}
```

**update() method:**
- Added Sunday validation when date is being updated
- Same validation logic as store method
- Only validates if 'date' field is present in request

#### 2. DefaultEventController (`backend/app/Http/Controllers/DefaultEventController.php`)

**updateDate() method:**
- Added Sunday validation for both start date and end date
- Uses Carbon's `dayOfWeek` property (0 = Sunday)
- Validates before school year validation
- Error messages:
  - "Events cannot be scheduled on Sundays." (for start date)
  - "Event end date cannot be on a Sunday." (for end date)

```php
// Validate that the date is not a Sunday
$date = \Carbon\Carbon::parse($request->date);
if ($date->dayOfWeek === 0) { // 0 = Sunday
    return response()->json([
        'error' => 'Events cannot be scheduled on Sundays.'
    ], 422);
}

// Validate that end_date is not a Sunday if provided
if ($request->end_date) {
    $endDate = \Carbon\Carbon::parse($request->end_date);
    if ($endDate->dayOfWeek === 0) { // 0 = Sunday
        return response()->json([
            'error' => 'Event end date cannot be on a Sunday.'
        ], 422);
    }
}
```

## User Experience

### Visual Indicators
1. **DatePicker**: Sundays appear grayed out with reduced opacity, matching the style of past dates
2. **Calendar**: Sundays have a gray background and are dimmed, clearly indicating they're unavailable
3. **Tooltips**: Hovering over Sunday dates shows explanatory messages
4. **Legend**: Updated to clarify that unavailable dates include both past dates and Sundays

### Error Handling
1. **Frontend**: Prevents Sunday selection entirely - users cannot click on Sunday dates
2. **Backend**: Returns clear error messages if Sunday dates are submitted
3. **Validation**: Occurs at multiple levels (frontend UI, backend API) for robust protection

## Testing Recommendations

### Frontend Testing
1. Open DatePicker and verify Sundays are disabled
2. Try clicking on a Sunday in the Calendar - should not be selectable
3. Hover over Sunday dates to see tooltips
4. Verify multi-day events spanning weeks don't highlight Sundays

### Backend Testing
1. Try creating an event with a Sunday date via API - should return 422 error
2. Try updating an event to a Sunday date - should return 422 error
3. Try setting a default event date to Sunday - should return 422 error
4. Try setting a default event end_date to Sunday - should return 422 error

### Test Cases
```bash
# Test event creation with Sunday date
curl -X POST /api/events \
  -H "Authorization: Bearer {token}" \
  -d '{"date": "2026-03-08", "title": "Test", "location": "Test", "time": "10:00"}'
# Expected: 422 error "Events cannot be scheduled on Sundays."

# Test default event date update to Sunday
curl -X PUT /api/default-events/1/date \
  -H "Authorization: Bearer {token}" \
  -d '{"date": "2026-03-08", "school_year": "2025-2026"}'
# Expected: 422 error "Events cannot be scheduled on Sundays."
```

## Impact on Existing Features

### Multi-Day Events
- Events spanning multiple days will automatically skip Sundays in highlighting
- The calendar will show the event range but Sundays within that range will remain grayed out
- This solves the original issue where week-long events incorrectly emphasized Sundays

### Default Events
- Academic calendar events cannot be set to start or end on Sundays
- When moving events between months, Sunday dates are automatically excluded
- School year events respect the Sunday exclusion rule

### Event Scheduling
- All event creation and editing forms now prevent Sunday selection
- Existing events scheduled on Sundays (if any) can be edited but must be moved to a different day
- Reschedule requests cannot propose Sunday dates

## Technical Notes

### Date Comparison Methods
- **JavaScript**: `date.getDay() === 0` (where 0 = Sunday)
- **PHP DateTime**: `$date->format('w') == 0` (where 0 = Sunday)
- **PHP Carbon**: `$date->dayOfWeek === 0` (where 0 = Sunday)

### Validation Order
1. Required field validation
2. Date format validation
3. Sunday validation (NEW)
4. Past date validation
5. School year range validation (for default events)

## Future Enhancements

Potential improvements for consideration:
1. Make excluded days configurable (e.g., exclude Saturdays too)
2. Add admin setting to customize which days are excluded
3. Show a more prominent message when users try to select excluded days
4. Add bulk validation for recurring events
5. Provide alternative date suggestions when Sunday is selected

## Files Modified

### Frontend
- `frontend/src/components/DatePicker.jsx`
- `frontend/src/components/Calendar.jsx`

### Backend
- `backend/app/Http/Controllers/EventController.php`
- `backend/app/Http/Controllers/DefaultEventController.php`

## Rollback Instructions

If this feature needs to be reverted:

1. Remove Sunday checks from `isDateDisabled()` in DatePicker.jsx
2. Remove `isSunday` variable and checks from Calendar.jsx
3. Remove Sunday validation blocks from EventController store() and update() methods
4. Remove Sunday validation blocks from DefaultEventController updateDate() method
5. Revert legend text in DatePicker.jsx to original "Past Date" label
