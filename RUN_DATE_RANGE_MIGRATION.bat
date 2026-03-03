@echo off
echo ========================================
echo Running Date Range Migration
echo ========================================
echo.

cd backend

echo Running migration to add end_date column...
php artisan migrate --path=database/migrations/2026_03_02_100000_add_end_date_to_default_events_table.php

echo.
echo ========================================
echo Migration Complete!
echo ========================================
echo.
echo The default_events table now supports date ranges.
echo You can now set start and end dates for multi-day events.
echo.
pause
