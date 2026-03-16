@echo off
echo ========================================
echo Default Event Dates System Migration
echo ========================================
echo.
echo This will:
echo 1. Create the default_event_dates table
echo 2. Migrate existing date data
echo 3. Run tests to verify the system
echo.
pause

echo.
echo Running migrations...
php artisan migrate --path=database/migrations/2026_03_10_100000_create_default_event_dates_table.php
php artisan migrate --path=database/migrations/2026_03_10_110000_migrate_existing_default_event_dates.php

echo.
echo Running tests...
php test-default-event-dates-system.php

echo.
echo ========================================
echo Migration Complete!
echo ========================================
echo.
echo The new system is ready to use.
echo Check DEFAULT_EVENT_DATES_SYSTEM.md for documentation.
echo.
pause
