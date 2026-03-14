@echo off
echo ========================================
echo Security Testing Script
echo ========================================
echo.

echo [1/5] Testing Rate Limiting on Login...
echo Sending 10 rapid login requests...
for /L %%i in (1,1,10) do (
    curl -s -o nul -w "Request %%i: %%{http_code}\n" -X POST http://localhost:8000/api/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"wrong\"}"
)
echo Expected: Should see 429 (Too Many Requests) after 5 attempts
echo.

echo [2/5] Testing SQL Injection Protection...
curl -X POST http://localhost:8000/api/login -H "Content-Type: application/json" -d "{\"email\":\"admin' OR '1'='1\",\"password\":\"test\"}"
echo Expected: Should return validation error, not bypass authentication
echo.

echo [3/5] Testing Unauthorized API Access...
curl -s -w "Status: %%{http_code}\n" http://localhost:8000/api/events
echo Expected: Should return 401 (Unauthorized)
echo.

echo [4/5] Testing Invalid Token...
curl -s -w "Status: %%{http_code}\n" -H "Authorization: Bearer invalid_token_12345" http://localhost:8000/api/events
echo Expected: Should return 401 (Unauthorized)
echo.

echo [5/5] Testing XSS in Event Creation...
echo This test requires authentication - run manually from frontend
echo Try creating event with title: ^<script^>alert('XSS')^</script^>
echo Expected: Script should not execute
echo.

echo ========================================
echo Security Tests Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Review the responses above
echo 2. Check backend/storage/logs/laravel.log for logged attempts
echo 3. Run PENTEST_GUIDE.md tests manually
echo 4. Use OWASP ZAP for automated scanning
echo.
pause
