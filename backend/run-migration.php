<?php
require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);

try {
    $kernel->call('migrate', ['--force' => true]);
    echo "Migration completed successfully!\n";
} catch (\Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
