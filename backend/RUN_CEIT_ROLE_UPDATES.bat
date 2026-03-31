@echo off
echo ========================================
echo Running CEIT Role Updates
echo ========================================
echo.
echo This will run TWO migrations:
echo 1. Remove 'Program Coordinator' role (convert to 'Coordinator')
echo 2. Rename 'CEIT Staff' to 'CEIT Official'
echo.
echo After these migrations, CEIT department will have:
echo - CEIT Official (2 cards per row)
echo - Coordinator (3 cards per row)
echo - Faculty Member (4 cards per row)
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

echo.
echo [1/2] Removing Program Coordinator role...
php artisan migrate --path=database/migrations/2026_03_26_000000_remove_program_coordinator_role.php

echo.
echo [2/2] Renaming CEIT Staff to CEIT Official...
php artisan migrate --path=database/migrations/2026_03_26_010000_rename_ceit_staff_to_ceit_official.php

echo.
echo ========================================
echo All Migrations Complete!
echo ========================================
echo.
echo Changes applied:
echo - Program Coordinator → Coordinator
echo - CEIT Staff → CEIT Official
echo.
echo CEIT Department Hierarchy:
echo 1. Dean (1 card)
echo 2. CEIT Official (2 cards per row)
echo 3. Coordinator (3 cards per row)
echo 4. Faculty Member (4 cards per row)
echo.
pause
