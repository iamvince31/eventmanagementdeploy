# Schedule Conflict Detection Implementation

## Problem Statement
When an admin/dean/chairperson creates an event or meeting, there was no warning if the event time conflicts with a faculty member's class schedule. This could lead to double-booking and scheduling issues.

## Solution Overview
Implemented automatic schedule conflict detection that:
1. Checks all participants (host + invited members) for schedule conflicts
2. Shows a detailed warning dialog when conflicts are detected
3. Allows the admin to proceed anyway if needed (with confirmation)

## Changes Made

### Backend Changes

#### 1. EventController.php - Added Conflict Checking

**Location**: `backend/app/Http/Controllers/EventController.php`

**Added to `store()` method** (after line 138):
```php
// Check for schedule conflicts with all participants (host + members)
$allParticipantIds = array_merge([$user->id], $memberIds);
$conflicts = $this->checkScheduleConflicts($allParticipantIds, $request->date, $request->time);

// If conflicts exist and not explicitly ignored, return warning
if (!empty($conflicts) && !$request->ignore_conflicts) {
    return response()->json([
        'warning' => 'schedule_conflict',
        'message' => 'Some participants have schedule conflicts',
        'conflicts' => $conflicts
    ], 409); // 409 Conflict status code
}
```

**Added new helper method** `checkScheduleConflicts()`:
```php
private function checkScheduleConflicts(array $userIds, string $date, string $time)
{
    // Get day of week
    $dateObj = new \DateTime($date);
    $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    $dayName = $days[$dateObj->format('w')];

    // Parse event time (handles AM/PM format)
    $timeParts = explode(':', $time);
    $eventHour = (int)$timeParts[0];
    $eventMinute = isset($timeParts[1]) ? (int)$timeParts[1] : 0;
    
    if (stripos($time, 'pm') !== false && $eventHour < 12) {
        $eventHour += 12;
    } elseif (stripos($time, 'am') !== false && $eventHour === 12) {
        $eventHour = 0;
    }
    
    $eventTimeStr = sprintf('%02d:%02d', $eventHour, $eventMinute);

    // Get schedules for all users on that day
    $schedules = \App\Models\UserSchedule::whereIn('user_id', $userIds)
        ->where('day', $dayName)
        ->with('user:id,name,email')
        ->get();

    // Check for conflicts
    $conflicts = [];
    foreach ($schedules as $schedule) {
        if ($eventTimeStr >= $schedule->start_time && $eventTimeStr < $schedule->end_time) {
            $conflicts[] = [
                'user_id' => $schedule->user_id,
                'username' => $schedule->user->name,
                'email' => $schedule->user->email,
                'class_time' => $schedule->start_time . ' - ' . $schedule->end_time,
                'class_description' => $schedule->description
            ];
        }
    }

    return $conflicts;
}
```

### Frontend Changes

#### 2. EventForm.jsx - Added Conflict Warning Dialog

**Location**: `frontend/src/components/EventForm.jsx`

**Modified `handleSubmit()` error handling**:
```javascript
catch (err) {
  // Handle schedule conflict warning (409 status)
  if (err.response?.status === 409 && err.response?.data?.warning === 'schedule_conflict') {
    const conflicts = err.response.data.conflicts;
    const conflictDetails = conflicts.map(c => 
      `${c.username} (${c.email}) - ${c.class_description} at ${c.class_time}`
    ).join('\n');
    
    const confirmMessage = `⚠️ SCHEDULE CONFLICT DETECTED\n\nThe following participants have class schedules that conflict with this event:\n\n${conflictDetails}\n\nDo you want to create the event anyway?`;
    
    if (window.confirm(confirmMessage)) {
      // User confirmed - retry with ignore_conflicts flag
      formData.append('ignore_conflicts', 'true');
      
      // Retry the API call...
    }
  }
}
```

## How It Works

### Flow Diagram
```
Admin creates event with participants
         ↓
Backend checks all participants' schedules
         ↓
    Conflicts found?
         ↓
    YES → Return 409 with conflict details
         ↓
Frontend shows warning dialog
         ↓
User confirms to proceed?
         ↓
    YES → Retry with ignore_conflicts=true
         ↓
Event created successfully
```

### Conflict Detection Logic

1. **Participant Collection**: Includes both the event host and all invited members
2. **Day Matching**: Converts event date to day of week (Monday, Tuesday, etc.)
3. **Time Parsing**: Handles both 24-hour and AM/PM time formats
4. **Range Checking**: Checks if event time falls within any class schedule time range
5. **Conflict Reporting**: Returns detailed information about each conflict

### Example Conflict Warning

```
⚠️ SCHEDULE CONFLICT DETECTED

The following participants have class schedules that conflict with this event:

John Doe (john.doe@example.com) - Advanced Programming at 14:00 - 16:00
Jane Smith (jane.smith@example.com) - Database Systems at 13:00 - 15:00

Do you want to create the event anyway?
```

## Testing Scenarios

### Test Case 1: Faculty with Class Schedule
1. Create a faculty member with a class schedule (e.g., Monday 2:00 PM - 4:00 PM)
2. As admin, create an event on Monday at 3:00 PM
3. Invite the faculty member
4. **Expected**: Warning dialog appears showing the conflict
5. Click "OK" to proceed or "Cancel" to abort

### Test Case 2: Multiple Conflicts
1. Create multiple faculty members with overlapping schedules
2. Create an event that conflicts with all of them
3. **Expected**: Warning shows all conflicts in a list

### Test Case 3: No Conflicts
1. Create an event at a time when no participants have classes
2. **Expected**: Event creates normally without warning

### Test Case 4: Host Has Conflict
1. Admin (host) has a class schedule
2. Admin creates event during their own class time
3. **Expected**: Warning appears for the host's own conflict

## Benefits

✅ Prevents accidental double-booking
✅ Shows detailed conflict information
✅ Allows override when necessary (with explicit confirmation)
✅ Works for all participants (host + members)
✅ Handles both 12-hour and 24-hour time formats
✅ Checks against actual class schedules in database

## API Response Format

### Conflict Response (409)
```json
{
  "warning": "schedule_conflict",
  "message": "Some participants have schedule conflicts",
  "conflicts": [
    {
      "user_id": 5,
      "username": "John Doe",
      "email": "john.doe@example.com",
      "class_time": "14:00 - 16:00",
      "class_description": "Advanced Programming"
    }
  ]
}
```

### Success Response (201)
```json
{
  "message": "Event created successfully",
  "event": { ... }
}
```

## Notes

- The `ignore_conflicts` flag is only sent after user confirmation
- Conflicts are checked on every event creation attempt
- The feature works for both events and meetings
- Calendar view also shows conflict indicators (!) on dates with conflicts
