# Running the Default Event Seeder

## Quick Start

The `DefaultEventSeeder` has been created and registered. Here's how to use it:

### Option 1: Run All Seeders (Recommended)

```bash
cd backend
php artisan db:seed
```

This will run all seeders including the `DefaultEventSeeder`.

### Option 2: Run Only Default Event Seeder

```bash
cd backend
php artisan db:seed --class=DefaultEventSeeder
```

### Option 3: Fresh Migration with Seeding

If you want to reset the database and seed everything:

```bash
cd backend
php artisan migrate:fresh --seed
```

⚠️ **Warning**: This will drop all tables and recreate them!

## Verification

After running the seeder, verify it worked:

### Using Artisan Tinker

```bash
cd backend
php artisan tinker
```

Then run these commands:

```php
// Check total count (should be 37)
\App\Models\DefaultEvent::count();

// Check September events (should be 3)
\App\Models\DefaultEvent::where('month', 9)->get();

// Check June events (should be 8 - the most)
\App\Models\DefaultEvent::where('month', 6)->count();

// View all events ordered
\App\Models\DefaultEvent::orderBy('month')->orderBy('order')->get();
```

### Using Database Query

If you prefer SQL:

```sql
-- Check total count
SELECT COUNT(*) FROM default_events;

-- Check events by month
SELECT month, COUNT(*) as count 
FROM default_events 
GROUP BY month 
ORDER BY month;

-- View all events
SELECT * FROM default_events ORDER BY month, `order`;
```

## Running Tests

To verify the seeder works correctly, run the test suite:

```bash
cd backend
php vendor/bin/phpunit tests/Unit/DefaultEventSeederTest.php --testdox
```

Or use the batch file:

```bash
cd backend
run-seeder-tests.bat
```

## Expected Results

The seeder should create **37 events** distributed as follows:

- January: 6 events
- February: 3 events
- March: 3 events
- April: 4 events
- May: 3 events
- June: 8 events
- July: 0 events
- August: 0 events
- September: 3 events
- October: 2 events
- November: 1 event
- December: 3 events

## Troubleshooting

### Error: "Class 'DefaultEvent' not found"

Make sure the migration has been run:

```bash
php artisan migrate
```

### Error: "SQLSTATE[23000]: Integrity constraint violation"

The seeder may have already been run. Either:

1. Clear the table first:
   ```bash
   php artisan tinker
   \App\Models\DefaultEvent::truncate();
   exit
   php artisan db:seed --class=DefaultEventSeeder
   ```

2. Or use fresh migration:
   ```bash
   php artisan migrate:fresh --seed
   ```

### Duplicate Events

If you run the seeder multiple times without clearing the table, you'll get duplicates. Use one of the solutions above.

## Files Created

- ✅ `database/seeders/DefaultEventSeeder.php` - The seeder class
- ✅ `database/seeders/DatabaseSeeder.php` - Updated to include DefaultEventSeeder
- ✅ `tests/Unit/DefaultEventSeederTest.php` - Comprehensive test suite
- ✅ `database/seeders/README_DEFAULT_EVENTS.md` - Detailed documentation
- ✅ `run-seeder-tests.bat` - Batch file to run tests easily

## Next Steps

After successfully running the seeder:

1. Verify the data using one of the verification methods above
2. Run the test suite to ensure everything works
3. Proceed to the next task in the implementation plan
4. The API endpoint can now fetch these default events

## Related Documentation

- See `database/seeders/README_DEFAULT_EVENTS.md` for detailed documentation
- See `.kiro/specs/academic-calendar-defaults/design.md` for the complete feature design
- See `.kiro/specs/academic-calendar-defaults/requirements.md` for requirements
