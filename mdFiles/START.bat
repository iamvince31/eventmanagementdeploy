@echo off
echo ========================================
echo STARTING EVENT MANAGEMENT SYSTEM
echo ========================================
echo.

echo Make sure XAMPP MySQL is running!
echo.
pause

echo.
echo Starting Backend (Laravel)...
start cmd /k "cd backend && C:\xampp\php\php.exe artisan serve"

timeout /t 3

echo.
echo Starting Frontend (React)...
start cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo APPLICATION STARTING!
echo ========================================
echo.
echo Two windows will open:
echo 1. Backend (Laravel) - port 8000
echo 2. Frontend (React) - port 5173
echo.
echo Wait a few seconds, then open:
echo http://localhost:5173
echo.
echo Press any key to close this window...
pause
