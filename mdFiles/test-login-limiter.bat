@echo off
echo ========================================
echo Testing Login Attempt Limiter
echo ========================================
echo.
echo This will test the 3-attempt limit with 5-minute cooldown
echo After 3 failed attempts, account should be IMMEDIATELY locked
echo.

set EMAIL=test@cvsu.edu.ph
set PASSWORD=wrongpassword

echo Testing with email: main.test.user@cvsu.edu.ph
echo.

echo [Attempt 1/3] - Should show "2 attempt(s) remaining"
curl -X POST http://localhost:8000/api/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"main.test.user@cvsu.edu.ph\",\"password\":\"%PASSWORD%\"}"
echo.
echo.

timeout /t 2 /nobreak >nul

echo [Attempt 2/3] - Should show "1 attempt(s) remaining"
curl -X POST http://localhost:8000/api/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"main.test.user@cvsu.edu.ph\",\"password\":\"%PASSWORD%\"}"
echo.
echo.

timeout /t 2 /nobreak >nul

echo [Attempt 3/3] - Should IMMEDIATELY lock and show "Account locked for 5 minutes"
curl -X POST http://localhost:8000/api/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"main.test.user@cvsu.edu.ph\",\"password\":\"%PASSWORD%\"}"
echo.
echo.

timeout /t 2 /nobreak >nul

echo [Attempt 4] - Should still be locked (429 status with remaining time)
curl -w "\nHTTP Status: %%{http_code}\n" -X POST http://localhost:8000/api/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"main.test.user@cvsu.edu.ph\",\"password\":\"%PASSWORD%\"}"
echo.
echo.

echo ========================================
echo Test Complete!
echo ========================================
echo.
echo Expected Results:
echo - Attempt 1: "2 attempt(s) remaining"
echo - Attempt 2: "1 attempt(s) remaining"  
echo - Attempt 3: "Account locked for 5 minutes" (IMMEDIATE LOCK)
echo - Attempt 4: HTTP 429 with "Too many login attempts" message
echo.
echo The account should be locked IMMEDIATELY after the 3rd failed attempt.
echo No 4th attempt should be allowed before locking.
echo.
echo Check backend/storage/logs/laravel.log for logged attempts
echo.
echo To clear the lockout for testing:
echo   cd backend
echo   php artisan cache:clear
echo.
pause
