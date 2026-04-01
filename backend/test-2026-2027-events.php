<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing 2026-2027 Default Events ===\n\n";

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

echo "School Year: {$data['schoolYear']}\n";
echo "Next School Year: {$data['nextSchoolYear']}\n\n";

echo "=== Default Events ===\n";
foreach ($data['defaultEvents'] as $event) {
    echo "ID: {$event['id']}\n";
    echo "Name: {$event['name']}\n";
    echo "Date: {$event['date']}\n";
    echo "School Year: " . ($event['school_year'] ?? 'N/A') . "\n";
    echo "---\n";
}

echo "\nTotal Default Events: " . count($data['defaultEvents']) . "\n";

// Check specifically for 2026-2027
$events2026_2027 = array_filter($data['defaultEvents'], function($event) {
    return isset($event['school_year']) && $event['school_year'] === '2026-2027';
});

echo "\n=== 2026-2027 Events ===\n";
echo "Count: " . count($events2026_2027) . "\n";
foreach ($events2026_2027 as $event) {
    echo "- {$event['name']} on {$event['date']}\n";
}

if (count($events2026_2027) > 0) {
    echo "\n✅ 2026-2027 events are being returned!\n";
} else {
    echo "\n❌ No 2026-2027 events found in response\n";
}
