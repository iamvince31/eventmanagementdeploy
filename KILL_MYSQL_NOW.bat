@echo off
echo ========================================
echo KILLING MYSQL PROCESS NOW
echo ========================================
echo.

echo Forcefully terminating all MySQL processes...
taskkill /F /IM mysqld.exe /T 2>NUL
taskkill /F /IM mysql.exe /T 2>NUL

echo.
echo MySQL processes have been terminated.
echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo 1. Open XAMPP Control Panel
echo 2. Click START next to MySQL
echo 3. Wait for green "Running" status
echo 4. Close phpMyAdmin if it's open
echo 5. Try your command again
echo ========================================
echo.
pause
