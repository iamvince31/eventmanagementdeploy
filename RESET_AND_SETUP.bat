@echo off
echo ========================================
echo RESET AND SETUP LARAVEL + REACT
echo ========================================
echo.

echo This will:
echo 1. Keep your frontend (React) as is
echo 2. Reset backend to fresh Laravel
echo 3. Set up all necessary files
echo 4. Configure database
echo.
echo Press Ctrl+C to cancel, or
pause

echo.
echo Step 1: Checking XAMPP MySQL...
echo Please make sure XAMPP MySQL is running!
echo.
pause

echo.
echo Step 2: Creating database...
echo.
echo Please do this manually:
echo 1. Open http://localhost/phpmyadmin
echo 2. Click "New"
echo 3. Database name: event_management
echo 4. Click "Create"
echo.
echo Press any key after creating database...
pause

echo.
echo Step 3: Setting up Laravel backend...
echo This will take a few minutes...
echo.

cd backend
composer install
php artisan key:generate
php artisan migrate
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate

echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo To run the application:
echo.
echo Terminal 1:
echo   cd backend
echo   php artisan serve
echo.
echo Terminal 2:
echo   cd frontend
echo   npm run dev
echo.
echo Then open: http://localhost:5173
echo.
pause
