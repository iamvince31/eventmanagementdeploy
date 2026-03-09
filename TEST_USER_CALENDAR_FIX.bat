@echo off
echo ========================================
echo Testing User Calendar Highlighting Fix
echo ========================================
echo.

cd backend

echo Running test script...
echo.
php test-user-calendar-access.php

echo.
echo ========================================
echo Test Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Login as a regular user (non-admin)
echo 2. Go to Dashboard
echo 3. Check calendar for blue-highlighted dates
echo 4. Hover over calendar icons for event details
echo.
pause
