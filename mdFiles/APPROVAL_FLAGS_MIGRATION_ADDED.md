# Approval Flags Migration Added

## Issue
The application was trying to insert `requires_dean_approval` and `requires_chair_approval` columns into the `event_requests` table, but these columns didn't exist in the database.

## Error Message
```
SQLSTATE[42S22]: Column not found: 1054 Unknown column 'requires_dean_approval' in 'field list'
```

## Root Cause
The `EventController.php` was setting these boolean flags when creating event requests for Faculty/Staff, but the database schema was missing these columns.

## Solution
Created a new migration to add the missing columns to the `event_requests` table.

### Migration File
`backend/database/migrations/2026_03_11_000002_add_approval_flags_to_event_requests.php`

### Columns Added
- `requires_dean_approval` (boolean, default: false)
- `requires_chair_approval` (boolean, default: false)

### Purpose
These flags indicate which specific approvals are required for an event request:
- Faculty/Staff events: Both flags set to `true` (requires Dean AND Chairperson approval)
- Other scenarios: Can be configured as needed

## Migration Status
✅ Migration successfully run
✅ Columns added to `event_requests` table
✅ Default values set to `false`

## How It Works

### When Faculty/Staff Create an Event:
```php
EventRequest::create([
    // ... other fields ...
    'requires_dean_approval' => true,
    'requires_chair_approval' => true,
]);
```

### Database Schema:
```sql
requires_dean_approval BOOLEAN DEFAULT 0
requires_chair_approval BOOLEAN DEFAULT 0
```

## Testing
The error should now be resolved. Faculty/Staff can create event requests that:
1. Set both approval flags to `true`
2. Store the request in the database
3. Wait for Dean and Chairperson approval
4. Get converted to actual events once approved

## Files Created
- `backend/database/migrations/2026_03_11_000002_add_approval_flags_to_event_requests.php`

## Status
✅ **RESOLVED** - Missing columns added, migration run successfully
