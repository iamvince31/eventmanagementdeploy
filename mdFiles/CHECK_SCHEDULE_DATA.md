# Check and Recover Class Schedule Data

## Quick Check: Is Schedule Data Lost?

```bash
cd backend
php artisan tinker
```

```php
// Check if user_schedules table exists
\Schema::hasTable('user_schedules');
// Should return: true

// Check if there are any schedules
\App\Models\UserSchedule::count();
// If 0, schedules are lost

// Check if users still have schedule_initialized flag
\App\Models\User::where('schedule_initialized', true)->count();
// Shows how many users had schedules

exit
```

## What Likely Happened

The schedule data was lost if you ran any of these commands:

1. `php artisan migrate:fresh` - Drops all tables and recreates them
2. `php artisan migrate:fresh --seed` - Same as above + seeds data
3. `php artisan migrate:rollback` - Rolls back migrations
4. Database was manually reset

## Check What Was Run

Look for these in your command history:
- `migrate:fresh`
- `migrate:rollback`
- `migrate:reset`
- Database truncate/drop commands

## Recovery Options

### Option 1: No Backup Available

If there's no backup, users will need to re-enter their schedules:

1. The schedule functionality is still intact
2. Users just need to go to Account Settings → Set Schedule
3. The system will work normally once they re-enter

### Option 2: Check for Database Backup

Check if you have a database backup:

```bash
# Check for SQL dumps
ls -la *.sql
ls -la backup/*.sql
ls -la database/backups/*.sql

# Check MySQL backups (if using XAMPP)
# Windows: C:\xampp\mysql\backup\
# Linux/Mac: /opt/lampp/var/mysql/backup/
```

If you find a backup:

```bash
# Restore from backup (adjust path as needed)
mysql -u root -p event_management < backup.sql
```

### Option 3: Partial Recovery from Logs

Check if schedule data was logged:

```bash
cd backend
grep -r "schedule" storage/logs/*.log
```

## Prevention: Create Backup Now

To prevent future data loss:

### 1. Create Database Backup Script

```bash
cd backend
```

Create `backup-database.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p event_management > backups/event_management_$DATE.sql
echo "Backup created: backups/event_management_$DATE.sql"
```

Make it executable:
```bash
chmod +x backup-database.sh
mkdir -p backups
```

### 2. Backup Before Migrations

Always backup before running migrations:

```bash
# Create backup
mysqldump -u root -p event_management > backup_before_migration.sql

# Then run migration
php artisan migrate
```

### 3. Use Safe Migration Commands

Instead of `migrate:fresh`, use:

```bash
# Just run new migrations (safe)
php artisan migrate

# Rollback one step (safer)
php artisan migrate:rollback --step=1
```

## Verify Current State

```bash
cd backend
php artisan tinker
```

```php
// Check tables exist
echo "Tables check:\n";
echo "- users: " . (\Schema::hasTable('users') ? 'EXISTS' : 'MISSING') . "\n";
echo "- user_schedules: " . (\Schema::hasTable('user_schedules') ? 'EXISTS' : 'MISSING') . "\n";
echo "- events: " . (\Schema::hasTable('events') ? 'EXISTS' : 'MISSING') . "\n";

// Check data
echo "\nData check:\n";
echo "- Users: " . \App\Models\User::count() . "\n";
echo "- Schedules: " . \App\Models\UserSchedule::count() . "\n";
echo "- Events: " . \App\Models\Event::count() . "\n";
echo "- Academic Events: " . \App\Models\Event::where('is_academic_calendar', true)->count() . "\n";

// Check users with schedules
echo "\nUsers with schedules initialized: " . \App\Models\User::where('schedule_initialized', true)->count() . "\n";

exit
```

## What to Tell Users

If schedules are lost and there's no backup:

> "We apologize, but class schedules need to be re-entered due to a system update. 
> Please go to Account Settings and set your class schedule again. 
> This is a one-time setup and your schedule will be saved securely."

## Restore Schedule Functionality

The schedule system should still work. Verify:

1. **Check Schedule Page Loads:**
   - Navigate to Account Settings
   - Schedule form should appear

2. **Test Schedule Save:**
   - Add a test schedule
   - Save it
   - Refresh page
   - Schedule should persist

3. **Check API Endpoints:**
```bash
cd backend
php artisan route:list | grep schedule
```

Should show:
- GET /api/schedules
- POST /api/schedules
- DELETE /api/schedules/{id}
- POST /api/schedules/check-conflicts

## If Schedule System is Broken

Run migrations to ensure tables exist:

```bash
cd backend
php artisan migrate
```

Check for the schedule migration:
```bash
php artisan migrate:status | grep schedule
```

Should show:
- `2026_02_12_043253_create_user_schedules_table` - Ran
- `2026_02_16_044241_add_schedule_initialized_to_users_table` - Ran

## Create Backup Script for Future

Create `backend/backup-db.php`:

```php
<?php

$date = date('Y-m-d_H-i-s');
$filename = "backups/event_management_{$date}.sql";

// Create backups directory if it doesn't exist
if (!is_dir('backups')) {
    mkdir('backups', 0755, true);
}

// Database credentials from .env
$host = '127.0.0.1';
$user = 'root';
$pass = '';
$db = 'event_management';

// Create backup
$command = "mysqldump -h {$host} -u {$user} {$db} > {$filename}";
if ($pass) {
    $command = "mysqldump -h {$host} -u {$user} -p{$pass} {$db} > {$filename}";
}

exec($command, $output, $return);

if ($return === 0) {
    echo "✅ Backup created: {$filename}\n";
    echo "   Size: " . filesize($filename) . " bytes\n";
} else {
    echo "❌ Backup failed!\n";
}
```

Run it:
```bash
cd backend
php backup-db.php
```

## Summary

**If schedules are lost:**
1. Check if there's a database backup
2. If no backup, users need to re-enter schedules
3. Create backup system to prevent future loss

**To check current state:**
```bash
cd backend
php artisan tinker
\App\Models\UserSchedule::count();
exit
```

**To prevent future loss:**
1. Always backup before migrations
2. Use `php artisan migrate` instead of `migrate:fresh`
3. Set up automatic backups

**Schedule system should still work** - users just need to re-enter their data if it was lost.
