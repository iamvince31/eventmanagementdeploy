<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Calendar 2026-2027 Events Fix Verification ===\n\n";

// Get a test user
$user = \App\Models\User::find(1);

if (!$user) {
    echo "❌ User not found\n";
    exit(1);
}

// Simulate the request
$request = new \Illuminate\Http\Request();
$request->setUserResolver(function () use ($user) {
    return $user;
});

// Call the dashboard controller
$controller = new \App\Http\Controllers\DashboardController();
$response = $controller->index($request);
$data = json_decode($response->getContent(), true);

echo "✅ Dashboard API Response:\n";
echo "   - School Year: {$data['schoolYear']}\n";
echo "   - Next School Year: {$data['nextSchoolYear']}\n";
echo "   - Total Default Events: " . count($data['defaultEvents']) . "\n\n";

// Filter 2026-2027 events
$events2026_2027 = array_filter($data['defaultEvents'], function($event) {
    return isset($event['school_year']) && $event['school_year'] === '2026-2027';
});

echo "✅ 2026-2027 Events Found: " . count($events2026_2027) . "\n\n";

if (count($events2026_2027) > 0) {
    echo "Events for 2026-2027:\n";
    foreach ($events2026_2027 as $event) {
        echo "   📅 {$event['name']}\n";
        echo "      Date: {$event['date']}\n";
        if ($event['end_date']) {
            echo "      End Date: {$event['end_date']}\n";
        }
        echo "\n";
    }
    
    echo "✅ SUCCESS: 2026-2027 events are now being returned by the dashboard API!\n";
    echo "✅ These events will now display on the calendar component.\n\n";
    
    echo "What was fixed:\n";
    echo "   - DashboardController now queries DefaultEventDate table\n";
    echo "   - This table stores dates for specific school years\n";
    echo "   - Events for both current (2025-2026) and next (2026-2027) school years are included\n";
} else {
    echo "❌ No 2026-2027 events found in response\n";
    exit(1);
}
