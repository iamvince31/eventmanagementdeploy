# 12-Hour Time Format (AM/PM) Implementation

## Changes Made

Converted the schedule time inputs from 24-hour format (`<input type="time">`) to 12-hour format with AM/PM dropdowns.

## What Changed

### 1. Added Time Conversion Functions

```javascript
// Convert 24-hour time to 12-hour AM/PM format
const formatTime12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Convert 12-hour time to 24-hour format
const convertTo24Hour = (hour12, minute, ampm) => {
  let hour = parseInt(hour12);
  if (ampm === 'PM' && hour !== 12) {
    hour += 12;
  } else if (ampm === 'AM' && hour === 12) {
    hour = 0;
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

// Parse 24-hour time into components
const parseTime24 = (time24) => {
  if (!time24) return { hour: '', minute: '', ampm: 'AM' };
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return { hour: String(hour12), minute: minutes, ampm };
};
```

### 2. Replaced Time Inputs with Dropdowns

**Before:**
```jsx
<input type="time" value={slot.startTime} onChange={...} />
```

**After:**
```jsx
<div className="flex items-center gap-1">
  {/* Hour dropdown: 1-12 */}
  <select value={hour}>
    <option value="">HH</option>
    {[...Array(12)].map((_, i) => (
      <option key={i + 1} value={i + 1}>{i + 1}</option>
    ))}
  </select>
  
  {/* Minute dropdown: 00, 15, 30, 45 */}
  <select value={minute}>
    <option value="">MM</option>
    {['00', '15', '30', '45'].map((min) => (
      <option key={min} value={min}>{min}</option>
    ))}
  </select>
  
  {/* AM/PM dropdown */}
  <select value={ampm}>
    <option value="AM">AM</option>
    <option value="PM">PM</option>
  </select>
</div>
```

## How It Works

### Data Flow

1. **Storage**: Times are stored in 24-hour format in the database (e.g., "13:00")
2. **Display**: Times are shown in 12-hour format (e.g., "1:00 PM")
3. **Input**: Users select hour (1-12), minute (00/15/30/45), and AM/PM
4. **Conversion**: On change, the 12-hour time is converted to 24-hour format
5. **Save**: 24-hour format is sent to backend

### Example Conversions

| 12-Hour Input | 24-Hour Stored | Display |
|---------------|----------------|---------|
| 7:00 AM | 07:00 | 7:00 AM |
| 12:00 PM | 12:00 | 12:00 PM |
| 1:00 PM | 13:00 | 1:00 PM |
| 11:45 PM | 23:45 | 11:45 PM |
| 12:00 AM | 00:00 | 12:00 AM |

### Special Cases Handled

1. **12:00 PM (noon)** → 12:00 (not 00:00)
2. **12:00 AM (midnight)** → 00:00 (not 12:00)
3. **1:00 PM** → 13:00 (12 + 1)
4. **Empty values** → Returns empty string, not error

## User Interface

### Edit Mode
Users see three dropdowns for each time:
- **Hour**: 1, 2, 3, ..., 12
- **Minute**: 00, 15, 30, 45
- **Period**: AM, PM

### View Mode
Times are displayed in readable format:
- "7:00 AM - 9:00 AM"
- "1:00 PM - 4:00 PM"

## Benefits

1. **User-Friendly**: Most users are familiar with 12-hour format
2. **No Confusion**: Clear AM/PM indicators
3. **Consistent**: Display and input use same format
4. **Compatible**: Backend still uses 24-hour format for calculations
5. **Validated**: Backend validates the converted 24-hour times

## Testing

### Test Case 1: Morning Class
- Input: 7:00 AM - 9:00 AM
- Stored: 07:00 - 09:00
- Display: 7:00 AM - 9:00 AM
- ✓ Should save successfully

### Test Case 2: Afternoon Class
- Input: 1:00 PM - 4:00 PM
- Stored: 13:00 - 16:00
- Display: 1:00 PM - 4:00 PM
- ✓ Should save successfully

### Test Case 3: Noon
- Input: 12:00 PM - 1:00 PM
- Stored: 12:00 - 13:00
- Display: 12:00 PM - 1:00 PM
- ✓ Should save successfully

### Test Case 4: Midnight
- Input: 12:00 AM - 1:00 AM
- Stored: 00:00 - 01:00
- Display: 12:00 AM - 1:00 AM
- ✓ Should save successfully

### Test Case 5: Evening Class
- Input: 6:00 PM - 9:00 PM
- Stored: 18:00 - 21:00
- Display: 6:00 PM - 9:00 PM
- ✓ Should save successfully

### Test Case 6: Multiple Days
- Monday: 7:00 AM - 9:00 AM, 9:00 AM - 11:00 AM
- Friday: 1:00 PM - 4:00 PM, 4:00 PM - 6:00 PM
- ✓ Should save all classes successfully

## Backend Compatibility

The backend still expects and validates 24-hour format:
- Accepts: "07:00", "13:00", "23:45"
- Validates: HH:MM format with hours 00-23
- Stores: TIME column in database

No backend changes needed - the conversion happens in the frontend.

## Minute Intervals

Currently set to 15-minute intervals: 00, 15, 30, 45

To change to 5-minute intervals, update the minute dropdown:
```jsx
{['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((min) => (
  <option key={min} value={min}>{min}</option>
))}
```

Or for every minute (00-59):
```jsx
{[...Array(60)].map((_, i) => {
  const min = String(i).padStart(2, '0');
  return <option key={min} value={min}>{min}</option>;
})}
```

## Summary

The schedule now uses a user-friendly 12-hour time format with AM/PM dropdowns while maintaining 24-hour format in the backend for consistency and calculations. Users can easily select times without confusion about 24-hour format.
