@echo off
echo ========================================
echo Running Migration: Rename CEIT Staff to CEIT Official
echo ========================================
echo.
echo This migration will:
echo 1. Convert all 'CEIT Staff' users to 'CEIT Official'
echo 2. Remove 'CEIT Staff' from the role enum
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

php artisan migrate --path=database/migrations/2026_03_26_010000_rename_ceit_staff_to_ceit_official.php

echo.
echo ========================================
echo Migration Complete!
echo ========================================
echo.
echo All users with 'CEIT Staff' role have been updated to 'CEIT Official'
echo.
pause
