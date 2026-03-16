<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== DATABASE PERFORMANCE DIAGNOSTICS ===\n\n";

// 1. Check table sizes
echo "1. TABLE SIZES:\n";
echo str_repeat("-", 60) . "\n";
$tables = DB::select("
    SELECT 
        table_name AS 'Table',
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)',
        table_rows AS 'Rows'
    FROM information_schema.TABLES
    WHERE table_schema = DATABASE()
    ORDER BY (data_length + index_length) DESC
");

foreach ($tables as $table) {
    printf("%-30s %10s MB  %10s rows\n", $table->Table, $table->{'Size (MB)'}, $table->Rows);
}

// 2. Check for missing indexes
echo "\n\n2. TABLES WITHOUT PRIMARY KEYS:\n";
echo str_repeat("-", 60) . "\n";
$noPrimaryKey = DB::select("
    SELECT t.table_name
    FROM information_schema.tables t
    LEFT JOIN information_schema.table_constraints tc 
        ON t.table_name = tc.table_name 
        AND tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = DATABASE()
    WHERE t.table_schema = DATABASE()
    AND tc.constraint_name IS NULL
    AND t.table_type = 'BASE TABLE'
");

if (empty($noPrimaryKey)) {
    echo "✓ All tables have primary keys\n";
} else {
    foreach ($noPrimaryKey as $table) {
        echo "⚠ {$table->table_name}\n";
    }
}

// 3. Check indexes on main tables
echo "\n\n3. INDEXES ON KEY TABLES:\n";
echo str_repeat("-", 60) . "\n";
$keyTables = ['events', 'users', 'default_events', 'user_schedules', 'event_images'];

foreach ($keyTables as $tableName) {
    echo "\n$tableName:\n";
    try {
        $indexes = DB::select("SHOW INDEX FROM $tableName");
        $indexGroups = [];
        foreach ($indexes as $idx) {
            $indexGroups[$idx->Key_name][] = $idx->Column_name;
        }
        foreach ($indexGroups as $indexName => $columns) {
            echo "  - $indexName: " . implode(', ', $columns) . "\n";
        }
    } catch (Exception $e) {
        echo "  Table not found\n";
    }
}

// 4. Check for slow query log status
echo "\n\n4. SLOW QUERY LOG STATUS:\n";
echo str_repeat("-", 60) . "\n";
$slowLog = DB::select("SHOW VARIABLES LIKE 'slow_query_log'");
$slowLogTime = DB::select("SHOW VARIABLES LIKE 'long_query_time'");
echo "Slow query log: " . ($slowLog[0]->Value ?? 'N/A') . "\n";
echo "Long query time: " . ($slowLogTime[0]->Value ?? 'N/A') . " seconds\n";

// 5. Check current processes
echo "\n\n5. CURRENT MYSQL PROCESSES:\n";
echo str_repeat("-", 60) . "\n";
try {
    $processes = DB::select("SHOW PROCESSLIST");
    foreach ($processes as $proc) {
        if ($proc->Command !== 'Sleep' && $proc->Time > 1) {
            printf("ID: %d | User: %s | Time: %ds | State: %s\n", 
                $proc->Id, $proc->User, $proc->Time, $proc->State ?? 'N/A');
            if ($proc->Info) {
                echo "  Query: " . substr($proc->Info, 0, 100) . "...\n";
            }
        }
    }
} catch (Exception $e) {
    echo "Cannot access process list\n";
}

// 6. Analyze specific queries that might be slow
echo "\n\n6. TESTING COMMON QUERIES:\n";
echo str_repeat("-", 60) . "\n";

$queries = [
    'Count events' => 'SELECT COUNT(*) as count FROM events',
    'Count users' => 'SELECT COUNT(*) as count FROM users',
    'Count default_events' => 'SELECT COUNT(*) as count FROM default_events',
    'Events with joins' => 'SELECT e.*, u.name FROM events e LEFT JOIN users u ON e.created_by = u.id LIMIT 10',
];

foreach ($queries as $name => $query) {
    $start = microtime(true);
    try {
        $result = DB::select($query);
        $time = round((microtime(true) - $start) * 1000, 2);
        echo "✓ $name: {$time}ms\n";
    } catch (Exception $e) {
        echo "✗ $name: ERROR - " . $e->getMessage() . "\n";
    }
}

// 7. Check for table fragmentation
echo "\n\n7. TABLE FRAGMENTATION:\n";
echo str_repeat("-", 60) . "\n";
$fragmented = DB::select("
    SELECT 
        table_name,
        ROUND(data_free / 1024 / 1024, 2) AS 'Fragmented (MB)'
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
    AND data_free > 0
    ORDER BY data_free DESC
");

if (empty($fragmented)) {
    echo "✓ No significant fragmentation\n";
} else {
    foreach ($fragmented as $table) {
        if ($table->{'Fragmented (MB)'} > 1) {
            echo "⚠ {$table->table_name}: {$table->{'Fragmented (MB)'}} MB fragmented\n";
            echo "  Run: OPTIMIZE TABLE {$table->table_name};\n";
        }
    }
}

echo "\n\n=== RECOMMENDATIONS ===\n";
echo str_repeat("-", 60) . "\n";
echo "1. If any table shows high fragmentation, run OPTIMIZE TABLE\n";
echo "2. Ensure frequently queried columns have indexes\n";
echo "3. Check if any query took > 1000ms and needs optimization\n";
echo "4. Consider adding composite indexes for common WHERE clauses\n";

