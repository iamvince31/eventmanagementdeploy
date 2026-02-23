@echo off
echo Running DefaultEventSeeder Tests...
echo.

php vendor/bin/phpunit tests/Unit/DefaultEventSeederTest.php --testdox

echo.
echo Tests complete!
pause
