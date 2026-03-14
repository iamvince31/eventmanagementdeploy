<?php
/**
 * Schedule Database Checker
 * Access via: http://localhost/EventManagementSystemOJT/check-schedules.php
 */

// Database configuration
$host = '127.0.0.1';
$dbname = 'event_management';
$username = 'root';
$password = '';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Schedule Database Check</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .header p {
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 30px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #16a34a;
            font-size: 24px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #16a34a;
        }
        .info-box {
            background: #f0fdf4;
            border-left: 4px solid #16a34a;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .warning-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .error-box {
            background: #fee2e2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        th {
            background: #16a34a;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        tr:hover {
            background: #f9fafb;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .badge-success {
            background: #dcfce7;
            color: #16a34a;
        }
        .badge-danger {
            background: #fee2e2;
            color: #dc2626;
        }
        .stat {
            display: inline-block;
            background: #f3f4f6;
            padding: 8px 16px;
            border-radius: 6px;
            margin-right: 10px;
            font-weight: 600;
        }
        .user-schedule {
            background: #f9fafb;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .user-schedule h4 {
            color: #374151;
            margin-bottom: 10px;
        }
        .schedule-item {
            padding: 8px 12px;
            background: white;
            margin: 5px 0;
            border-radius: 4px;
            border-left: 3px solid #16a34a;
        }
        .day-label {
            font-weight: 600;
            color: #16a34a;
            margin-top: 10px;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 Schedule Database Check</h1>
            <p>Verify user schedules and database integrity</p>
        </div>
        
        <div class="content">
            <?php
            try {
                $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                echo '<div class="info-box">✓ Database connection successful</div>';
                
                // 1. Users Overview
                echo '<div class="section">';
                echo '<h2>1. Users Overview</h2>';
                
                $stmt = $pdo->query("SELECT id, username, email, schedule_initialized, created_at FROM users ORDER BY id");
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $totalUsers = count($users);
                $usersWithSchedule = count(array_filter($users, fn($u) => $u['schedule_initialized']));
                
                echo "<p><span class='stat'>Total Users: $totalUsers</span>";
                echo "<span class='stat'>With Schedule: $usersWithSchedule</span>";
                echo "<span class='stat'>Without Schedule: " . ($totalUsers - $usersWithSchedule) . "</span></p>";
                
                echo '<table>';
                echo '<tr><th>ID</th><th>Username</th><th>Email</th><th>Schedule Status</th><th>Created</th></tr>';
                
                foreach ($users as $user) {
                    $badge = $user['schedule_initialized'] 
                        ? "<span class='badge badge-success'>✓ Initialized</span>" 
                        : "<span class='badge badge-danger'>✗ Not Set</span>";
                    
                    echo "<tr>";
                    echo "<td>{$user['id']}</td>";
                    echo "<td><strong>{$user['username']}</strong></td>";
                    echo "<td>{$user['email']}</td>";
                    echo "<td>$badge</td>";
                    echo "<td>" . date('M d, Y', strtotime($user['created_at'])) . "</td>";
                    echo "</tr>";
                }
                
                echo '</table>';
                echo '</div>';
                
                // 2. All Schedule Entries
                echo '<div class="section">';
                echo '<h2>2. All Schedule Entries</h2>';
                
                $stmt = $pdo->query("SELECT * FROM user_schedules ORDER BY user_id, day, start_time");
                $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (empty($schedules)) {
                    echo '<div class="warning-box">⚠ No schedules found in database</div>';
                } else {
                    echo '<div class="info-box">Total schedule entries: ' . count($schedules) . '</div>';
                    
                    echo '<table>';
                    echo '<tr><th>ID</th><th>User ID</th><th>Day</th><th>Start Time</th><th>End Time</th><th>Description</th><th>Created</th></tr>';
                    
                    foreach ($schedules as $schedule) {
                        echo "<tr>";
                        echo "<td>{$schedule['id']}</td>";
                        echo "<td>{$schedule['user_id']}</td>";
                        echo "<td><strong>{$schedule['day']}</strong></td>";
                        echo "<td>{$schedule['start_time']}</td>";
                        echo "<td>{$schedule['end_time']}</td>";
                        echo "<td>" . ($schedule['description'] ?: '<em>No description</em>') . "</td>";
                        echo "<td>" . date('M d, Y H:i', strtotime($schedule['created_at'])) . "</td>";
                        echo "</tr>";
                    }
                    
                    echo '</table>';
                }
                
                echo '</div>';
                
                // 3. Schedules by User
                echo '<div class="section">';
                echo '<h2>3. Schedules Grouped by User</h2>';
                
                $stmt = $pdo->query("
                    SELECT u.id, u.username, u.email, u.schedule_initialized, COUNT(s.id) as schedule_count
                    FROM users u
                    LEFT JOIN user_schedules s ON u.id = s.user_id
                    GROUP BY u.id, u.username, u.email, u.schedule_initialized
                    ORDER BY u.id
                ");
                $userStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($userStats as $userStat) {
                    echo '<div class="user-schedule">';
                    echo "<h4>👤 {$userStat['username']} (ID: {$userStat['id']})</h4>";
                    echo "<p><strong>Email:</strong> {$userStat['email']}</p>";
                    
                    $status = $userStat['schedule_initialized'] 
                        ? "<span class='badge badge-success'>✓ Initialized</span>" 
                        : "<span class='badge badge-danger'>✗ Not Initialized</span>";
                    echo "<p><strong>Status:</strong> $status</p>";
                    echo "<p><strong>Total Classes:</strong> {$userStat['schedule_count']}</p>";
                    
                    if ($userStat['schedule_count'] > 0) {
                        // Get detailed schedule
                        $stmt = $pdo->prepare("
                            SELECT day, start_time, end_time, description 
                            FROM user_schedules 
                            WHERE user_id = ? 
                            ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), start_time
                        ");
                        $stmt->execute([$userStat['id']]);
                        $userSchedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
                        
                        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                        $scheduleByDay = [];
                        
                        foreach ($userSchedules as $schedule) {
                            $scheduleByDay[$schedule['day']][] = $schedule;
                        }
                        
                        echo '<div style="margin-top: 10px;">';
                        foreach ($days as $day) {
                            if (isset($scheduleByDay[$day])) {
                                echo "<div class='day-label'>$day</div>";
                                foreach ($scheduleByDay[$day] as $class) {
                                    $desc = $class['description'] ?: 'No description';
                                    echo "<div class='schedule-item'>";
                                    echo "🕐 {$class['start_time']} - {$class['end_time']}: <strong>$desc</strong>";
                                    echo "</div>";
                                }
                            }
                        }
                        echo '</div>';
                    }
                    
                    echo '</div>';
                }
                
                echo '</div>';
                
                // 4. Data Consistency Check
                echo '<div class="section">';
                echo '<h2>4. Data Consistency Check</h2>';
                
                // Check for inconsistencies
                $stmt = $pdo->query("
                    SELECT u.id, u.username, u.schedule_initialized, COUNT(s.id) as schedule_count
                    FROM users u
                    LEFT JOIN user_schedules s ON u.id = s.user_id
                    GROUP BY u.id, u.username, u.schedule_initialized
                    HAVING (u.schedule_initialized = 1 AND COUNT(s.id) = 0) 
                        OR (u.schedule_initialized = 0 AND COUNT(s.id) > 0)
                ");
                $inconsistencies = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (empty($inconsistencies)) {
                    echo '<div class="info-box">✓ No data inconsistencies found</div>';
                } else {
                    echo '<div class="warning-box">';
                    echo '<strong>⚠ Found ' . count($inconsistencies) . ' inconsistency(ies):</strong><br><br>';
                    foreach ($inconsistencies as $issue) {
                        if ($issue['schedule_initialized'] && $issue['schedule_count'] == 0) {
                            echo "• User <strong>{$issue['username']}</strong> (ID: {$issue['id']}) has schedule_initialized=true but no schedules<br>";
                        } else {
                            echo "• User <strong>{$issue['username']}</strong> (ID: {$issue['id']}) has {$issue['schedule_count']} schedule(s) but schedule_initialized=false<br>";
                        }
                    }
                    echo '</div>';
                }
                
                echo '</div>';
                
            } catch (PDOException $e) {
                echo '<div class="error-box">';
                echo '<strong>✗ Database Error:</strong><br>';
                echo htmlspecialchars($e->getMessage());
                echo '</div>';
            }
            ?>
            
            <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
                <p style="color: #6b7280; font-size: 14px;">
                    Generated on <?php echo date('F d, Y \a\t H:i:s'); ?>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
