<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Clear all org chart related caches
$cacheKeys = [
    'org_chart_all',
    'org_chart_departments',
    'system_settings_all'
];

foreach ($cacheKeys as $key) {
    Illuminate\Support\Facades\Cache::forget($key);
    echo "Cleared cache: {$key}\n";
}

// Also clear department-specific caches
$departments = \App\Models\SystemSetting::where('key', 'departments')->value('value') ?? [];
foreach ($departments as $dept) {
    $key = "org_chart_{$dept}";
    Illuminate\Support\Facades\Cache::forget($key);
    echo "Cleared cache: {$key}\n";
}

echo "\nAll organizational chart caches cleared successfully!\n";
