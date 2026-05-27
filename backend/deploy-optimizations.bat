@echo off
REM ============================================================================
REM Deployment Script for Performance Optimizations (Windows)
REM ============================================================================
REM This script deploys the performance optimizations to the production server
REM including database migrations, seeders, and cache clearing.
REM ============================================================================

echo =========================================
echo   Performance Optimization Deployment
echo =========================================
echo.

REM Step 1: Run database migrations
echo Step 1: Running database migrations...
php artisan migrate --force
if %errorlevel% neq 0 (
    echo X Migration failed! Check the error above.
    exit /b 1
)
echo √ Migrations completed successfully
echo.

REM Step 2: Seed default events (templates)
echo Step 2: Seeding default events...
php artisan db:seed --class=DefaultEventSeeder --force
if %errorlevel% neq 0 (
    echo X Seeding failed! Check the error above.
    exit /b 1
)
echo √ Default events seeded successfully
echo.

REM Step 3: Clear all caches
echo Step 3: Clearing application caches...
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
echo √ All caches cleared
echo.

REM Step 4: Optimize for production
echo Step 4: Optimizing for production...
php artisan config:cache
php artisan route:cache
php artisan view:cache
echo √ Production optimizations applied
echo.

REM Step 5: Verify deployment
echo Step 5: Verifying deployment...
echo Checking if default events table has data...
php artisan tinker --execute="echo 'Default Events: ' . App\Models\DefaultEvent::whereNull('school_year')->count();"
echo.

echo =========================================
echo   Deployment Complete!
echo =========================================
echo.
echo Next steps:
echo 1. Test the API endpoint: /api/default-events?school_year=2025-2026
echo 2. Monitor Laravel logs: storage/logs/laravel.log
echo 3. Check response times (should be ^< 200ms)
echo.
echo If you encounter issues:
echo - Check logs: tail -f storage/logs/laravel.log
echo - Verify database connection
echo - Ensure all migrations ran successfully
echo.
pause
