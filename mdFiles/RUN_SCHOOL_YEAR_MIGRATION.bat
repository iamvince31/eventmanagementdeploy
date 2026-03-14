@echo off
echo Running school year migration for events table...
cd backend
php artisan migrate --path=database/migrations/2026_03_09_100000_add_school_year_to_events_table.php
echo.
echo Migration complete!
echo.
pause
