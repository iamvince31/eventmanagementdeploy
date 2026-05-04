<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Users Table Structure ===\n\n";

$columns = DB::select("DESCRIBE users");

foreach ($columns as $column) {
    echo "Column: {$column->Field}\n";
    echo "  Type: {$column->Type}\n";
    echo "  Null: {$column->Null}\n";
    echo "  Key: {$column->Key}\n";
    echo "  Default: {$column->Default}\n";
    echo "  Extra: {$column->Extra}\n\n";
}
