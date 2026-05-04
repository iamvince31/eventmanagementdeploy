<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\Route;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Analytics Endpoint\n";
echo "==========================\n\n";

// Get a test user (Admin)
$user = \App\Models\User::where('role', 'Admin')->first();

if (!$user) {
    echo "❌ No admin user found. Please create an admin user first.\n";
    exit(1);
}

echo "✓ Using user: {$user->name} ({$user->email})\n\n";

// Create a mock request
$request = new \Illuminate\Http\Request();
$request->setUserResolver(function () use ($user) {
    return $user;
});

// Call the analytics controller
$controller = new \App\Http\Controllers\AnalyticsController();

try {
    $response = $controller->index($request);
    $data = json_decode($response->getContent(), true);
    
    echo "✓ Analytics endpoint responded successfully\n\n";
    
    echo "Metrics:\n";
    echo "--------\n";
    echo "Registered Accounts: {$data['metrics']['registeredAccounts']['count']} ";
    echo "({$data['metrics']['registeredAccounts']['change']}%)\n";
    
    echo "Number of Events: {$data['metrics']['numberOfEvents']['count']} ";
    echo "({$data['metrics']['numberOfEvents']['change']}%)\n";
    
    echo "Number of Meetings: {$data['metrics']['numberOfMeetings']['count']} ";
    echo "({$data['metrics']['numberOfMeetings']['change']}%)\n";
    
    echo "Users with Personal Events: {$data['metrics']['usersWithPersonalEvents']['count']} ";
    echo "({$data['metrics']['usersWithPersonalEvents']['change']}%)\n\n";
    
    echo "Charts Data:\n";
    echo "------------\n";
    echo "Events by Department: " . count($data['charts']['eventsByDepartment']) . " departments\n";
    foreach ($data['charts']['eventsByDepartment'] as $dept) {
        echo "  - {$dept['department']}: {$dept['count']} events\n";
    }
    
    echo "\nMeetings by Department: " . count($data['charts']['meetingsByDepartment']) . " departments\n";
    foreach ($data['charts']['meetingsByDepartment'] as $dept) {
        echo "  - {$dept['department']}: {$dept['count']} meetings\n";
    }
    
    echo "\nAccepted/Rejected by Department: " . count($data['charts']['acceptedRejectedByDepartment']) . " departments\n";
    foreach ($data['charts']['acceptedRejectedByDepartment'] as $dept) {
        echo "  - {$dept['department']}: {$dept['accepted']} accepted, {$dept['rejected']} rejected\n";
    }
    
    echo "\n✓ All analytics data retrieved successfully!\n";
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
