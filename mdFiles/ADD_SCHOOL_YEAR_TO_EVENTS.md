# Add School Year to Regular Events

## Overview
Added school_year field to regular events table to enable the blue information box display in event detail modals.

## Changes Made

### 1. Database Migration
Created migration to add `school_year` column to events table:
- **File**: `backend/database/migrations/2026_03_09_100000_add_school_year_to_events_table.php`
- **Column**: `school_year` (string, nullable)
- **Position**: After `time` column

### 2. Event Model Update
Updated the Event model to include school_year in fillable fields:
- **File**: `backend/app/Models/Event.php`
- **Added**: `'school_year'` to the `$fillable` array

## How to Apply

### Run the Migration:

**Option 1: Using the batch file**
```bash
RUN_SCHOOL_YEAR_MIGRATION.bat
```

**Option 2: Manual command**
```bash
cd backend
php artisan migrate --path=database/migrations/2026_03_09_100000_add_school_year_to_events_table.php
```

## Impact on Frontend

Once the migration is run, regular events can now have a school_year value, which will:

1. **Enable Blue Box Display**: When a regular event has school_year data, the blue information box will appear in the event detail modal
2. **Show School Year**: The box will display the school year with a book icon
3. **Show Badge**: The "Regular Event" badge will appear at the bottom of the box

## Event Creation

To set school_year when creating events, you'll need to:

1. Add a school year field to the event creation form
2. Include school_year in the API request when creating/updating events
3. The field is nullable, so existing events without school_year will continue to work

## Example Usage

### Creating an event with school year:
```javascript
{
  title: "Team Meeting",
  description: "Monthly team sync",
  location: "Conference Room A",
  date: "2026-03-15",
  time: "14:00:00",
  school_year: "2025-2026",  // New field
  host_id: 1
}
```

### Display Behavior:
- **With school_year**: Blue box appears with school year and badge
- **Without school_year**: No blue box, badge appears at bottom with separator

## Database Schema

After migration, the events table will have:
```sql
school_year VARCHAR(255) NULL
```

## Rollback

If needed, rollback the migration:
```bash
cd backend
php artisan migrate:rollback --step=1
```

## Testing

1. Run the migration
2. Create a new event with school_year value
3. View the event in the calendar
4. Verify the blue box appears with school year and badge
5. Test events without school_year still display correctly

## Notes

- The field is nullable to maintain backward compatibility
- Existing events will have NULL school_year values
- The frontend already has the code to display the blue box when school_year exists
- No frontend changes are needed - just run the migration
