<?php
/**
 * Simple Schedule Check - Direct Database Query
 */

// Database configuration from .env
$host = '127.0.0.1';
$dbname = 'event_management';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "===========================================\n";
    echo "SCHEDULE DATABASE CHECK\n";
    echo "===========================================\n\n";
    
    // Check users
    echo "1. USERS:\n";
    echo "-------------------------------------------\n";
    $stmt = $pdo->query("SELECT id, username, email, schedule_initialized FROM users ORDER BY id");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($users as $user) {
        $status = $user['schedule_initialized'] ? 'YES' : 'NO';
        echo "ID: {$user['id']} | {$user['username']} | Schedule: {$status}\n";
    }
    
    // Check schedules
    echo "\n2. SCHEDULES:\n";
    echo "-------------------------------------------\n";
    $stmt = $pdo->query("SELECT * FROM user_schedules ORDER BY user_id, day, start_time");
    $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($schedules)) {
        echo "No schedules found in database.\n";
    } else {
        echo "Total: " . count($schedules) . " schedule entries\n\n";
        
        $currentUserId = null;
        foreach ($schedules as $schedule) {
            if ($currentUserId !== $schedule['user_id']) {
                $currentUserId = $schedule['user_id'];
                echo "\nUser ID {$currentUserId}:\n";
            }
            echo "  {$schedule['day']}: {$schedule['start_time']} - {$schedule['end_time']} | {$schedule['description']}\n";
        }
    }
    
    // Count by user
    echo "\n3. SCHEDULE COUNT BY USER:\n";
    echo "-------------------------------------------\n";
    $stmt = $pdo->query("
        SELECT u.id, u.username, u.schedule_initialized, COUNT(s.id) as count
        FROM users u
        LEFT JOIN user_schedules s ON u.id = s.user_id
        GROUP BY u.id, u.username, u.schedule_initialized
        ORDER BY u.id
    ");
    $counts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($counts as $row) {
        $status = $row['schedule_initialized'] ? 'YES' : 'NO';
        echo "User {$row['id']} ({$row['username']}): {$row['count']} classes | Initialized: {$status}\n";
    }
    
    echo "\n===========================================\n";
    
} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
}
