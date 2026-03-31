<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Cache;

Cache::forget('org_chart_departments');
Cache::forget('org_chart_all');

echo "Cache cleared successfully\n";
