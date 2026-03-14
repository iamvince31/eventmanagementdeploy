# Default Event Month Movement Feature

## Overview
When a user sets a date for a default academic event that falls in a different month than the event's original default month, the event will automatically move to the designated month in the calendar view. The base event will be hidden to avoid duplication.

## Problem Solved
Previously, when moving an event to a different month, both the base event (in the original month) and the school-year-specific event (in the new month) would appear, causing confusion. Now, when a school-year-specific version exists, the base event is automatically hidden.

## How It Works

### Backend Changes
**File:** `backend/app/Http/Controllers/DefaultEventController.php`

#### 1. Date Update Logic
The `updateDate()` method now:
- Extracts the month from the selected date
- Updates the `month` field to match the selected date's month
- Creates or updates a school-year-specific version with the new month

```php
// Extract the month from the selected date
$newMonth = $date->month;

// When creating or updating the event
$event = DefaultEvent::create([
    'name' => $baseEvent->name,
    'month' => $newMonth, // Use the month from the selected date
    'order' => $baseEvent->order,
    'date' => $request->date,
    'school_year' => $request->school_year,
]);
```

#### 2. Filtering Logic (CRITICAL FIX)
The `index()` method now properly hides base events when school-year-specific versions exist:

```php
// Get all school-year-specific event names
$schoolYearEventNames = $allEvents
    ->where('school_year', $schoolYear)
    ->pluck('name')
    ->unique()
    ->toArray();

// Filter events: 
// 1. Include all school-year-specific events
// 2. Include base events ONLY if no school-year-specific version exists
foreach ($allEvents as $event) {
    $isSchoolYearSpecific = $event->school_year === $schoolYear;
    $hasSchoolYearVersion = in_array($event->name, $schoolYearEventNames);
    
    // Include if it's school-year-specific OR if it's a base event with no school-year version
    if ($isSchoolYearSpecific || !$hasSchoolYearVersion) {
        // Add to results
    }
}
```

### Frontend Changes
**File:** `frontend/src/pages/DefaultEvents.jsx`

The `handleSaveDate()` function now:
1. Saves the date via API
2. Refreshes the entire events list to reflect the new month grouping
3. The event automatically appears in the correct month section
4. The base event is automatically hidden

```javascript
// Refresh the events list to show the event in the correct month
await fetchDefaultEvents();
```

## Example Scenario

### Initial State:
- Event: "Midterm Exam"
- Base Event Month: April
- Date: Not set
- Visible in: April section (base event)

### After Setting Date to May 4, 2026:
- Event: "Midterm Exam"
- School-Year Event Month: May (automatically updated)
- Date: May 4, 2026
- Visible in: May section (school-year-specific event)
- Hidden in: April section (base event is now hidden)

### Result:
- Only ONE "Midterm Exam" event appears (in May)
- No duplicate in April
- Clean, intuitive display

## Visual Behavior

The UI displays events grouped by month in academic year order:
- September → October → November → December → January
- February → March → April → May → June
- July → August

When you set a date:
1. Click "Set" or "Edit" button on an event
2. Select a date from the date picker
3. Click "Save"
4. The event disappears from its original month section
5. The event appears in the new month section corresponding to the selected date
6. No duplicate appears in the original month

## Technical Details

### Database Structure
- `default_events` table has a `month` field (1-12)
- Base events have `school_year = NULL`
- School-year-specific events have `school_year = 'YYYY-YYYY'`
- When a date is set, a school-year-specific version is created with the new month

### Filtering Rules
1. If an event has a school-year-specific version, hide the base event
2. Show school-year-specific events in their designated month
3. Show base events only if no school-year-specific version exists
4. This applies regardless of whether the months match

### Validation
- Date must be within the school year (September to August)
- Month is automatically calculated from the date
- No manual month selection needed

## Testing

### Manual Testing
1. Go to Default Events page
2. Find an event in any month (e.g., "Midterm Exam" in April)
3. Click "Set" or "Edit"
4. Select a date in a different month (e.g., May 15, 2026)
5. Click "Save"
6. Verify:
   - Event appears in May section with the date
   - Event does NOT appear in April section
   - No duplicate entries

### Automated Testing
Run the test script:
```bash
# From project root
php backend/test-hide-base-event.php
```

This will:
1. Find a base event in April
2. Create a school-year-specific version in May
3. Verify the base event is hidden
4. Verify the school-year event appears in May
5. Confirm no duplicates exist

## Benefits

1. **No Duplicates**: Base events are automatically hidden when moved
2. **Intuitive Organization**: Events appear only in the month they're scheduled
3. **Automatic Grouping**: No manual month reassignment needed
4. **Visual Clarity**: Calendar view accurately reflects when events occur
5. **Flexible Scheduling**: Events can be moved across months by simply changing the date
6. **Clean Display**: Each event appears exactly once in the correct location
