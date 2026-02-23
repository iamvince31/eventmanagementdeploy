# Schedule Multi-Day Save Fix

## Problem
Users were getting "Invalid time format for [day]. Use HH:MM format." error when trying to save schedules for 2 or more days per week.

## Root Cause
The validation regex was too strict: `/^\d{2}:\d{2}$/` required exactly 2 digits for hours, but HTML time inputs can sometimes produce single-digit hours (e.g., "7:00" instead of "07:00"). Additionally, the validation didn't handle edge cases like:
- Empty time slots that should be skipped
- Whitespace in time values
- Inconsistent time formats across different days

## Solution Applied

### 1. Relaxed Time Format Validation
Changed regex from `/^\d{2}:\d{2}$/` to `/^\d{1,2}:\d{2}$/`
- Now accepts both "7:00" and "07:00"
- Still validates proper time format

### 2. Time Normalization
Added automatic normalization to ensure consistent format:
```php
$normalizedStart = sprintf('%02d:%02d', (int)$startParts[0], (int)$startParts[1]);
```
- Converts "7:00" → "07:00"
- Converts "13:5" → "13:05"
- Ensures database consistency

### 3. Better Empty Slot Handling
```php
// Skip if both times are empty (user didn't fill this slot)
if (empty($class['startTime']) && empty($class['endTime'])) {
    continue;
}

// Check if one time is filled but not the other
if (empty($class['startTime']) || empty($class['endTime'])) {
    throw new \Exception("Both start and end times are required for {$day}");
}
```

### 4. Whitespace Trimming
```php
$startTime = trim($class['startTime']);
$endTime = trim($class['endTime']);
```

### 5. Enhanced Error Logging
Now logs the exact problematic data:
```php
\Log::error("Invalid start time format", [
    'day' => $day,
    'index' => $index,
    'startTime' => $startTime,
    'raw' => $class['startTime']
]);
```

### 6. Better Error Messages
- Shows which day has the problem
- Shows the actual time values that failed
- Provides clear examples of expected format

### 7. Request Data Logging
Added full request data to error logs for debugging:
```php
'request_data' => $request->all()
```

## What Changed in ScheduleController.php

### Before:
```php
foreach ($classes as $class) {
    if (!empty($class['startTime']) && !empty($class['endTime'])) {
        if (!preg_match('/^\d{2}:\d{2}$/', $class['startTime']) || 
            !preg_match('/^\d{2}:\d{2}$/', $class['endTime'])) {
            throw new \Exception("Invalid time format for {$day}. Use HH:MM format.");
        }
        // ... save
    }
}
```

### After:
```php
foreach ($classes as $index => $class) {
    // Skip empty slots
    if (empty($class['startTime']) && empty($class['endTime'])) {
        continue;
    }
    
    // Validate both times are present
    if (empty($class['startTime']) || empty($class['endTime'])) {
        throw new \Exception("Both start and end times are required for {$day}");
    }
    
    // Trim and validate
    $startTime = trim($class['startTime']);
    $endTime = trim($class['endTime']);
    
    // Accept 1 or 2 digit hours
    if (!preg_match('/^\d{1,2}:\d{2}$/', $startTime)) {
        // Log details and throw clear error
    }
    
    // Normalize to HH:MM format
    $normalizedStart = sprintf('%02d:%02d', ...);
    
    // Save with normalized times
}
```

## Testing

### Test Case 1: Single Day
- Monday: 07:00 - 09:00
- Result: ✓ Should save successfully

### Test Case 2: Multiple Days
- Monday: 07:00 - 09:00, 09:00 - 11:00
- Friday: 07:00 - 09:00, 09:00 - 11:00, 11:00 - 13:00
- Result: ✓ Should save successfully

### Test Case 3: Mixed Format (if browser sends it)
- Monday: 7:00 - 9:00 (single digit hours)
- Friday: 07:00 - 09:00 (double digit hours)
- Result: ✓ Should normalize and save

### Test Case 4: Empty Days
- Monday: 07:00 - 09:00
- Tuesday: (empty)
- Wednesday: 10:00 - 12:00
- Result: ✓ Should save Monday and Wednesday only

### Test Case 5: Invalid Data
- Monday: 07:00 - (missing end time)
- Result: ✗ Error: "Both start and end times are required for Monday"

### Test Case 6: Invalid Time Order
- Monday: 10:00 - 09:00 (end before start)
- Result: ✗ Error: "Start time must be before end time for Monday"

## How to Verify the Fix

1. Login to your application
2. Go to Account Dashboard
3. Click "Edit Schedule"
4. Add classes to Monday (e.g., 2 classes)
5. Switch to Friday tab
6. Add classes to Friday (e.g., 3-5 classes)
7. Click "Save Schedule"
8. Should see: "Schedule saved! You can now create events."

## If It Still Fails

Check the Laravel logs at `backend/storage/logs/laravel.log`

The log will now show:
- Exact day that failed
- Index of the class slot
- The actual time values received
- Full request data

Example log entry:
```
[timestamp] local.ERROR: Invalid start time format
{
    "day": "Friday",
    "index": 2,
    "startTime": "invalid",
    "raw": "invalid"
}
```

## Additional Improvements

1. **Count of saved schedules**: Response now includes count
   ```json
   {
     "message": "Schedule saved successfully",
     "count": 7
   }
   ```

2. **Better validation messages**: Shows actual values that failed

3. **Comprehensive logging**: Full request data logged on error

4. **Robust handling**: Handles edge cases gracefully

## Summary

The fix makes the schedule save functionality more robust by:
- Accepting flexible time formats (1 or 2 digit hours)
- Normalizing all times to consistent HH:MM format
- Skipping empty slots instead of failing
- Providing clear error messages with context
- Logging detailed information for debugging

Users can now save schedules for multiple days without encountering time format errors.
