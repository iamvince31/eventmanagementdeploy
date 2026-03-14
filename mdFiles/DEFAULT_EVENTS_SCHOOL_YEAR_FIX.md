# Default Events School Year Fix

## Problem
Default academic events with set dates from one school year did not appear in other school years. When a user set a date for an event in school year 2024-2025, that event would not show up when viewing school year 2025-2026.

## Root Cause
The original implementation modified the base event record directly, adding both a `date` and `school_year` to it. This made the event specific to only that school year. When querying for a different school year, the event was filtered out.

## Solution
Changed the approach to create school-year-specific copies of events instead of modifying the base event:

1. **Base Events**: Events without a `school_year` value (NULL) are the templates that appear in all school years
2. **School-Year-Specific Events**: When a date is set for an event in a specific school year, a new record is created with that school year
3. **Display Logic**: When viewing a school year, the system shows:
   - Base events (school_year = NULL) for events without specific dates
   - School-year-specific events (school_year = '2024-2025') for events with dates set
   - If both exist for the same event, only the school-year-specific version is shown

## Changes Made

### 1. DefaultEventController.php - updateDate Method
- Changed from updating the existing event to creating a school-year-specific copy
- Checks if a school-year-specific version already exists before creating
- Updates existing school-year-specific version if found
- Leaves base event untouched so it appears in other school years

### 2. DefaultEventController.php - index Method
- Enhanced filtering logic to show both base and school-year-specific events
- Prioritizes school-year-specific versions when both exist
- Uses event name + month as the key to identify duplicates

### 3. New Migration - add_unique_constraint_to_default_events
- Adds unique constraint on (name, month, school_year)
- Prevents duplicate school-year-specific events
- Ensures data integrity

## How It Works Now

### Example Scenario:
1. Base event exists: "Midterm Exams" in October (school_year = NULL)
2. User views school year 2024-2025 and sets date to October 15, 2024
3. System creates new record: "Midterm Exams" in October with date and school_year = '2024-2025'
4. When viewing 2024-2025: Shows the dated version
5. When viewing 2025-2026: Shows the base version (no date set yet)
6. User can then set a different date for 2025-2026, creating another school-year-specific copy

## Database Structure

```
default_events table:
- Base event:     id=1, name="Midterm Exams", month=10, school_year=NULL, date=NULL
- 2024-2025:      id=2, name="Midterm Exams", month=10, school_year='2024-2025', date='2024-10-15'
- 2025-2026:      id=3, name="Midterm Exams", month=10, school_year='2025-2026', date='2025-10-20'
```

## Migration Steps

Run the new migration:
```bash
php artisan migrate
```

This will add the unique constraint to prevent duplicate school-year-specific events.

## Benefits
- Events appear in all school years by default
- Each school year can have its own specific dates
- No data loss when switching between school years
- Maintains historical data for past school years
- Clean separation between template events and year-specific instances
