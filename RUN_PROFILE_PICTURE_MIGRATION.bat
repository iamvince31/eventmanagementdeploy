@echo off
echo ========================================
echo PROFILE PICTURE MIGRATION
echo ========================================
echo.
echo This will add the profile_picture column to the users table.
echo.
pause

cd backend
C:\xampp\php\php.exe artisan migrate

echo.
echo ========================================
echo DONE!
echo ========================================
echo.
pause
