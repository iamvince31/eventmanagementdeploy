@echo off
echo ========================================
echo Running Migration: Remove Program Coordinator Role
echo ========================================
echo.
echo This migration will:
echo 1. Convert all 'Program Coordinator' users to 'Coordinator'
echo 2. Remove 'Program Coordinator' from the role enum
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

php artisan migrate --path=database/migrations/2026_03_26_000000_remove_program_coordinator_role.php

echo.
echo ========================================
echo Migration Complete!
echo ========================================
echo.
echo All users with 'Program Coordinator' role have been updated to 'Coordinator'
echo.
pause
