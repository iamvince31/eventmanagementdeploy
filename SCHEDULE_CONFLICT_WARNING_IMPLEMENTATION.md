# Schedule Conflict Warning Implementation

## Overview
Added inline warning indicator (!) next to date numbers in the calendar when schedule conflicts are detected.

## What Was Changed

### Calendar.jsx
1. **Added `hasConflicts()` function** - Detects time overlaps between:
   - Regular events with specific times
   - Class schedules with time ranges
   - Multiple events at the same time

2. **Updated date display** - Shows red exclamation mark (!) inline with date number when conflicts exist

## How It Works

### Conflict Detection Logic
```javascript
hasConflicts(dateStr) {
  // Collects all timed events (regular + schedules)
  // Checks for time overlaps:
  //   - Schedule vs Schedule: Range overlap check
  //   - Event vs Event: Same time check
  //   - Schedule vs Event: Point-in-range check
  // Returns true if any overlap found
}
```

### Visual Indicator
- **Format**: `24 !` (date number followed by red exclamation mark)
- **Color**: Red (#ef4444)
- **Tooltip**: "Schedule conflict detected"
- **Only shows**: On current month dates that are not in the past

## Example Scenarios

### Conflict Detected ✓
- Two events scheduled at 2:00 PM on the same day
- Class schedule 1:00-3:00 PM + Event at 2:00 PM
- Two overlapping class schedules

### No Conflict ✗
- Event at 9:00 AM + Event at 2:00 PM (different times)
- Class schedule 1:00-2:00 PM + Event at 2:30 PM (no overlap)
- All-day events (not time-specific)

## Visual Example
```
Before:  24
After:   24 !  (when conflict exists)
```

## Testing
1. Create two events at the same time on the same date
2. Check calendar - date should show "24 !" format
3. Hover over "!" to see tooltip
4. Past dates and other months won't show the indicator

## Benefits
- Immediate visual feedback of scheduling conflicts
- Helps users avoid double-booking
- Non-intrusive inline display
- Works with both events and class schedules
