@echo off
echo ========================================
echo RUNNING DATABASE MIGRATIONS
echo ========================================
echo.

echo Make sure:
echo 1. XAMPP MySQL is running
echo 2. Database "event_management" exists
echo.
pause

echo.
echo Running migrations...
echo.

cd backend
C:\xampp\php\php.exe artisan migrate

echo.
echo ========================================
echo DONE!
echo ========================================
echo.
echo Check above for any errors.
echo If you see "Nothing to migrate" - that's OK, tables already exist.
echo.
pause
