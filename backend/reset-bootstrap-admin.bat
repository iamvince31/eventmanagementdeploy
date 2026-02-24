@echo off
echo ========================================
echo Reset Bootstrap Admin for Testing
echo ========================================
echo.

echo Deleting all admin accounts...
php artisan tinker --execute="App\Models\User::where('role', 'admin')->delete(); echo 'All admin accounts deleted';"
echo.

echo Creating bootstrap admin...
php artisan db:seed --class=AdminSeeder
echo.

echo ========================================
echo Bootstrap Admin Ready!
echo ========================================
echo Email: admin@cvsu.edu.ph
echo Password: SetupAdmin2024!
echo ========================================
pause
