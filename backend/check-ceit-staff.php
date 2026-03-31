<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

$staff = User::where('role', 'CEIT Staff')->get();

echo "Total CEIT Staff: " . $staff->count() . "\n\n";

foreach ($staff as $s) {
    echo "Name: {$s->name}\n";
    echo "Department: {$s->department}\n";
    echo "Email: {$s->email}\n";
    echo "Validated: " . ($s->is_validated ? 'Yes' : 'No') . "\n";
    echo "\n";
}
