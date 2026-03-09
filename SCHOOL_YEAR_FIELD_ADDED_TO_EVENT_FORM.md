# School Year Auto-Calculation for Events

## Overview
School year is now automatically calculated based on the event date, matching the logic used in the academic events page. Users no longer need to manually enter the school year.

## School Year Calculation Logic

The school year is determined based on the event date:

- **September to December**: School year is `CurrentYear-NextYear`
  - Example: September 2025 → "2025-2026"
  
- **January to August**: School year is `PreviousYear-CurrentYear`
  - Example: March 2026 → "2025-2026"

This matches the academic calendar where:
- School year starts in September
- School year ends in August

## Implementation

### Auto-Calculation Function:
```javascript
const getSchoolYearFromDate = (dateString) => {
  if (!dateString) return '';
  
  const dateObj = new Date(dateString);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1; // 1-12
  
  // If we're in Sept-Dec, school year is current-next
  // If we're in Jan-Aug, school year is previous-current
  if (month >= 9) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};
```

### Auto-Update on Date Change:
```javascript
useEffect(() => {
  if (date) {
    const calculatedSchoolYear = getSchoolYearFromDate(date);
    setSchoolYear(calculatedSchoolYear);
  }
}, [date]);
```

## UI Changes

### School Year Field:
- **Label**: "School Year"
- **Type**: Read-only text input
- **Style**: Gray background (`bg-gray-50`) with disabled cursor
- **Helper Text**: "Automatically determined based on event date"
- **Icon**: Book icon (matching academic events)

### User Experience:
1. User selects an event date
2. School year automatically updates
3. Field is read-only (cannot be manually edited)
4. School year is saved with the event

## Examples

| Event Date | Calculated School Year |
|------------|----------------------|
| September 1, 2025 | 2025-2026 |
| December 15, 2025 | 2025-2026 |
| January 10, 2026 | 2025-2026 |
| June 30, 2026 | 2025-2026 |
| July 15, 2026 | 2025-2026 |
| August 31, 2026 | 2025-2026 |
| September 1, 2026 | 2026-2027 |

## Blue Box Display

When viewing the event in the calendar:
- Blue information box appears with the calculated school year
- Shows "SCHOOL YEAR" label with the value
- "Regular Event" badge at the bottom
- Matches the academic event design pattern

## Benefits

1. **Consistency**: Uses the same logic as academic events
2. **Accuracy**: No manual entry errors
3. **Simplicity**: One less field for users to fill
4. **Automatic**: Updates instantly when date changes
5. **Visual Feedback**: Users can see the school year before submitting

## Files Modified

- `frontend/src/components/EventForm.jsx`
  - Added `getSchoolYearFromDate()` function
  - Added `useEffect` to auto-update school year
  - Changed input to read-only
  - Updated helper text

## Testing

1. **Create Event in September-December**:
   - Select date in Sept-Dec 2025
   - Verify school year shows "2025-2026"

2. **Create Event in January-August**:
   - Select date in Jan-Aug 2026
   - Verify school year shows "2025-2026"

3. **Change Date**:
   - Select September 2025 date
   - Change to March 2026
   - Verify school year remains "2025-2026"
   - Change to September 2026
   - Verify school year updates to "2026-2027"

4. **View Event**:
   - Create event with any date
   - View in calendar
   - Verify blue box shows correct school year

## Notes

- School year is always calculated, never null
- Field is read-only to prevent manual editing
- Calculation happens automatically on date change
- Matches academic calendar year boundaries (Sept-Aug)
