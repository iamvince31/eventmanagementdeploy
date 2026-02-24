<?php

// Simulate an API request
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/default-events?school_year=2025-2026';
$_GET['school_year'] = '2025-2026';

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Http\Kernel');

$request = Illuminate\Http\Request::create(
    '/api/default-events?school_year=2025-2026',
    'GET',
    ['school_year' => '2025-2026']
);

$response = $kernel->handle($request);

echo "Status Code: " . $response->getStatusCode() . "\n";
echo "Response:\n";
echo $response->getContent() . "\n";

$kernel->terminate($request, $response);
