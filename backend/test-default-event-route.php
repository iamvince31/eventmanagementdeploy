<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\Route;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Default Event Routes ===\n\n";

// Get all routes
$routes = Route::getRoutes();

echo "1. Default Event Routes Found:\n";
$defaultEventRoutes = [];

foreach ($routes as $route) {
    $uri = $route->uri();
    $methods = implode('|', $route->methods());
    
    if (strpos($uri, 'default-events') !== false) {
        $defaultEventRoutes[] = "   - $methods $uri";
    }
}

if (empty($defaultEventRoutes)) {
    echo "   ❌ No default event routes found!\n";
} else {
    foreach ($defaultEventRoutes as $route) {
        echo "$route\n";
    }
}

echo "\n2. Checking for specific route: PUT /api/default-events/{id}/date\n";

$found = false;
foreach ($routes as $route) {
    if ($route->uri() === 'api/default-events/{id}/date' && in_array('PUT', $route->methods())) {
        $found = true;
        echo "   ✅ Route found: PUT /api/default-events/{id}/date\n";
        echo "   Controller: " . $route->getActionName() . "\n";
        break;
    }
}

if (!$found) {
    echo "   ❌ Route NOT found: PUT /api/default-events/{id}/date\n";
}

echo "\n3. Route Summary:\n";
echo "   Total routes: " . count($routes) . "\n";
echo "   Default event routes: " . count($defaultEventRoutes) . "\n";

if ($found) {
    echo "\n✅ SUCCESS: Default event date update route is properly registered!\n";
} else {
    echo "\n❌ ERROR: Default event date update route is missing!\n";
    echo "\nTo fix this, add the following line to backend/routes/api.php:\n";
    echo "Route::put('/default-events/{id}/date', [DefaultEventController::class, 'updateDate']);\n";
}

echo "\n=== Test Complete ===\n";