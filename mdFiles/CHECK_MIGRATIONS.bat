@echo off
echo ========================================
echo CHECKING DATABASE MIGRATIONS
echo ========================================
echo.

cd backend

echo Running migrations...
echo.
php artisan migrate

echo.
echo ========================================
echo MIGRATION CHECK COMPLETE
echo ========================================
echo.
echo If you see "Nothing to migrate" - you're up to date!
echo If you see new migrations running - your database is now updated!
echo.
pause
