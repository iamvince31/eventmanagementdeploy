# Default Event Dates System - Polished Architecture

## Overview

This document describes the improved architecture for storing and managing dates for default academic calendar events across different school years.

## Problem Solved

Previously, the system duplicated entire event records in the `default_events` table when a user set a date for a specific school year. This approach had several issues:

1. Data duplication (event name, month, order repeated)
2. Difficult to track which events have dates set
3. Hard to maintain consistency across school years
4. No audit trail of who set the dates

## New Architecture

### Database Tables

#### 1. `default_events` (Base Events)
Stores the template/base definition of academic calendar events:
- `id` - Primary key
- `name` - Event name (e.g., "Beginning of Classes")
- `month` - Default month (1-12)
- `order` - Display order within the month
- `school_year` - NULL for base events (kept for backward compatibility)
- `date` - NULL for base events (kept for backward compatibility)
- `end_date` - NULL for base events (kept for backward compatibility)

#### 2. `default_event_dates` (NEW - Date Assignments)
Tracks when users set specific dates for events in each school year:
- `id` - Primary key
- `default_event_id` - Foreign key to base event
- `school_year` - School year (e.g., "2025-2026")
- `date` - Assigned date
- `end_date` - Optional end date for multi-day events
- `month` - Extracted from date for quick filtering
- `created_by` - User who set the date (audit trail)
- `created_at` / `updated_at` - Timestamps

**Unique Constraint:** One date assignment per event per school year

## Benefits

1. **No Data Duplication** - Base event defined once, dates stored separately
2. **Clear Audit Trail** - Track who set dates and when
3. **Easy Statistics** - Quickly see completion percentage per school year
4. **Flexible** - Same event can have different dates across school years
5. **Maintainable** - Update event names/details in one place

## API Endpoints

### V2 Endpoints (New Architecture)

#### Get Events with Dates
```
GET /api/default-events/v2?school_year=2025-2026
```
Returns all base events with their assigned dates for the specified school year.

Response:
```json
{
  "events": [
    {
      "id": 1,
      "name": "Beginning of Classes",
      "month": 9,
      "order": 1,
      "date": "2025-09-15",
      "end_date": null,
      "school_year": "2025-2026",
      "has_date_set": true,
      "date_id": 5
    }
  ]
}
```

#### Set/Update Event Date
```
POST /api/default-events/v2/{id}/set-date
```
Body:
```json
{
  "date": "2025-09-15",
  "end_date": "2025-09-17",
  "school_year": "2025-2026"
}
```

#### Remove Event Date
```
DELETE /api/default-events/v2/{id}/remove-date?school_year=2025-2026
```

#### Get Scheduled Events
```
GET /api/default-events/v2/scheduled?school_year=2025-2026&month=9
```
Returns only events that have dates assigned.

#### Get Statistics
```
GET /api/default-events/v2/statistics?school_year=2025-2026
```
Returns completion statistics:
```json
{
  "school_year": "2025-2026",
  "total_base_events": 20,
  "events_with_dates": 15,
  "events_without_dates": 5,
  "completion_percentage": 75.00,
  "events_by_month": {
    "9": 5,
    "10": 4,
    "11": 3,
    "12": 3
  }
}
```

## Migration Path

### Step 1: Run Migrations
```bash
php artisan migrate
```

This will:
1. Create the `default_event_dates` table
2. Migrate existing data from `default_events` where `school_year` is set
3. Preserve backward compatibility

### Step 2: Test the New System
```bash
php backend/test-default-event-dates-system.php
```

### Step 3: Update Frontend (Optional)
The old API endpoints still work. Update frontend gradually to use V2 endpoints.

## Models

### DefaultEvent Model
```php
// Get date for specific school year
$event = DefaultEvent::find(1);
$dateAssignment = $event->getDateForSchoolYear('2025-2026');

// Get all date assignments
$allDates = $event->eventDates;
```

### DefaultEventDate Model
```php
// Query by school year
$dates = DefaultEventDate::forSchoolYear('2025-2026')->get();

// Query by month
$septemberDates = DefaultEventDate::forMonth(9)->get();

// Get with event details
$dates = DefaultEventDate::with('defaultEvent')->get();
```

## Validation Rules

1. **Date cannot be Sunday** - Academic events not allowed on Sundays
2. **Date must be within school year** - September (start year) to August (end year)
3. **End date must be >= start date**
4. **End date cannot be Sunday**
5. **School year format** - Must match pattern: YYYY-YYYY

## Backward Compatibility

The old API endpoints (`/api/default-events`) continue to work using the original `DefaultEventController`. This allows gradual migration of frontend code.

## Future Enhancements

1. **Bulk Date Assignment** - Set dates for multiple events at once
2. **Copy Dates Between Years** - Copy all dates from one school year to another
3. **Date Templates** - Save common date patterns
4. **Conflict Detection** - Warn if dates overlap with other events
5. **Approval Workflow** - Require approval before dates are finalized

## Database Schema Diagram

```
┌─────────────────────┐
│  default_events     │
│  (Base Templates)   │
├─────────────────────┤
│ id (PK)             │
│ name                │
│ month               │
│ order               │
└──────────┬──────────┘
           │
           │ 1:N
           │
┌──────────▼──────────────┐
│ default_event_dates     │
│ (Date Assignments)      │
├─────────────────────────┤
│ id (PK)                 │
│ default_event_id (FK)   │
│ school_year             │
│ date                    │
│ end_date                │
│ month                   │
│ created_by (FK)         │
│ created_at              │
│ updated_at              │
└─────────────────────────┘
```

## Testing

Run the test script to verify the system:
```bash
php backend/test-default-event-dates-system.php
```

This will:
1. Check table structure
2. Test CRUD operations
3. Verify constraints
4. Test API endpoints
5. Check statistics

## Conclusion

This polished architecture provides a clean, maintainable solution for managing default academic calendar dates across multiple school years with proper audit trails and no data duplication.
