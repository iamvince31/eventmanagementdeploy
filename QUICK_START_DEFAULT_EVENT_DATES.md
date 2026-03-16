# Quick Start: Default Event Dates System

## What Changed?

Instead of duplicating entire event records when setting dates, we now have:
- **Base events** in `default_events` (templates)
- **Date assignments** in `default_event_dates` (actual dates per school year)

## Installation

### Step 1: Run Migration
```bash
cd backend
php artisan migrate
```

Or use the batch file:
```bash
cd backend
RUN_DEFAULT_EVENT_DATES_MIGRATION.bat
```

### Step 2: Verify
```bash
php backend/test-default-event-dates-system.php
```

## Usage Examples

### Setting a Date (Admin)

**API Request:**
```http
POST /api/default-events/v2/1/set-date
Authorization: Bearer {token}
Content-Type: application/json

{
  "date": "2025-09-15",
  "end_date": null,
  "school_year": "2025-2026"
}
```

**Response:**
```json
{
  "message": "Event date set successfully",
  "event_date": {
    "id": 1,
    "default_event_id": 1,
    "school_year": "2025-2026",
    "date": "2025-09-15",
    "end_date": null,
    "month": 9
  }
}
```

### Getting Events with Dates

**API Request:**
```http
GET /api/default-events/v2?school_year=2025-2026
Authorization: Bearer {token}
```

**Response:**
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
      "date_id": 1
    },
    {
      "id": 2,
      "name": "Midterm Exam",
      "month": 10,
      "order": 2,
      "date": null,
      "end_date": null,
      "school_year": "2025-2026",
      "has_date_set": false,
      "date_id": null
    }
  ]
}
```

### Getting Statistics

**API Request:**
```http
GET /api/default-events/v2/statistics?school_year=2025-2026
Authorization: Bearer {token}
```

**Response:**
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

### Getting Only Scheduled Events

**API Request:**
```http
GET /api/default-events/v2/scheduled?school_year=2025-2026&month=9
Authorization: Bearer {token}
```

Returns only events that have dates assigned for September 2025-2026.

### Removing a Date

**API Request:**
```http
DELETE /api/default-events/v2/1/remove-date?school_year=2025-2026
Authorization: Bearer {token}
```

## Code Examples

### Using Models

```php
use App\Models\DefaultEvent;
use App\Models\DefaultEventDate;

// Get a base event
$event = DefaultEvent::whereNull('school_year')->first();

// Check if it has a date for 2025-2026
$dateAssignment = $event->getDateForSchoolYear('2025-2026');

if ($dateAssignment) {
    echo "Date: " . $dateAssignment->date->format('Y-m-d');
} else {
    echo "No date set for this school year";
}

// Get all dates for an event
$allDates = $event->eventDates;

// Query dates by school year
$dates2025 = DefaultEventDate::forSchoolYear('2025-2026')->get();

// Query dates by month
$septemberDates = DefaultEventDate::forMonth(9)->get();
```

### Creating Date Assignments

```php
use App\Models\DefaultEventDate;

$eventDate = DefaultEventDate::create([
    'default_event_id' => 1,
    'school_year' => '2025-2026',
    'date' => '2025-09-15',
    'end_date' => null,
    'month' => 9,
    'created_by' => auth()->id(),
]);
```

### Updating Date Assignments

```php
// Using updateOrCreate (recommended)
$eventDate = DefaultEventDate::updateOrCreate(
    [
        'default_event_id' => 1,
        'school_year' => '2025-2026',
    ],
    [
        'date' => '2025-09-16',
        'month' => 9,
    ]
);
```

## Benefits

✅ **No duplication** - Event details stored once  
✅ **Audit trail** - Track who set dates and when  
✅ **Easy statistics** - See completion percentage  
✅ **Flexible** - Different dates per school year  
✅ **Clean** - Separate concerns (templates vs dates)

## Migration Notes

- Old API endpoints still work (`/api/default-events`)
- New V2 endpoints use the improved architecture
- Existing data is automatically migrated
- Both systems can coexist during transition

## Troubleshooting

### "Table doesn't exist"
Run migrations: `php artisan migrate`

### "No base events found"
Run the default event seeder: `php artisan db:seed --class=DefaultEventSeeder`

### "Unique constraint violation"
You're trying to set a date for an event/school year combination that already exists. Use the update endpoint instead.

## Full Documentation

See `DEFAULT_EVENT_DATES_SYSTEM.md` for complete documentation.
