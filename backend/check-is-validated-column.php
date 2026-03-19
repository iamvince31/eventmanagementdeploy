<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking is_validated column in users table...\n\n";

try {
    // Check if column exists
    $columns = \Illuminate\Support\Facades\DB::select("SHOW COLUMNS FROM users LIKE 'is_validated'");
    
    if (empty($columns)) {
        echo "❌ Column 'is_validated' does NOT exist in users table!\n\n";
        echo "Available columns:\n";
        $allColumns = \Illuminate\Support\Facades\DB::select("SHOW COLUMNS FROM users");
        foreach ($allColumns as $col) {
            echo "- {$col->Field} ({$col->Type})\n";
        }
    } else {
        echo "✓ Column 'is_validated' exists!\n";
        echo "Type: {$columns[0]->Type}\n";
        echo "Null: {$columns[0]->Null}\n";
        echo "Default: {$columns[0]->Default}\n\n";
        
        // Check actual values
        $stats = \Illuminate\Support\Facades\DB::select("
            SELECT 
                is_validated,
                COUNT(*) as count
            FROM users
            GROUP BY is_validated
        ");
        
        echo "Value distribution:\n";
        foreach ($stats as $stat) {
            $value = $stat->is_validated === null ? 'NULL' : ($stat->is_validated ? 'TRUE' : 'FALSE');
            echo "- {$value}: {$stat->count} users\n";
        }
    }

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
