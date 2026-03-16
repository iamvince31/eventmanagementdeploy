<?php

// Test database connection directly
$host = '127.0.0.1';
$port = '3306';
$database = 'event_management';
$username = 'root';
$password = '';

echo "Testing MySQL connection...\n";
echo "Host: $host\n";
echo "Port: $port\n";
echo "Database: $database\n";
echo "Username: $username\n\n";

try {
    $dsn = "mysql:host=$host;port=$port;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5, // 5 second timeout
    ]);
    
    echo "✓ Successfully connected to MySQL server!\n\n";
    
    // Check if database exists
    $stmt = $pdo->query("SHOW DATABASES LIKE '$database'");
    $dbExists = $stmt->fetch();
    
    if ($dbExists) {
        echo "✓ Database '$database' exists!\n\n";
        
        // Try to connect to the specific database
        $pdo = new PDO("mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4", $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5,
        ]);
        
        echo "✓ Successfully connected to database '$database'!\n\n";
        
        // Check tables
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo "Tables in database (" . count($tables) . "):\n";
        foreach ($tables as $table) {
            echo "  - $table\n";
        }
        
    } else {
        echo "✗ Database '$database' does NOT exist!\n";
        echo "\nTo create it, run:\n";
        echo "CREATE DATABASE $database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n";
    }
    
} catch (PDOException $e) {
    echo "✗ Connection failed!\n";
    echo "Error: " . $e->getMessage() . "\n\n";
    
    if (strpos($e->getMessage(), 'Connection refused') !== false) {
        echo "Possible causes:\n";
        echo "1. MySQL/MariaDB service is not running\n";
        echo "2. Check XAMPP Control Panel and start MySQL\n";
    } elseif (strpos($e->getMessage(), 'Access denied') !== false) {
        echo "Possible causes:\n";
        echo "1. Wrong username or password\n";
        echo "2. User doesn't have permission to access the database\n";
    } elseif (strpos($e->getMessage(), 'Unknown database') !== false) {
        echo "The database doesn't exist. Create it first.\n";
    }
}
