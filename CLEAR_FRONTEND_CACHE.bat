@echo off
echo ========================================
echo  Clear Frontend Cache and Rebuild
echo ========================================
echo.

cd frontend

echo [1/3] Clearing npm cache...
call npm cache clean --force

echo.
echo [2/3] Removing node_modules and build folders...
if exist node_modules rmdir /s /q node_modules
if exist dist rmdir /s /q dist
if exist .vite rmdir /s /q .vite

echo.
echo [3/3] Reinstalling dependencies...
call npm install

echo.
echo ========================================
echo  Cache cleared successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Start the dev server: npm run dev
echo 2. Open browser in incognito mode
echo 3. Or clear browser cache (Ctrl+Shift+Delete)
echo.
pause
