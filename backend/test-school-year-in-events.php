<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Event;
use App\Models\User;

echo "=== Testing School Year in Events API ===\n\n";

// Get a test user
$user = User::where('role', 'admin')->first();

if (!$user) {
    $user = User::first();
    if (!$user) {
        echo "No users found. Please create one first.\n";
        exit(1);
    }
}

echo "Testing with user: {$user->name} (ID: {$user->id})\n\n";

// Get events for this user
$events = Event::with(['host', 'members', 'images', 'rescheduleRequests'])
    ->where(function ($query) use ($user) {
        $query->where('host_id', $user->id)
            ->orWhereHas('members', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            });
    })
    ->where(function ($query) use ($user) {
        $query->where('is_personal', false)
            ->orWhere(function ($q) use ($user) {
                $q->where('is_personal', true)
                  ->where('host_id', $user->id);
            });
    })
    ->orderBy('date')
    ->orderBy('time')
    ->get();

echo "Found " . $events->count() . " events\n\n";

// Check if any events have school_year
$eventsWithSchoolYear = $events->filter(fn($e) => !empty($e->school_year));
echo "Events with school_year: " . $eventsWithSchoolYear->count() . "\n\n";

if ($eventsWithSchoolYear->count() > 0) {
    echo "Sample events with school_year:\n";
    foreach ($eventsWithSchoolYear->take(3) as $event) {
        echo "  - {$event->title} (Date: {$event->date}, School Year: {$event->school_year})\n";
    }
} else {
    echo "No events with school_year found.\n";
    echo "\nShowing first 3 events:\n";
    foreach ($events->take(3) as $event) {
        echo "  - {$event->title} (Date: {$event->date}, School Year: " . ($event->school_year ?? 'NULL') . ")\n";
    }
}

echo "\n=== Test Complete ===\n";
