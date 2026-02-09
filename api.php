<?php
session_start();
// capture any accidental HTML/error output and return JSON instead
ob_start();
ini_set('display_errors', '0');
header('Content-Type: application/json');

set_exception_handler(function($ex){
    http_response_code(500);
    while(ob_get_level()) ob_end_clean();
    echo json_encode(['error'=>'Exception: '.$ex->getMessage()]);
    exit;
});

register_shutdown_function(function(){
    $err = error_get_last();
    if($err){
        http_response_code(500);
        while(ob_get_level()) ob_end_clean();
        echo json_encode(['error'=>'Fatal error: '.$err['message']]);
        exit;
    }
});

$DATA_DIR = __DIR__ . '/data';
if(!is_dir($DATA_DIR)) mkdir($DATA_DIR, 0777, true);
$EVENTS_FILE = $DATA_DIR . '/events.json';
$MEMBERS_FILE = $DATA_DIR . '/members.json';
$AVAIL_FILE = $DATA_DIR . '/availability.json';

function load_json($path, $assoc=true){
    if(!file_exists($path)) return $assoc ? [] : null;
    $text = @file_get_contents($path);
    if($text === false || trim($text) === '') return $assoc ? [] : null;
    $data = json_decode($text, $assoc);
    return $data === null ? [] : $data;
}

function save_json($path, $data){
    $json = json_encode($data, JSON_PRETTY_PRINT);
    file_put_contents($path, $json, LOCK_EX);
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$action = $input['action'] ?? $_GET['action'] ?? null;

// helpers
function ensure_member($member){
    global $MEMBERS_FILE;
    $members = load_json($MEMBERS_FILE);
    if(!in_array($member, $members)){
        $members[] = $member;
        save_json($MEMBERS_FILE, $members);
    }
}

function minutes_of($time){
    // expects HH:MM format - return -1 if invalid
    if(!$time || !preg_match('/^\d{2}:\d{2}$/', $time)) return -1;
    $parts = explode(':', $time);
    $h = intval($parts[0]);
    $m = intval($parts[1]);
    if($h < 0 || $h > 23 || $m < 0 || $m > 59) return -1;
    return $h * 60 + $m;
}

function member_is_busy_at($member, $date, $time){
    global $AVAIL_FILE;
    $avail = load_json($AVAIL_FILE);
    $eventMin = minutes_of($time);
    $entries = $avail[$member] ?? [];
    foreach($entries as $e){
        if($e['date'] !== $date) continue;
        $s = minutes_of($e['start']);
        $t = minutes_of($e['end']);
        if($s <= $eventMin && $eventMin < $t) return ['busy'=>true, 'reason'=>"Busy {$e['start']}-{$e['end']} on {$date}"];
    }
    return ['busy'=>false];
}

function is_valid_cvsu_email($email){
    // Validate format: main.(firstname).(lastname)@cvsu.edu.ph
    $pattern = '/^main\.[a-zA-Z]+\.[a-zA-Z]+@cvsu\.edu\.ph$/i';
    return preg_match($pattern, $email);
}

try {
switch($action){
    case 'register':
        $username = trim($input['username'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');
        if(!$username || !$email || !$password){ http_response_code(400); echo json_encode(['error'=>'username, email and password required']); exit; }
        if(!is_valid_cvsu_email($email)){ http_response_code(400); echo json_encode(['error'=>'Email must be in format main.(firstname).(lastname)@cvsu.edu.ph']); exit; }
        $users = load_json($DATA_DIR . '/users.json');
        foreach($users as $u) if($u['email'] === $email){ http_response_code(400); echo json_encode(['error'=>'user already exists']); exit; }
        $user = ['id'=>uniqid('usr_', true), 'username'=>$username, 'email'=>$email, 'password'=>password_hash($password, PASSWORD_DEFAULT), 'created_at'=>date('c')];
        $users[] = $user;
        save_json($DATA_DIR . '/users.json', $users);
        ensure_member($email);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_username'] = $user['username'];
        echo json_encode(['message'=>'Registered successfully', 'user'=>['id'=>$user['id'], 'email'=>$user['email'], 'username'=>$user['username']]]);
        break;

    case 'login':
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');
        if(!$email || !$password){ http_response_code(400); echo json_encode(['error'=>'email and password required']); exit; }
        if(!is_valid_cvsu_email($email)){ http_response_code(400); echo json_encode(['error'=>'Email must be in format main.(firstname).(lastname)@cvsu.edu.ph']); exit; }
        $users = load_json($DATA_DIR . '/users.json');
        $found = null;
        foreach($users as $u) if($u['email'] === $email){ $found = $u; break; }
        if(!$found || !password_verify($password, $found['password'])){ http_response_code(400); echo json_encode(['error'=>'invalid email or password']); exit; }
        $_SESSION['user_id'] = $found['id'];
        $_SESSION['user_email'] = $found['email'];
        $_SESSION['user_username'] = $found['username'];
        echo json_encode(['message'=>'Logged in successfully', 'user'=>['id'=>$found['id'], 'email'=>$found['email'], 'username'=>$found['username']]]);
        break;

    case 'logout':
        session_destroy();
        echo json_encode(['message'=>'Logged out']);
        break;

    case 'get_current_user':
        if(isset($_SESSION['user_id'])){ echo json_encode(['user'=>['id'=>$_SESSION['user_id'], 'email'=>$_SESSION['user_email'], 'username'=>$_SESSION['user_username'] ?? null]]); }
        else { echo json_encode(['user'=>null]); }
        break;

    case 'create_event':
        $title = trim($input['title'] ?? 'Untitled');
        $description = trim($input['description'] ?? '');
        $department = trim($input['department'] ?? '');
        $date = $input['date'] ?? null;
        $time = $input['time'] ?? null;
        $members = $input['members'] ?? [];
        $isOpen = ($input['isOpen'] ?? false) ? true : false;
        if(!$date || !$time){ http_response_code(400); echo json_encode(['error'=>'date and time required']); exit; }
        $events = load_json($EVENTS_FILE);
        $id = uniqid('ev_', true);
        $event = ['id'=>$id, 'title'=>$title, 'description'=>$description, 'department'=>$department, 'date'=>$date, 'time'=>$time, 'members'=>$members, 'isOpen'=>$isOpen, 'created_at'=>date('c')];
        $events[] = $event;
        save_json($EVENTS_FILE, $events);
        foreach($members as $m) ensure_member($m);
        // compute availability snapshot
        $availability = [];
        foreach($members as $m){
            $check = member_is_busy_at($m, $date, $time);
            $availability[$m] = $check['busy'] ? ['available'=>false,'busy_reason'=>$check['reason']] : ['available'=>true];
        }
        echo json_encode(['message'=>'Event created','event'=>$event,'availability'=>$availability]);
        break;

    case 'list_events':
        $events = load_json($EVENTS_FILE);
        // sort by date+time
        usort($events, function($a,$b){
            $ka = $a['date'].' '.$a['time'];
            $kb = $b['date'].' '.$b['time'];
            return strcmp($ka,$kb);
        });
        echo json_encode(['events'=>$events]);
        break;

    case 'set_availability':
        $member_input = trim($input['member'] ?? '');
        $date = $input['date'] ?? null;
        $start = $input['start'] ?? null;
        $end = $input['end'] ?? null;
        if(!$member_input || !$date || !$start || !$end){ http_response_code(400); echo json_encode(['error'=>'member,date,start,end required']); exit; }
        
        // Validate time format
        $start_min = minutes_of($start);
        $end_min = minutes_of($end);
        if($start_min === -1 || $end_min === -1){
            http_response_code(400);
            echo json_encode(['error'=>'Invalid time format. Use HH:MM format']);
            exit;
        }
        if($start_min >= $end_min){
            http_response_code(400);
            echo json_encode(['error'=>'Start time must be before end time']);
            exit;
        }
        
        // Convert username to email if needed
        $users = load_json($DATA_DIR . '/users.json');
        $member_email = null;
        foreach($users as $u){
            if(isset($u['username']) && $u['username'] === $member_input){
                $member_email = $u['email'];
                break;
            }
        }
        
        // If username not found, assume input is already an email
        if(!$member_email) $member_email = $member_input;
        
        // Validate that we have a valid member
        if(!$member_email){
            http_response_code(400);
            echo json_encode(['error'=>'Member not found']);
            exit;
        }
        
        $avail = load_json($AVAIL_FILE);
        if(!isset($avail[$member_email])) $avail[$member_email] = [];
        $avail[$member_email][] = ['date'=>$date,'start'=>$start,'end'=>$end];
        save_json($AVAIL_FILE, $avail);
        ensure_member($member_email);
        echo json_encode(['message'=>'Availability saved for '.$member_input]);
        break;

    case 'get_member_availability_for_event':
        $event_id = $input['event_id'] ?? null;
        $member = $input['member'] ?? null;
        if(!$event_id || !$member){ http_response_code(400); echo json_encode(['error'=>'event_id and member required']); exit; }
        $events = load_json($EVENTS_FILE);
        $found = null;
        foreach($events as $e) if($e['id'] === $event_id) { $found = $e; break; }
        if(!$found){ http_response_code(404); echo json_encode(['error'=>'event not found']); exit; }
        $check = member_is_busy_at($member, $found['date'], $found['time']);
        if($check['busy']) echo json_encode(['available'=>false,'busy_reason'=>$check['reason']]);
        else echo json_encode(['available'=>true]);
        break;

    case 'get_registered_members':
        $users = load_json($DATA_DIR . '/users.json');
        $members = [];
        foreach($users as $u){
            if(!isset($u['username']) || !$u['username']) continue; // skip users without username
            $members[] = ['username'=>$u['username'], 'email'=>$u['email']];
        }
        echo json_encode(['members'=>$members]);
        break;

    case 'list_members':
        $users = load_json($DATA_DIR . '/users.json');
        $members = [];
        foreach($users as $u){
            if(!isset($u['username']) || !$u['username']) continue; // skip users without username
            $members[] = ['username'=>$u['username'], 'email'=>$u['email']];
        }
        echo json_encode(['members'=>$members]);
        break;

        default:
            echo json_encode(['error'=>'unknown action', 'received'=>$action]);
    }
    } catch (Throwable $t) {
        http_response_code(500);
        while (ob_get_level()) ob_end_clean();
        echo json_encode(['error' => $t->getMessage(), 'trace' => $t->getTraceAsString()]);
        exit;
    }

?>
