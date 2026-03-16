@echo off
echo ========================================
echo MySQL Connection Diagnostic Tool
echo ========================================
echo.

echo Step 1: Checking if MySQL process is running...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MySQL process is running
) else (
    echo [ERROR] MySQL process is NOT running!
    echo.
    echo SOLUTION: Open XAMPP Control Panel and click START next to MySQL
    echo.
    pause
    exit /b 1
)

echo.
echo Step 2: Checking if port 3306 is listening...
netstat -an | find "3306" | find "LISTENING" >NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Port 3306 is listening
) else (
    echo [WARNING] Port 3306 is not listening
    echo MySQL might be using a different port or is not accepting connections
)

echo.
echo Step 3: Clearing Laravel cache...
php artisan config:clear
php artisan cache:clear

echo.
echo Step 4: Testing database connection...
echo This may take a few seconds...
php -r "try { $pdo = new PDO('mysql:host=127.0.0.1;port=3306', 'root', '', [PDO::ATTR_TIMEOUT => 5]); echo '[OK] Connected to MySQL server'; } catch (Exception $e) { echo '[ERROR] ' . $e->getMessage(); }"

echo.
echo.
echo ========================================
echo Diagnostic Complete
echo ========================================
echo.
echo If you see errors above, follow these steps:
echo 1. Open XAMPP Control Panel
echo 2. Stop MySQL if it's running
echo 3. Wait 5 seconds
echo 4. Start MySQL again
echo 5. Run this script again
echo.
pause
