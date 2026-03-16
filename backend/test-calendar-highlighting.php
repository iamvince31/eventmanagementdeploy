<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Calendar Highlighting ===\n\n";

// Test 1: Check if default events with dates exist
echo "1. Checking Default Events with Dates:\n";

$defaultEvents = \App\Models\DefaultEvent::whereNotNull('date')->get();

if ($defaultEvents->isEmpty()) {
    echo "   ❌ No default events with dates found\n";
    echo "   To test calendar highlighting, you need to set dates for some default events\n";
} else {
    echo "   ✅ Found " . $defaultEvents->count() . " default events with dates:\n";
    foreach ($defaultEvents as $event) {
        echo "   - {$event->name} ({$event->date})\n";
    }
}

echo "\n2. Testing EventController API Response:\n";

// Simulate API request
try {
    // Create a test user (we'll use the first admin user)
    $user = \App\Models\User::where('role', 'Admin')->first();
    
    if (!$user) {
        echo "   ❌ No admin user found for testing\n";
        echo "   Please create an admin user first\n";
        return;
    }
    
    echo "   Using test user: {$user->name} (ID: {$user->id})\n";
    
    // Create a mock request
    $request = new \Illuminate\Http\Request();
    $request->setUserResolver(function () use ($user) {
        return $user;
    });
    
    // Call the EventController index method
    $controller = new \App\Http\Controllers\EventController();
    $response = $controller->index($request);
    
    $data = json_decode($response->getContent(), true);
    
    if (!isset($data['events'])) {
        echo "   ❌ API response doesn't contain 'events' key\n";
        return;
    }
    
    $events = $data['events'];
    $defaultEventCount = 0;
    $regularEventCount = 0;
    
    foreach ($events as $event) {
        if (isset($event['is_default_event']) && $event['is_default_event']) {
            $defaultEventCount++;
        } else {
            $regularEventCount++;
        }
    }
    
    echo "   ✅ API Response Analysis:\n";
    echo "   - Total events: " . count($events) . "\n";
    echo "   - Default events: $defaultEventCount\n";
    echo "   - Regular events: $regularEventCount\n";
    
    // Check if default events have the correct structure
    $hasDefaultEvents = false;
    foreach ($events as $event) {
        if (isset($event['is_default_event']) && $event['is_default_event']) {
            $hasDefaultEvents = true;
            echo "   - Default event example: {$event['title']} (Date: {$event['date']})\n";
            break;
        }
    }
    
    if ($hasDefaultEvents) {
        echo "   ✅ Default events are properly included with is_default_event flag\n";
    } else {
        echo "   ❌ No default events found in API response\n";
    }
    
} catch (Exception $e) {
    echo "   ❌ Error testing API: " . $e->getMessage() . "\n";
}

echo "\n3. Frontend Calendar Integration Check:\n";
echo "   The calendar should now:\n";
echo "   - Show dates with academic events with green background\n";
echo "   - Display blue dots for academic events\n";
echo "   - Show academic events in the event details panel\n";

echo "\n4. Manual Testing Steps:\n";
echo "   1. Go to Academic Calendar page (/default-events)\n";
echo "   2. Set dates for some academic events\n";
echo "   3. Go to Dashboard\n";
echo "   4. Check if dates with academic events have green background\n";
echo "   5. Click on those dates to see academic events listed\n";

echo "\n=== Test Complete ===\n";