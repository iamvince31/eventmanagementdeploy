# Class Schedule Data Recovery Guide

## Quick Diagnosis

Run this to check the current status:

```bash
cd backend
php check-schedule-status.php
```

This will tell you:
- If schedule tables exist
- How many schedules are in the database
- If there are any inconsistencies
- If backups are available

---

## Scenario 1: Schedules Are Completely Lost

### Symptoms:
- `user_schedules` table is empty
- Users report their schedules are gone
- No backup available

### Solution:

Users need to re-enter their schedules. Here's what to do:

#### Step 1: Reset Schedule Flags

```bash
cd backend
php reset-schedule-flags.php
```

This resets all users' `schedule_initialized` flags to `false`.

#### Step 2: Inform Users

Users will see the schedule setup prompt when they login. They need to:
1. Go to Account Settings
2. Click "Set Class Schedule"
3. Re-enter their class schedule
4. Save

#### Step 3: Verify System Works

Test with one user:
1. Login to the application
2. Go to Account Settings
3. Set a test schedule
4. Save and refresh
5. Schedule should persist

---

## Scenario 2: Backup Available

### If You Have a Database Backup:

```bash
# Stop the backend server first (Ctrl+C)

# Restore from backup
mysql -u root -p event_management < backup_file.sql

# Restart backend
cd backend
php artisan serve
```

### Verify Restoration:

```bash
cd backend
php check-schedule-status.php
```

---

## Scenario 3: Inconsistent State

### Symptoms:
- Some users have `schedule_initialized = true`
- But `user_schedules` table is empty

### Solution:

```bash
cd backend
php reset-schedule-flags.php
```

This resets the flags so users can re-enter schedules.

---

## Prevention: Create Backups

### Manual Backup (Do This Now):

```bash
# Create backups directory
mkdir -p backend/backups

# Create backup
mysqldump -u root -p event_management > backend/backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Automatic Backup Script:

Create `backend/backup-db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backups
mysqldump -u root -p event_management > backups/event_management_$DATE.sql
echo "✅ Backup created: backups/event_management_$DATE.sql"
```

Make it executable:
```bash
chmod +x backend/backup-db.sh
```

Run it:
```bash
cd backend
./backup-db.sh
```

### Before Any Migration:

Always backup first:

```bash
# 1. Create backup
cd backend
mysqldump -u root -p event_management > backup_before_migration.sql

# 2. Then run migration
php artisan migrate
```

---

## Safe Migration Commands

### ✅ SAFE (Won't delete data):
```bash
php artisan migrate              # Run new migrations only
php artisan migrate:status       # Check migration status
php artisan migrate:rollback --step=1  # Rollback one migration
```

### ⚠️ DANGEROUS (Will delete data):
```bash
php artisan migrate:fresh        # Drops ALL tables and recreates
php artisan migrate:reset        # Rolls back ALL migrations
php artisan db:wipe              # Drops ALL tables
```

**Never use these in production without a backup!**

---

## Check What Happened

To find out what caused the data loss:

### Check Command History:

**Windows (PowerShell):**
```powershell
Get-History | Select-String "migrate"
```

**Windows (CMD):**
```cmd
doskey /history | findstr migrate
```

**Linux/Mac:**
```bash
history | grep migrate
```

Look for:
- `migrate:fresh`
- `migrate:reset`
- `db:wipe`

---

## Verify Schedule System Works

After recovery, test the schedule system:

### Test 1: Save Schedule

```bash
cd backend
php artisan tinker
```

```php
// Create test user if needed
$user = \App\Models\User::first();

// Create test schedule
\App\Models\UserSchedule::create([
    'user_id' => $user->id,
    'day' => 'Monday',
    'start_time' => '08:00',
    'end_time' => '10:00',
    'description' => 'Test Class'
]);

// Verify
\App\Models\UserSchedule::where('user_id', $user->id)->count();
// Should return 1

exit
```

### Test 2: Frontend Test

1. Login to the application
2. Go to Account Settings
3. Set a class schedule
4. Save
5. Refresh the page
6. Schedule should still be there

---

## Common Issues

### Issue: "Table 'user_schedules' doesn't exist"

**Solution:**
```bash
cd backend
php artisan migrate
```

### Issue: Schedule saves but doesn't show up

**Solution:**
```bash
cd backend
php artisan tinker
```

```php
// Check if data is actually saved
\App\Models\UserSchedule::all();

// Check user flag
$user = \App\Models\User::first();
echo $user->schedule_initialized ? 'true' : 'false';

exit
```

### Issue: Users can't access schedule page

**Solution:**

Check routes:
```bash
cd backend
php artisan route:list | grep schedule
```

Should show:
- GET /api/schedules
- POST /api/schedules
- DELETE /api/schedules/{id}

---

## Summary

**To check status:**
```bash
cd backend
php check-schedule-status.php
```

**If schedules are lost:**
```bash
cd backend
php reset-schedule-flags.php
```

**To create backup:**
```bash
mysqldump -u root -p event_management > backup.sql
```

**To restore backup:**
```bash
mysql -u root -p event_management < backup.sql
```

---

## Important Notes

1. **Schedule data is stored in `user_schedules` table**
2. **User flag is `schedule_initialized` in `users` table**
3. **Always backup before migrations**
4. **Use `php artisan migrate` not `migrate:fresh`**
5. **Test schedule system after any database changes**

---

## Need Help?

Run the diagnostic script:
```bash
cd backend
php check-schedule-status.php
```

It will tell you exactly what's wrong and how to fix it.
