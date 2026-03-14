# Complete Base Events Restoration Guide

## Overview
This guide provides comprehensive tools and procedures to ensure all default academic events remain available across all school years, even when dates are set for specific school years.

## Problem Statement
When setting dates for default events in a specific school year, the system creates school-year-specific copies. However, if base events (school_year = NULL) are accidentally modified or deleted, those events will disappear from other school years.

## Solution Components

### 1. Automatic Migration
**File:** `backend/database/migrations/2026_02_24_160000_restore_all_missing_base_events.php`

This migration automatically runs during `php artisan migrate` and:
- Checks all 36 expected base events from the seeder
- Restores any missing base events
- Preserves existing school-year-specific events
- Provides console output showing what was restored

**Usage:**
```bash
cd backend
php artisan migrate
```

### 2. Maintenance Script
**File:** `backend/restore-missing-base-events.php`

A standalone script that can be run anytime to check and restore missing base events.

**Features:**
- ✅ Checks all 36 expected base events
- ✅ Identifies missing events
- ✅ Restores missing events automatically
- ✅ Shows school-year-specific events
- ✅ Provides detailed summary report

**Usage:**
```bash
cd backend
php restore-missing-base-events.php
```

**Sample Output:**
```
╔════════════════════════════════════════════════════════════════╗
║     Restore Missing Base Events - Maintenance Script          ║
╚════════════════════════════════════════════════════════════════╝

Step 1: Checking for missing base events...
────────────────────────────────────────────────────────────────
✅ All base events are present!

════════════════════════════════════════════════════════════════
Summary:
────────────────────────────────────────────────────────────────
Total expected base events: 36
Missing base events found: 0
Base events restored: 0

✅ No action needed - all base events are present!

Step 3: Verifying school-year-specific events...
────────────────────────────────────────────────────────────────
Found 2 school-year-specific event(s):

School Year: 2025-2026
  • Registration Period (February) - Date: Mar 02, 2026
  • Last Day of Adding/Changing Subjects (February) - Date: Feb 26, 2026

════════════════════════════════════════════════════════════════
✅ Maintenance complete!
```

### 3. Diagnostic Script
**File:** `backend/identify-missing-base-events.php`

A diagnostic tool that identifies missing events and generates migration code.

**Usage:**
```bash
cd backend
php identify-missing-base-events.php
```

## Expected Base Events (36 Total)

### September (3 events)
1. Beginning of Classes
2. Registration Period
3. Last Day of Adding/Changing Subjects

### October (2 events)
1. Last Day of Filing Application for Graduation
2. Midterm Exam

### November (1 event)
1. Student Evaluation for Teachers

### December (3 events)
1. Last Day for Thesis Final Defense
2. Last Day of Settlement of Deficiencies for Grad Students
3. Christmas Break

### January (6 events)
1. Final Exam (Graduating)
2. Final Exam (Non-Grad)
3. Last Day of Submission and Uploading of Grades
4. Removal Examination
5. Submission of Graduation Clearance
6. Semestral Break

### February (3 events)
1. Registration Period
2. Beginning of Classes
3. Last Day of Adding/Changing Subjects

### March (3 events)
1. College Academic Student Council
2. Last day of filing application for graduation
3. Submission of Graduation Candidates List

### April (4 events)
1. Midterm Exam
2. Submission of Qualified Candidates for Graduation
3. Student Evaluation for Teachers and Classroom Observation
4. U-Games

### May (3 events)
1. Last Day of Settlement of Deficiencies for Graduating Students
2. Last Day for Thesis Final Defense
3. Final Examination for Graduating

### June (8 events)
1. Final Examination for Non-Graduating
2. Last Day of Submission and Uploading of Grades
3. Removal Examination
4. Last Day of Submission of Report of Completion
5. Submission of Manuscript
6. Submission of Graduation Clearance
7. College Academic Council Meeting
8. Start of Vacation

## How the System Works

### Base Events (school_year = NULL)
- Appear in ALL school years
- Serve as templates
- Have no specific dates
- Cannot be deleted

### School-Year-Specific Events
- Created when a date is set for a specific school year
- Only appear in that school year
- Have specific dates
- Override base events for display

### Display Priority
When viewing a school year:
1. System fetches both base events and school-year-specific events
2. If both exist for the same event name + month, show school-year-specific version
3. Otherwise, show base event

## Maintenance Schedule

### Daily (Automated)
- No action needed - migrations run automatically on deployment

### Weekly (Recommended)
Run the maintenance script to verify data integrity:
```bash
cd backend
php restore-missing-base-events.php
```

### Monthly (Optional)
Run the diagnostic script for detailed analysis:
```bash
cd backend
php identify-missing-base-events.php
```

## Troubleshooting

### Issue: Events missing from a school year
**Solution:**
```bash
cd backend
php restore-missing-base-events.php
```

### Issue: Duplicate events appearing
**Check:**
1. Verify unique constraint is in place:
   ```bash
   php artisan migrate:status
   ```
2. Look for migration: `2026_02_24_140000_add_unique_constraint_to_default_events`

### Issue: School-year-specific events not showing
**Check:**
1. Verify the event has a date set
2. Check the school_year value matches the selected year
3. Run diagnostic:
   ```bash
   php identify-missing-base-events.php
   ```

## Database Structure

### Correct Structure
```sql
-- Base event (appears in all years)
id: 37, name: "Registration Period", month: 2, school_year: NULL, date: NULL

-- School-year-specific event (only in 2025-2026)
id: 16, name: "Registration Period", month: 2, school_year: "2025-2026", date: "2026-03-02"
```

### Incorrect Structure (Fixed by scripts)
```sql
-- Missing base event - other years won't see this event!
id: 16, name: "Registration Period", month: 2, school_year: "2025-2026", date: "2026-03-02"
```

## Prevention

The updated `DefaultEventController::updateDate()` method now:
1. ✅ Creates new school-year-specific copies
2. ✅ Never modifies base events
3. ✅ Checks for existing school-year-specific versions
4. ✅ Updates existing versions if found

## Files Modified/Created

### Controllers
- `backend/app/Http/Controllers/DefaultEventController.php` - Updated logic

### Migrations
- `2026_02_24_130000_add_school_year_to_default_events_table.php` - Added school_year column
- `2026_02_24_140000_add_unique_constraint_to_default_events.php` - Added unique constraint
- `2026_02_24_150000_restore_missing_february_base_events.php` - Restored February events
- `2026_02_24_160000_restore_all_missing_base_events.php` - Comprehensive restoration

### Scripts
- `backend/restore-missing-base-events.php` - Maintenance script
- `backend/identify-missing-base-events.php` - Diagnostic script

## Success Verification

Run this command to verify everything is working:
```bash
cd backend
php restore-missing-base-events.php
```

Expected output:
```
✅ All base events are present!
Total expected base events: 36
Missing base events found: 0
Base events restored: 0
```

## Support

If issues persist:
1. Run the maintenance script
2. Check the diagnostic script output
3. Verify all migrations are applied: `php artisan migrate:status`
4. Check database directly for base events: `SELECT * FROM default_events WHERE school_year IS NULL`
