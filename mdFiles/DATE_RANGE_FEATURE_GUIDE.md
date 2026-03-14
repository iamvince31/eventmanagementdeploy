# Academic Event Date Range Feature

## Overview
This feature allows you to set date ranges for academic events that span multiple days, such as:
- Midterm exams (e.g., Oct 15-19, 2024)
- Final exams (e.g., Dec 10-14, 2024)
- School breaks (e.g., Dec 20, 2024 - Jan 5, 2025)
- Orientation weeks
- Registration periods

## What's New

### Backend Changes
1. **Database Migration**: Added `end_date` column to `default_events` table
2. **Model Update**: Updated `DefaultEvent` model to include `end_date` in fillable fields and casts
3. **Controller Enhancement**: Modified `updateDate()` method to:
   - Accept optional `end_date` parameter
   - Validate that `end_date` is after or equal to `date`
   - Validate that both dates are within the school year
   - Return `end_date` in API responses

### Frontend Changes
1. **UI Enhancement**: Date picker now shows two fields:
   - **Start Date** (required) - The beginning of the event
   - **End Date** (optional) - The end of the event (leave empty for single-day events)

2. **Date Display**: Events with date ranges show formatted ranges:
   - Same month: "Oct 15 - 19, 2024"
   - Different months: "Dec 20, 2024 - Jan 5, 2025"
   - Single day: "Oct 15, 2024"

3. **Validation**: 
   - End date must be on or after start date
   - Both dates must be within the selected school year
   - End date input is automatically constrained to be >= start date

## Installation

### Step 1: Run the Migration
Execute the migration script to add the `end_date` column:

```bash
# Windows
RUN_DATE_RANGE_MIGRATION.bat

# Or manually
cd backend
php artisan migrate --path=database/migrations/2026_03_02_100000_add_end_date_to_default_events_table.php
```

### Step 2: Restart Your Development Server
If your backend is running, restart it to pick up the model changes:

```bash
cd backend
php artisan serve
```

### Step 3: Clear Frontend Cache (if needed)
If you're running the frontend, refresh your browser or restart the dev server:

```bash
cd frontend
npm run dev
```

## Usage

### Setting a Date Range
1. Navigate to the Academic Calendar page
2. Select your school year
3. Click "Edit" or "Set" on any event
4. Enter the **Start Date** (required)
5. Optionally enter the **End Date** for multi-day events
6. Click "Save"

### Examples

**Single Day Event:**
- Start Date: Oct 15, 2024
- End Date: (leave empty)
- Display: "Oct 15, 2024"

**Multi-Day Event (Same Month):**
- Start Date: Oct 15, 2024
- End Date: Oct 19, 2024
- Display: "Oct 15 - 19, 2024"

**Multi-Day Event (Different Months):**
- Start Date: Dec 20, 2024
- End Date: Jan 5, 2025
- Display: "Dec 20, 2024 - Jan 5, 2025"

## API Changes

### Update Event Date Endpoint
**PUT** `/api/default-events/{id}/date`

**Request Body:**
```json
{
  "date": "2024-10-15",
  "end_date": "2024-10-19",  // Optional
  "school_year": "2024-2025"
}
```

**Response:**
```json
{
  "message": "Event date updated successfully",
  "event": {
    "id": 1,
    "name": "Midterm Exams",
    "month": 10,
    "order": 1,
    "date": "2024-10-15",
    "end_date": "2024-10-19",
    "school_year": "2024-2025"
  }
}
```

### Validation Rules
- `date`: Required, must be a valid date within the school year
- `end_date`: Optional, must be a valid date >= `date` and within the school year
- `school_year`: Required, format "YYYY-YYYY"

## Database Schema

### default_events Table
```sql
CREATE TABLE default_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    month INT NOT NULL,
    order INT NOT NULL,
    date DATE NULL,
    end_date DATE NULL,  -- NEW COLUMN
    school_year VARCHAR(20) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

## Benefits

1. **Accurate Event Representation**: Multi-day events are now properly represented
2. **Better Planning**: Users can see the full duration of events at a glance
3. **Flexible**: Single-day events work exactly as before (just leave end_date empty)
4. **Validated**: System ensures date ranges are logical and within school year bounds

## Backward Compatibility

- Existing events without `end_date` continue to work as single-day events
- The `end_date` field is optional, so no existing functionality is broken
- API responses include `end_date` (will be `null` for single-day events)

## Troubleshooting

### Migration Fails
If the migration fails, check:
1. Database connection is working
2. You have the latest code changes
3. No duplicate migrations exist

### End Date Not Saving
Ensure:
1. End date is on or after start date
2. Both dates are within the school year (Sept - Aug)
3. Backend server is running and updated

### Date Range Not Displaying
Try:
1. Hard refresh the browser (Ctrl+F5)
2. Clear browser cache
3. Check browser console for errors
4. Verify API response includes `end_date`

## Future Enhancements

Potential improvements for this feature:
- Visual calendar view showing event durations
- Color-coding for different event types
- Conflict detection for overlapping events
- Bulk date range setting for similar events
- Export to calendar formats (iCal, Google Calendar)
