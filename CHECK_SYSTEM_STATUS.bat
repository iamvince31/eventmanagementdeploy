@echo off
echo ========================================
echo SYSTEM STATUS CHECK
echo ========================================
echo.

echo Checking MySQL Connection...
php backend/test-db-connection.php
echo.

echo ========================================
echo NEXT STEPS:
echo ========================================
echo 1. Open XAMPP Control Panel
echo 2. Start MySQL (click Start button)
echo 3. Start Apache (click Start button)
echo 4. Run: php artisan serve (in backend folder)
echo 5. Run: npm run dev (in frontend folder)
echo.
pause
