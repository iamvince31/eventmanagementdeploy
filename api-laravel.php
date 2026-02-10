<?php
/**
 * Laravel-style API for Event Management System
 * This is a bridge API that works with your existing XAMPP setup
 * while the React frontend expects Laravel-style responses
 */

header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Start session for token management
session_start();

// Database connection (using existing XAMPP MySQL)
$db = null;
try {
    $db = new PDO('mysql:host=127.0.0.1;dbname=event_management', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // Database doesn't exist yet, we'll handle this
}

// Helper functions
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function getAuthToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return $matches[1];
    }
    return null;
}

function getCurrentUser() {
    $token = getAuthToken();
    if (!$token || !isset($_SESSION['tokens'][$token])) {
        return null;
    }
    return $_SESSION['tokens'][$token];
}

function requireAuth() {
    $user = getCurrentUser();
    if (!$user) {
        jsonResponse(['message' => 'Unauthenticated'], 401);
    }
    return $user;
}

function generateToken($userId) {
    $token = bin2hex(random_bytes(32));
    if (!isset($_SESSION['tokens'])) {
        $_SESSION['tokens'] = [];
    }
    $_SESSION['tokens'][$token] = $userId;
    return $token;
}

// Get request path and method
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];
$path = parse_url($requestUri, PHP_URL_PATH);
$path = str_replace('/api-laravel.php', '', $path);

// Get request body
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Load data from JSON files (fallback if DB not ready)
$DATA_DIR = __DIR__ . '/data';
function loadJson($file) {
    global $DATA_DIR;
    $path = $DATA_DIR . '/' . $file;
    if (!file_exists($path)) return [];
    $content = file_get_contents($path);
    return json_decode($content, true) ?? [];
}

function saveJson($file, $data) {
    global $DATA_DIR;
    if (!is_dir($DATA_DIR)) mkdir($DATA_DIR, 0777, true);
    file_put_contents($DATA_DIR . '/' . $file, json_encode($data, JSON_PRETTY_PRINT));
}

// Routes
try {
    // POST /api/register
    if ($requestMethod === 'POST' && $path === '/api/register') {
        $username = $input['username'] ?? '';
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        
        if (!$username || !$email || !$password) {
            jsonResponse(['message' => 'All fields are required'], 400);
        }
        
        // Validate email format
        if (!preg_match('/^main\.[a-zA-Z]+\.[a-zA-Z]+@cvsu\.edu\.ph$/i', $email)) {
            jsonResponse(['errors' => ['email' => ['Email must be in format main.(firstname).(lastname)@cvsu.edu.ph']]], 422);
        }
        
        $users = loadJson('users.json');
        
        // Check if user exists
        foreach ($users as $u) {
            if ($u['email'] === $email) {
                jsonResponse(['message' => 'User already exists'], 400);
            }
        }
        
        // Create user
        $user = [
            'id' => count($users) + 1,
            'username' => $username,
            'email' => $email,
            'password' => password_hash($password, PASSWORD_DEFAULT),
            'created_at' => date('c')
        ];
        
        $users[] = $user;
        saveJson('users.json', $users);
        
        // Generate token
        $token = generateToken($user['id']);
        
        jsonResponse([
            'message' => 'Registered successfully',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email']
            ],
            'token' => $token
        ], 201);
    }
    
    // POST /api/login
    if ($requestMethod === 'POST' && $path === '/api/login') {
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        
        if (!$email || !$password) {
            jsonResponse(['message' => 'Email and password are required'], 400);
        }
        
        // Validate email format
        if (!preg_match('/^main\.[a-zA-Z]+\.[a-zA-Z]+@cvsu\.edu\.ph$/i', $email)) {
            jsonResponse(['errors' => ['email' => ['Email must be in format main.(firstname).(lastname)@cvsu.edu.ph']]], 422);
        }
        
        $users = loadJson('users.json');
        $user = null;
        
        foreach ($users as $u) {
            if ($u['email'] === $email) {
                $user = $u;
                break;
            }
        }
        
        if (!$user || !password_verify($password, $user['password'])) {
            jsonResponse(['message' => 'Invalid credentials'], 401);
        }
        
        // Generate token
        $token = generateToken($user['id']);
        
        jsonResponse([
            'message' => 'Logged in successfully',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email']
            ],
            'token' => $token
        ]);
    }
    
    // POST /api/logout
    if ($requestMethod === 'POST' && $path === '/api/logout') {
        $token = getAuthToken();
        if ($token && isset($_SESSION['tokens'][$token])) {
            unset($_SESSION['tokens'][$token]);
        }
        jsonResponse(['message' => 'Logged out successfully']);
    }
    
    // GET /api/user
    if ($requestMethod === 'GET' && $path === '/api/user') {
        $userId = requireAuth();
        $users = loadJson('users.json');
        
        foreach ($users as $u) {
            if ($u['id'] === $userId) {
                jsonResponse([
                    'user' => [
                        'id' => $u['id'],
                        'username' => $u['username'],
                        'email' => $u['email']
                    ]
                ]);
            }
        }
        
        jsonResponse(['message' => 'User not found'], 404);
    }
    
    // GET /api/users
    if ($requestMethod === 'GET' && $path === '/api/users') {
        requireAuth();
        $users = loadJson('users.json');
        
        $members = array_map(function($u) {
            return [
                'id' => $u['id'],
                'username' => $u['username'],
                'email' => $u['email']
            ];
        }, $users);
        
        jsonResponse(['members' => $members]);
    }
    
    // GET /api/events
    if ($requestMethod === 'GET' && $path === '/api/events') {
        requireAuth();
        $events = loadJson('events.json');
        $users = loadJson('users.json');
        
        // Create user lookup
        $userMap = [];
        foreach ($users as $u) {
            $userMap[$u['id']] = $u;
        }
        
        $formattedEvents = array_map(function($e) use ($userMap) {
            $host = $userMap[$e['host_id']] ?? null;
            $members = array_map(function($memberId) use ($userMap) {
                $u = $userMap[$memberId] ?? null;
                return $u ? [
                    'id' => $u['id'],
                    'username' => $u['username'],
                    'email' => $u['email']
                ] : null;
            }, $e['member_ids'] ?? []);
            
            return [
                'id' => $e['id'],
                'title' => $e['title'],
                'description' => $e['description'] ?? '',
                'department' => $e['department'] ?? '',
                'date' => $e['date'],
                'time' => $e['time'],
                'is_open' => $e['is_open'] ?? false,
                'host' => $host ? [
                    'id' => $host['id'],
                    'username' => $host['username'],
                    'email' => $host['email']
                ] : null,
                'members' => array_filter($members),
                'created_at' => $e['created_at'] ?? date('c')
            ];
        }, $events);
        
        // Sort by date and time
        usort($formattedEvents, function($a, $b) {
            return strcmp($a['date'] . ' ' . $a['time'], $b['date'] . ' ' . $b['time']);
        });
        
        jsonResponse(['events' => $formattedEvents]);
    }
    
    // POST /api/events
    if ($requestMethod === 'POST' && $path === '/api/events') {
        $userId = requireAuth();
        
        $title = $input['title'] ?? '';
        $description = $input['description'] ?? '';
        $department = $input['department'] ?? '';
        $date = $input['date'] ?? '';
        $time = $input['time'] ?? '';
        $memberIds = $input['member_ids'] ?? [];
        $isOpen = $input['is_open'] ?? false;
        
        if (!$title || !$date || !$time) {
            jsonResponse(['message' => 'Title, date, and time are required'], 400);
        }
        
        $events = loadJson('events.json');
        
        $event = [
            'id' => count($events) + 1,
            'title' => $title,
            'description' => $description,
            'department' => $department,
            'date' => $date,
            'time' => $time,
            'member_ids' => $memberIds,
            'is_open' => $isOpen,
            'host_id' => $userId,
            'created_at' => date('c')
        ];
        
        $events[] = $event;
        saveJson('events.json', $events);
        
        // Get user info for response
        $users = loadJson('users.json');
        $host = null;
        foreach ($users as $u) {
            if ($u['id'] === $userId) {
                $host = $u;
                break;
            }
        }
        
        $members = array_map(function($memberId) use ($users) {
            foreach ($users as $u) {
                if ($u['id'] === $memberId) {
                    return [
                        'id' => $u['id'],
                        'username' => $u['username'],
                        'email' => $u['email']
                    ];
                }
            }
            return null;
        }, $memberIds);
        
        jsonResponse([
            'message' => 'Event created successfully',
            'event' => [
                'id' => $event['id'],
                'title' => $event['title'],
                'description' => $event['description'],
                'department' => $event['department'],
                'date' => $event['date'],
                'time' => $event['time'],
                'is_open' => $event['is_open'],
                'host' => [
                    'id' => $host['id'],
                    'username' => $host['username'],
                    'email' => $host['email']
                ],
                'members' => array_filter($members)
            ]
        ], 201);
    }
    
    // PUT /api/events/{id}
    if ($requestMethod === 'PUT' && preg_match('#^/api/events/(\d+)$#', $path, $matches)) {
        $userId = requireAuth();
        $eventId = (int)$matches[1];
        
        $events = loadJson('events.json');
        $eventIndex = null;
        
        foreach ($events as $i => $e) {
            if ($e['id'] === $eventId) {
                $eventIndex = $i;
                break;
            }
        }
        
        if ($eventIndex === null) {
            jsonResponse(['error' => 'Event not found'], 404);
        }
        
        if ($events[$eventIndex]['host_id'] !== $userId) {
            jsonResponse(['error' => 'Only the host can update this event'], 403);
        }
        
        // Update event
        $events[$eventIndex]['title'] = $input['title'] ?? $events[$eventIndex]['title'];
        $events[$eventIndex]['description'] = $input['description'] ?? $events[$eventIndex]['description'];
        $events[$eventIndex]['department'] = $input['department'] ?? $events[$eventIndex]['department'];
        $events[$eventIndex]['date'] = $input['date'] ?? $events[$eventIndex]['date'];
        $events[$eventIndex]['time'] = $input['time'] ?? $events[$eventIndex]['time'];
        $events[$eventIndex]['member_ids'] = $input['member_ids'] ?? $events[$eventIndex]['member_ids'];
        $events[$eventIndex]['is_open'] = $input['is_open'] ?? $events[$eventIndex]['is_open'];
        $events[$eventIndex]['updated_at'] = date('c');
        
        saveJson('events.json', $events);
        
        jsonResponse([
            'message' => 'Event updated successfully',
            'event' => $events[$eventIndex]
        ]);
    }
    
    // GET /api/events/{eventId}/users/{userId}/availability
    if ($requestMethod === 'GET' && preg_match('#^/api/events/(\d+)/users/(\d+)/availability$#', $path, $matches)) {
        requireAuth();
        $eventId = (int)$matches[1];
        $userId = (int)$matches[2];
        
        $events = loadJson('events.json');
        $availabilities = loadJson('availability.json');
        
        $event = null;
        foreach ($events as $e) {
            if ($e['id'] === $eventId) {
                $event = $e;
                break;
            }
        }
        
        if (!$event) {
            jsonResponse(['error' => 'Event not found'], 404);
        }
        
        // Check if user is busy at event time
        $available = true;
        $userAvail = $availabilities[$userId] ?? [];
        
        foreach ($userAvail as $slot) {
            if ($slot['date'] === $event['date']) {
                // Simple time comparison
                $eventTime = strtotime($event['time']);
                $startTime = strtotime($slot['start_time']);
                $endTime = strtotime($slot['end_time']);
                
                if ($eventTime >= $startTime && $eventTime < $endTime) {
                    $available = false;
                    break;
                }
            }
        }
        
        jsonResponse([
            'available' => $available,
            'user' => ['id' => $userId]
        ]);
    }
    
    // Route not found
    jsonResponse(['message' => 'Route not found: ' . $path], 404);
    
} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
