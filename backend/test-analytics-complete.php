<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\Route;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Analytics API Test ===\n\n";

// Get an admin user token
$admin = \App\Models\User::where('designation', 'Admin')->first();

if (!$admin) {
    echo "❌ No admin user found\n";
    exit(1);
}

echo "✓ Testing with admin user: {$admin->username}\n\n";

// Create a token for the admin
$token = $admin->createToken('test-token')->plainTextToken;

// Make a request to the analytics endpoint
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost/EventManagementSystemOJT/backend/public/api/analytics');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json',
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $httpCode\n\n";

if ($httpCode === 200) {
    $data = json_decode($response, true);
    
    echo "✓ Analytics data retrieved successfully!\n\n";
    
    echo "=== Metrics ===\n";
    echo "Registered Accounts: {$data['metrics']['registeredAccounts']['count']} (";
    echo ($data['metrics']['registeredAccounts']['change'] >= 0 ? '+' : '') . $data['metrics']['registeredAccounts']['change'] . "%)\n";
    
    echo "Number of Events: {$data['metrics']['numberOfEvents']['count']} (";
    echo ($data['metrics']['numberOfEvents']['change'] >= 0 ? '+' : '') . $data['metrics']['numberOfEvents']['change'] . "%)\n";
    
    echo "Number of Meetings: {$data['metrics']['numberOfMeetings']['count']} (";
    echo ($data['metrics']['numberOfMeetings']['change'] >= 0 ? '+' : '') . $data['metrics']['numberOfMeetings']['change'] . "%)\n";
    
    echo "Users with Personal Events: {$data['metrics']['usersWithPersonalEvents']['count']} (";
    echo ($data['metrics']['usersWithPersonalEvents']['change'] >= 0 ? '+' : '') . $data['metrics']['usersWithPersonalEvents']['change'] . "%)\n\n";
    
    echo "=== Charts Data ===\n";
    echo "Events by Department: " . count($data['charts']['eventsByDepartment']) . " departments\n";
    echo "Meetings by Department: " . count($data['charts']['meetingsByDepartment']) . " departments\n";
    echo "Acceptance/Rejection Data: " . count($data['charts']['acceptedRejectedByDepartment']) . " departments\n\n";
    
    echo "Current Semester: " . ucfirst($data['semester']) . "\n\n";
    
    echo "✓ All analytics data is properly structured!\n";
} else {
    echo "❌ Failed to retrieve analytics data\n";
    echo "Response: $response\n";
}

// Clean up token
$admin->tokens()->delete();

echo "\n=== Test Complete ===\n";
