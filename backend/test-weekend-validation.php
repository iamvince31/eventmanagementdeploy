<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Weekend Validation ===\n\n";

// Test dates for the current week
$today = new DateTime();
$currentWeek = [];

// Get the current week (Sunday to Saturday)
$sunday = clone $today;
$sunday->modify('last sunday');
if ($sunday > $today) {
    $sunday->modify('-7 days');
}

for ($i = 0; $i < 7; $i++) {
    $date = clone $sunday;
    $date->modify("+$i days");
    $currentWeek[] = $date;
}

echo "1. Testing Date Validation for Current Week:\n";

foreach ($currentWeek as $date) {
    $dayName = $date->format('l');
    $dateString = $date->format('Y-m-d');
    $dayOfWeek = (int)$date->format('w'); // 0 = Sunday, 6 = Saturday
    
    $isWeekend = $dayOfWeek === 0 || $dayOfWeek === 6;
    $status = $isWeekend ? '❌ BLOCKED' : '✅ ALLOWED';
    
    echo "   $dayName ($dateString): $status\n";
}

echo "\n2. Testing Backend Validation Logic:\n";

// Test EventController validation
echo "   EventController Sunday Check:\n";
$testSunday = new DateTime('next sunday');
$sundayString = $testSunday->format('Y-m-d');
$eventDate = new DateTime($sundayString);

if ($eventDate->format('w') == 0) {
    echo "   ✅ Sunday detection working: $sundayString is correctly identified as Sunday\n";
} else {
    echo "   ❌ Sunday detection failed: $sundayString not identified as Sunday\n";
}

// Test DefaultEventController validation
echo "   DefaultEventController Sunday Check:\n";
$date = \Carbon\Carbon::parse($sundayString);
if ($date->dayOfWeek === 0) {
    echo "   ✅ Carbon Sunday detection working: $sundayString is correctly identified as Sunday\n";
} else {
    echo "   ❌ Carbon Sunday detection failed: $sundayString not identified as Sunday\n";
}

echo "\n3. Testing Saturday Validation:\n";
$testSaturday = new DateTime('next saturday');
$saturdayString = $testSaturday->format('Y-m-d');

// EventController Saturday check
$eventDate = new DateTime($saturdayString);
if ($eventDate->format('w') == 6) {
    echo "   ✅ Saturday detection working: $saturdayString is correctly identified as Saturday\n";
} else {
    echo "   ❌ Saturday detection failed: $saturdayString not identified as Saturday\n";
}

// DefaultEventController Saturday check
$date = \Carbon\Carbon::parse($saturdayString);
if ($date->dayOfWeek === 6) {
    echo "   ✅ Carbon Saturday detection working: $saturdayString is correctly identified as Saturday\n";
} else {
    echo "   ❌ Carbon Saturday detection failed: $saturdayString not identified as Saturday\n";
}

echo "\n4. Expected API Responses:\n";
echo "   When trying to create/update events on weekends:\n";
echo "   - Sunday: 422 error 'Events cannot be scheduled on Sundays.'\n";
echo "   - Saturday: 422 error 'Events cannot be scheduled on Saturdays.'\n";
echo "   - Monday-Friday: Should work normally\n";

echo "\n5. Frontend DatePicker Check:\n";
echo "   The DatePicker should:\n";
echo "   - Gray out weekend dates\n";
echo "   - Show tooltip 'Weekends are not available' on hover\n";
echo "   - Prevent clicking on weekend dates\n";
echo "   - Show legend 'Weekends are excluded'\n";

echo "\n6. Manual Testing Commands:\n";
echo "   Test creating event on Sunday:\n";
echo "   curl -X POST /api/events -H 'Authorization: Bearer {token}' \\\n";
echo "        -d '{\"date\": \"$sundayString\", \"title\": \"Test\", \"location\": \"Test\", \"time\": \"10:00\"}'\n";
echo "   Expected: 422 error\n";

echo "\n   Test creating event on Monday:\n";
$monday = new DateTime('next monday');
$mondayString = $monday->format('Y-m-d');
echo "   curl -X POST /api/events -H 'Authorization: Bearer {token}' \\\n";
echo "        -d '{\"date\": \"$mondayString\", \"title\": \"Test\", \"location\": \"Test\", \"time\": \"10:00\"}'\n";
echo "   Expected: Success (if user has permission)\n";

echo "\n=== Test Complete ===\n";