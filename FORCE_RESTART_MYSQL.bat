@echo off
echo ========================================
echo FORCE RESTART MYSQL - Emergency Fix
echo ========================================
echo.
echo This will forcefully kill and restart MySQL
echo.
pause

echo Step 1: Killing all MySQL processes...
taskkill /F /IM mysqld.exe 2>NUL
if %ERRORLEVEL% EQU 0 (
    echo [OK] MySQL process killed
) else (
    echo [INFO] No MySQL process was running
)

echo.
echo Step 2: Waiting 5 seconds...
timeout /t 5 /nobreak >NUL

echo.
echo Step 3: Starting MySQL...
echo.
echo IMPORTANT: Now do the following:
echo 1. Open XAMPP Control Panel
echo 2. Click START next to MySQL
echo 3. Wait for green "Running" status
echo 4. Then press any key to continue...
echo.
pause

echo.
echo Step 4: Testing connection...
php -r "try { $pdo = new PDO('mysql:host=127.0.0.1;port=3306', 'root', '', [PDO::ATTR_TIMEOUT => 5]); echo '[SUCCESS] MySQL is now responding!'; } catch (Exception $e) { echo '[ERROR] Still not working: ' . $e->getMessage(); }"

echo.
echo.
echo ========================================
echo If you see SUCCESS above, you can now run:
echo   cd backend
echo   php artisan migrate
echo ========================================
echo.
pause
