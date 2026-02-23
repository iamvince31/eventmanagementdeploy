# Default Events Seeder Documentation

## Overview

The `DefaultEventSeeder` populates the `default_events` table with 37 predefined academic calendar events organized across 10 months of the academic year.

## Event Distribution

| Month | Count | Events |
|-------|-------|--------|
| January | 6 | Final Exam (Graduating), Final Exam (Non-Grad), Last Day of Submission and Uploading of Grades, Removal Examination, Submission of Graduation Clearance, Semestral Break |
| February | 3 | Registration Period, Beginning of Classes, Last Day of Adding/Changing Subjects |
| March | 3 | College Academic Student Council, Last day of filing application for graduation, Submission of Graduation Candidates List |
| April | 4 | Midterm Exam, Submission of Qualified Candidates for Graduation, Student Evaluation for Teachers and Classroom Observation, U-Games |
| May | 3 | Last Day of Settlement of Deficiencies for Graduating Students, Last Day for Thesis Final Defense, Final Examination for Graduating |
| June | 8 | Final Examination for Non-Graduating, Last Day of Submission and Uploading of Grades, Removal Examination, Last Day of Submission of Report of Completion, Submission of Manuscript, Submission of Graduation Clearance, College Academic Council Meeting, Start of Vacation |
| July | 0 | (No events) |
| August | 0 | (No events) |
| September | 3 | Beginning of Classes, Registration Period, Last Day of Adding/Changing Subjects |
| October | 2 | Last Day of Filing Application for Graduation, Midterm Exam |
| November | 1 | Student Evaluation for Teachers |
| December | 3 | Last Day for Thesis Final Defense, Last Day of Settlement of Deficiencies for Grad Students, Christmas Break |

**Total: 37 events**

## Usage

### Running the Seeder

To run this seeder individually:

```bash
php artisan db:seed --class=DefaultEventSeeder
```

To run all seeders (including this one):

```bash
php artisan db:seed
```

To refresh the database and seed:

```bash
php artisan migrate:fresh --seed
```

### Verification

After running the seeder, verify the data:

```bash
php artisan tinker
```

Then in tinker:

```php
// Check total count
\App\Models\DefaultEvent::count(); // Should return 37

// Check events by month
\App\Models\DefaultEvent::where('month', 9)->count(); // September: 3
\App\Models\DefaultEvent::where('month', 6)->count(); // June: 8

// View all events ordered by month and order
\App\Models\DefaultEvent::orderBy('month')->orderBy('order')->get();
```

## Data Structure

Each event has the following fields:

- `id`: Auto-incrementing primary key
- `name`: Event name (string)
- `month`: Month number 1-12 (integer)
- `order`: Sort order within the month (integer, starts at 1)
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Testing

Run the seeder tests:

```bash
php vendor/bin/phpunit tests/Unit/DefaultEventSeederTest.php
```

Or use the provided batch file:

```bash
run-seeder-tests.bat
```

The test suite verifies:
- Total event count (37 events)
- Correct event counts per month
- Presence of all required events from specification
- Proper order values within each month
- Valid month values (1-12)
- All events have non-empty names

## Requirements Mapping

This seeder fulfills the following requirements:

- **Requirement 3.4**: Store default events in database
- **Requirements 8.1-8.10**: Include all events specified for each month

## Notes

- Events are ordered within each month using the `order` field
- July and August intentionally have no events
- Some event names appear in multiple months (e.g., "Registration Period" in September and February)
- The seeder uses `DefaultEvent::create()` which respects the model's fillable fields
- Running the seeder multiple times will create duplicate entries unless the database is refreshed first

## Maintenance

To add, modify, or remove events:

1. Edit the `$events` array in `DefaultEventSeeder.php`
2. Update the event counts in this documentation
3. Run the seeder tests to verify changes
4. Update the test expectations if event counts change
5. Run `php artisan migrate:fresh --seed` to apply changes

## Related Files

- Model: `app/Models/DefaultEvent.php`
- Migration: `database/migrations/2026_02_24_100000_create_default_events_table.php`
- Tests: `tests/Unit/DefaultEventSeederTest.php`
- Controller: `app/Http/Controllers/DefaultEventController.php`
