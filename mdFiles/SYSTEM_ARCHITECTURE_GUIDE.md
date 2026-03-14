# Event Management System - Complete Architecture Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Data Flow](#data-flow)
5. [Authentication System](#authentication-system)
6. [Event Request & Approval Workflow](#event-request--approval-workflow)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Frontend Components](#frontend-components)
10. [Debugging & Monitoring](#debugging--monitoring)

---

## System Overview

Your Event Management System is a full-stack web application built with:
- **Frontend**: React (Vite) - User interface
- **Backend**: Laravel (PHP) - API server
- **Database**: SQLite - Data storage

### Architecture Pattern: Client-Server (REST API)

```
┌─────────────┐         HTTP/HTTPS          ┌─────────────┐
│   Browser   │ ◄────────────────────────► │   Laravel   │
│   (React)   │      JSON Requests          │   Backend   │
└─────────────┘                             └─────────────┘
                                                    │
                                                    ▼
                                            ┌─────────────┐
                                            │   SQLite    │
                                            │  Database   │
                                            └─────────────┘
```

---

## Technology Stack

### Frontend (React + Vite)
- **React 18**: UI library for building components
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Build tool and dev server

### Backend (Laravel 11)
- **PHP 8.2+**: Programming language
- **Laravel**: PHP framework
- **Sanctum**: API authentication
- **Eloquent ORM**: Database interactions
- **SQLite**: Lightweight database

---

## Project Structure

### Frontend Structure (`/frontend`)
```
frontend/
├── src/
│   ├── assets/          # Images, logos (CVSU.jpg, cvsu1.png, CEIT-LOGO.png)
│   ├── components/      # Reusable UI components
│   │   ├── AuthBackground.jsx      # Animated background for auth pages
│   │   ├── Calendar.jsx            # Calendar view component
│   │   ├── DatePicker.jsx          # Custom date picker
│   │   ├── EventDetails.jsx        # Event details sidebar
│   │   ├── EventForm.jsx           # Form for creating/editing events
│   │   ├── HierarchyWarning.jsx    # Approval warnings
│   │   ├── Modal.jsx               # Reusable modal component
│   │   └── NotificationBell.jsx    # Notification dropdown
│   ├── context/         # React Context for global state
│   │   └── AuthContext.jsx         # User authentication state
│   ├── pages/           # Full page components (routes)
│   │   ├── Login.jsx               # Login page
│   │   ├── Register.jsx            # Registration page
│   │   ├── Dashboard.jsx           # Main dashboard
│   │   ├── AddEvent.jsx            # Create/edit event page
│   │   ├── RequestEvent.jsx        # Request event approval
│   │   ├── EventRequests.jsx       # Review requests (Dean/Chair)
│   │   ├── AccountDashboard.jsx    # User settings & schedule
│   │   ├── Admin.jsx               # Admin panel
│   │   ├── History.jsx             # Past events
│   │   └── DefaultEvents.jsx       # Academic calendar
│   ├── services/        # API communication
│   │   └── api.js                  # Axios instance with interceptors
│   ├── App.jsx          # Main app component with routing
│   ├── index.css        # Global styles
│   └── main.jsx         # Entry point
├── .env                 # Environment variables (VITE_API_URL)
└── package.json         # Dependencies
```

### Backend Structure (`/backend`)
```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/           # Handle HTTP requests
│   │   │   ├── AuthController.php           # Login, register, logout
│   │   │   ├── EventController.php          # CRUD for events
│   │   │   ├── EventRequestController.php   # Event request approval
│   │   │   ├── UserController.php           # User management
│   │   │   ├── MessageController.php        # Notifications
│   │   │   └── ScheduleController.php       # Class schedules
│   │   ├── Middleware/            # Request filtering
│   │   │   ├── EnsureUserIsAdmin.php
│   │   │   ├── EnsureUserIsValidated.php
│   │   │   └── ThrottleLoginAttempts.php
│   │   └── Requests/              # Form validation
│   ├── Models/                    # Database models (Eloquent ORM)
│   │   ├── User.php
│   │   ├── Event.php
│   │   ├── EventRequest.php
│   │   ├── EventApproval.php
│   │   ├── Message.php
│   │   └── UserSchedule.php
│   └── Services/                  # Business logic
│       ├── HierarchyService.php           # Role hierarchy validation
│       ├── EventApprovalWorkflow.php      # Approval process
│       └── EmailVerificationService.php   # Email OTP
├── database/
│   ├── migrations/      # Database schema changes
│   └── database.sqlite  # SQLite database file
├── routes/
│   └── api.php          # API route definitions
├── .env                 # Environment variables (DB, mail config)
└── composer.json        # PHP dependencies
```

---

## Data Flow

### Example: Creating an Event from Approved Request

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. USER ACTION: Coordinator clicks "Add Event" button           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND: Dashboard.jsx                                       │
│    - Checks hasApprovedRequests state                           │
│    - Navigates to /add-event with approvedRequests in state     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. FRONTEND: AddEvent.jsx                                        │
│    - Receives approvedRequests from location.state              │
│    - Passes to EventForm component                              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. FRONTEND: EventForm.jsx                                       │
│    - Auto-selects approved request                              │
│    - Pre-fills form (title, date, time, location)               │
│    - Auto-invites approvers (Dean/Chairperson)                  │
│    - User adds more members, uploads files                      │
│    - Submits form                                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. HTTP REQUEST: POST /api/events                               │
│    Headers: Authorization: Bearer {token}                       │
│    Body (FormData):                                              │
│      - title, description, location, date, time                 │
│      - member_ids[] (array of user IDs)                         │
│      - images[] (files)                                          │
│      - approved_request_id (links to request)                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. BACKEND: routes/api.php                                       │
│    - Route: POST /events → EventController@store                │
│    - Middleware: auth:sanctum (checks authentication)           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 7. BACKEND: EventController.php → store()                       │
│    - Validates user role (Coordinator needs approved request)   │
│    - Validates form data                                         │
│    - Checks approved_request_id exists and is valid             │
│    - Skips hierarchy validation (already approved)              │
│    - Calls createEventDirectly()                                 │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 8. BACKEND: EventController.php → createEventDirectly()         │
│    - Creates Event record in database                           │
│    - Saves uploaded images to storage/events/                   │
│    - Creates EventImage records                                  │
│    - Attaches members with status='pending'                     │
│    - Links to approved request via approved_request_id          │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 9. DATABASE: SQLite                                              │
│    Tables updated:                                               │
│      - events (new row)                                          │
│      - event_images (multiple rows)                             │
│      - event_user (pivot table, member invitations)             │
│      - event_requests (approved_request_id marks as used)       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 10. HTTP RESPONSE: 200 OK                                        │
│     { "message": "Event created successfully" }                 │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 11. FRONTEND: EventForm.jsx                                      │
│     - Shows success message                                      │
│     - Calls onEventCreated() callback                           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 12. FRONTEND: AddEvent.jsx → handleEventCreated()               │
│     - Navigates to /dashboard with refresh flag                 │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 13. FRONTEND: Dashboard.jsx                                      │
│     - Detects refresh flag in location.state                    │
│     - Calls fetchData() to reload events                        │
│     - Event now appears in calendar!                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Authentication System

### How Login Works

**1. User enters credentials on Login page**
```javascript
// frontend/src/pages/Login.jsx
const handleSubmit = async (e) => {
  const response = await login(email, password);
  // Redirects based on response
};
```

**2. AuthContext handles the login**
```javascript
// frontend/src/context/AuthContext.jsx
const login = async (email, password) => {
  // POST /api/login
  const response = await api.post('/login', { email, password });
  
  // Save token to localStorage
  localStorage.setItem('token', response.data.token);
  
  // Save user data
  setUser(response.data.user);
  
  return response.data;
};
```

**3. Backend validates credentials**
```php
// backend/app/Http/Controllers/AuthController.php
public function login(LoginRequest $request) {
    // Check if user exists
    $user = User::where('email', $request->email)->first();
    
    // Verify password
    if (!Hash::check($request->password, $user->password)) {
        return response()->json(['error' => 'Invalid credentials'], 401);
    }
    
    // Create token (Laravel Sanctum)
    $token = $user->createToken('auth-token')->plainTextToken;
    
    return response()->json([
        'token' => $token,
        'user' => $user
    ]);
}
```

**4. Token is used for all subsequent requests**
```javascript
// frontend/src/services/api.js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Protected Routes

**Frontend Protection:**
```javascript
// frontend/src/App.jsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

**Backend Protection:**
```php
// backend/routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events', [EventController::class, 'store']);
    // ... more protected routes
});
```

---

## Event Request & Approval Workflow

### Complete Flow Diagram

```
COORDINATOR                    DEAN/CHAIRPERSON                 SYSTEM
    │                                │                            │
    │ 1. Submit Request              │                            │
    ├────────────────────────────────┼───────────────────────────►│
    │   POST /api/event-requests     │                            │
    │   (title, date, location...)   │                            │
    │                                │                            │
    │                                │ 2. Notification            │
    │                                │◄───────────────────────────┤
    │                                │   "New request pending"    │
    │                                │                            │
    │                                │ 3. Review Request          │
    │                                ├───────────────────────────►│
    │                                │   GET /api/event-requests  │
    │                                │                            │
    │                                │ 4. Approve/Reject          │
    │                                ├───────────────────────────►│
    │                                │   POST /api/event-requests │
    │                                │        /{id}/review        │
    │                                │                            │
    │ 5. Notification                │                            │
    │◄───────────────────────────────┼────────────────────────────┤
    │   "Request approved!"          │                            │
    │   "Add Event" button appears   │                            │
    │                                │                            │
    │ 6. Create Event                │                            │
    ├────────────────────────────────┼───────────────────────────►│
    │   POST /api/events             │                            │
    │   (with approved_request_id)   │                            │
    │                                │                            │
    │ 7. Event Created               │                            │
    │◄───────────────────────────────┼────────────────────────────┤
    │   Shows in calendar            │                            │
    │   Invites sent to members      │                            │
```

### Database Tables Involved

**event_requests table:**
```sql
- id
- title, description, date, time, location
- requested_by (user_id)
- status (pending/approved/rejected)
- dean_approved_by, dean_approved_at
- chair_approved_by, chair_approved_at
- required_approvers (JSON array)
- all_approvals_received (boolean)
```

**events table:**
```sql
- id
- title, description, date, time, location
- host_id (user who created it)
- approved_request_id (links to event_requests)
```

**event_user pivot table:**
```sql
- event_id
- user_id
- status (pending/accepted/declined)
```

---

## Database Schema

### Core Tables

**users**
```
id                  - Primary key
name                - User's full name
email               - Unique email
password            - Hashed password
role                - Enum: Admin, Dean, Chairperson, Coordinator, Faculty Member
department          - User's department
is_validated        - Boolean (email verified)
schedule_initialized - Boolean (has set up class schedule)
```

**events**
```
id                  - Primary key
title               - Event name
description         - Event details
location            - Where it happens
date                - Event date (YYYY-MM-DD)
time                - Event time (HH:MM)
host_id             - Foreign key to users (creator)
approved_request_id - Foreign key to event_requests (nullable)
```

**event_requests**
```
id                      - Primary key
title, description      - Event details
date, time, location    - Event info
requested_by            - Foreign key to users
status                  - Enum: pending, approved, rejected
dean_approved_by        - Foreign key to users (nullable)
dean_approved_at        - Timestamp (nullable)
chair_approved_by       - Foreign key to users (nullable)
chair_approved_at       - Timestamp (nullable)
required_approvers      - JSON array of user IDs
all_approvals_received  - Boolean
rejection_reason        - Text (nullable)
```

**event_user (pivot)**
```
event_id    - Foreign key to events
user_id     - Foreign key to users
status      - Enum: pending, accepted, declined
```

**user_schedules**
```
id          - Primary key
user_id     - Foreign key to users
day         - Day of week (monday-sunday)
start_time  - Class start time
end_time    - Class end time
description - Class name/description
```

**messages**
```
id              - Primary key
sender_id       - Foreign key to users
recipient_id    - Foreign key to users
event_id        - Foreign key to events (nullable)
type            - Message type (decline_reason, etc.)
message         - Text content
is_read         - Boolean
```

### Relationships

```
User
├── hasMany: events (as host)
├── belongsToMany: events (as member)
├── hasMany: event_requests (as requester)
├── hasMany: user_schedules
└── hasMany: messages (sent and received)

Event
├── belongsTo: user (host)
├── belongsToMany: users (members)
├── hasMany: event_images
├── belongsTo: event_request (approved_request)
└── hasMany: messages

EventRequest
├── belongsTo: user (requester)
├── belongsTo: user (dean_approver)
├── belongsTo: user (chair_approver)
└── hasOne: event
```

---

## API Endpoints

### Authentication Endpoints

```
POST   /api/register
       Body: { name, email, password, department, role }
       Response: { token, user }

POST   /api/login
       Body: { email, password }
       Response: { token, user }

POST   /api/logout
       Headers: Authorization: Bearer {token}
       Response: { message }

POST   /api/verify-email
       Body: { email, otp }
       Response: { message }
```

### Event Endpoints

```
GET    /api/events
       Headers: Authorization: Bearer {token}
       Response: { events: [...] }
       Returns: Events where user is host or member

POST   /api/events
       Headers: Authorization: Bearer {token}
       Body: FormData {
         title, description, location, date, time,
         member_ids[], images[], approved_request_id
       }
       Response: { message, event }

PUT    /api/events/{id}
       Headers: Authorization: Bearer {token}
       Body: FormData (same as POST)
       Response: { message }

DELETE /api/events/{id}
       Headers: Authorization: Bearer {token}
       Response: { message }

POST   /api/events/{id}/respond
       Headers: Authorization: Bearer {token}
       Body: { status: 'accepted' | 'declined' }
       Response: { message }
```

### Event Request Endpoints

```
GET    /api/event-requests
       Headers: Authorization: Bearer {token}
       Response: { requests: [...] }
       Access: Dean, Chairperson, Admin

POST   /api/event-requests
       Headers: Authorization: Bearer {token}
       Body: { title, description, date, time, location, ... }
       Response: { message, request }
       Access: Coordinator, Chairperson

POST   /api/event-requests/{id}/review
       Headers: Authorization: Bearer {token}
       Body: { status: 'approved' | 'rejected', rejection_reason }
       Response: { message }
       Access: Dean, Chairperson

GET    /api/event-requests/has-approved
       Headers: Authorization: Bearer {token}
       Response: { 
         has_approved_requests: boolean,
         approved_requests: [...]
       }

GET    /api/event-requests/my-requests
       Headers: Authorization: Bearer {token}
       Response: { requests: [...] }
```

### User & Schedule Endpoints

```
GET    /api/users
       Headers: Authorization: Bearer {token}
       Response: { members: [...] }

GET    /api/schedule
       Headers: Authorization: Bearer {token}
       Response: { schedule: {...} }

POST   /api/schedule
       Headers: Authorization: Bearer {token}
       Body: { schedule: {...} }
       Response: { message }
```

---

## Frontend Components Deep Dive

### Component Hierarchy

```
App.jsx (Router)
├── Login.jsx
├── Register.jsx
├── Dashboard.jsx
│   ├── NotificationBell.jsx
│   ├── Calendar.jsx
│   ├── EventDetails.jsx
│   └── Modal.jsx
│       └── (Event details content)
├── AddEvent.jsx
│   └── EventForm.jsx
│       ├── DatePicker.jsx
│       └── HierarchyWarning.jsx
├── RequestEvent.jsx
├── EventRequests.jsx
├── AccountDashboard.jsx
└── Admin.jsx
```

### Key Components Explained

#### 1. Dashboard.jsx
**Purpose:** Main hub showing calendar and events

**State Management:**
```javascript
const [events, setEvents] = useState([]);           // All events
const [selectedDate, setSelectedDate] = useState(null);
const [approvedRequests, setApprovedRequests] = useState([]);
const [hasApprovedRequests, setHasApprovedRequests] = useState(false);
```

**Key Functions:**
- `fetchData()` - Loads events from API
- `checkApprovedRequests()` - Checks for approved requests
- `handleViewEvent()` - Opens event details modal
- `handleAddEventClick()` - Navigates to /add-event

**Data Flow:**
```
useEffect (on mount)
  ├─► fetchData()
  │     └─► GET /api/events
  │           └─► setEvents(data)
  ├─► checkApprovedRequests()
  │     └─► GET /api/event-requests/has-approved
  │           └─► setHasApprovedRequests(true)
  └─► fetchMyEventRequests()
        └─► GET /api/event-requests/my-requests
```

#### 2. EventForm.jsx
**Purpose:** Form for creating/editing events

**Props:**
```javascript
{
  members,              // All users to invite
  onEventCreated,       // Callback after creation
  editingEvent,         // Event being edited (null for new)
  approvedRequests,     // Approved requests (for Coordinators)
  currentUser           // Logged-in user
}
```

**Key Logic:**
```javascript
// Auto-select approved request if only one
useEffect(() => {
  if (approvedRequests.length === 1) {
    handleApprovedRequestSelect(approvedRequests[0]);
  }
}, [approvedRequests]);

// Pre-fill form from approved request
const handleApprovedRequestSelect = (request) => {
  setTitle(request.title);
  setDate(request.date);
  setTime(request.time);
  // Auto-invite approvers
  setSelectedMembers([
    request.dean_approved_by,
    request.chair_approved_by
  ]);
};
```

#### 3. Calendar.jsx
**Purpose:** Visual calendar showing events

**How it works:**
```javascript
// Generate calendar grid
const getDaysInMonth = () => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Create array of day objects
  const days = [];
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Find events for this day
    const dayEvents = events.filter(e => e.date === dateStr);
    
    days.push({ date: dateStr, events: dayEvents });
  }
  return days;
};
```

#### 4. NotificationBell.jsx
**Purpose:** Show notifications and approved requests

**Notifications include:**
- Pending event invitations
- Approved event requests
- Decline reason messages

```javascript
const fetchMessages = async () => {
  const response = await api.get('/messages');
  setMessages(response.data.messages);
};

// Count unread
const unreadCount = messages.filter(m => !m.is_read).length 
                  + pendingInvitations.length
                  + approvedRequests.length;
```

---

## Debugging & Monitoring

### How to Debug Data Flow

#### 1. Browser Developer Tools

**Network Tab:**
```
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Perform action (e.g., create event)
5. Click on request to see:
   - Request Headers (Authorization token)
   - Request Payload (data sent)
   - Response (data received)
   - Status Code (200, 403, 500, etc.)
```

**Console Tab:**
```javascript
// Check for errors
console.error('Error:', error);

// Log data flow
console.log('Approved requests:', approvedRequests);
console.log('Selected request:', selectedApprovedRequest);
console.log('Form data:', { title, date, time });
```

**React DevTools:**
```
1. Install React DevTools extension
2. Open Components tab
3. Select component (e.g., Dashboard)
4. View props and state in real-time
5. See hooks and their values
```

#### 2. Backend Debugging

**Laravel Logs:**
```bash
# View real-time logs
tail -f backend/storage/logs/laravel.log

# Check for errors
grep "ERROR" backend/storage/logs/laravel.log
```

**Add Debug Logging:**
```php
// In any controller
use Illuminate\Support\Facades\Log;

public function store(Request $request) {
    Log::info('Creating event', [
        'user_id' => $request->user()->id,
        'data' => $request->all()
    ]);
    
    // ... rest of code
}
```

**Database Queries:**
```php
// Enable query logging
DB::enableQueryLog();

// Your code here
$events = Event::with('host')->get();

// See queries
dd(DB::getQueryLog());
```

#### 3. Common Issues & Solutions

**Issue: 403 Forbidden**
```
Cause: User doesn't have permission
Check:
  1. User role in database
  2. Route middleware in api.php
  3. Controller authorization logic
  
Solution: Verify user has correct role
```

**Issue: 500 Internal Server Error**
```
Cause: Backend code error
Check:
  1. Laravel logs (storage/logs/laravel.log)
  2. PHP error logs
  3. Database connection
  
Solution: Read error message in logs
```

**Issue: Event not showing in calendar**
```
Cause: Query doesn't include user
Check:
  1. User is host? (host_id = user.id)
  2. User is member? (event_user table)
  3. Event date format correct?
  
Solution: Check EventController index() query
```

**Issue: CORS errors**
```
Cause: Backend not allowing frontend origin
Check:
  1. backend/config/cors.php
  2. Laravel server running?
  3. Correct API URL in frontend/.env
  
Solution: Restart Laravel server
```

---

## How to Trace a Feature End-to-End

### Example: Tracing "Accept Event Invitation"

**Step 1: Find the UI Element**
```
Location: Dashboard.jsx
Line: ~1197
Code: <button onClick={() => api.post(`/events/${selectedEvent.id}/respond`, { status: 'accepted' })}>
```

**Step 2: Identify the API Call**
```javascript
// frontend/src/pages/Dashboard.jsx
await api.post(`/events/${selectedEvent.id}/respond`, { 
  status: 'accepted' 
});
```

**Step 3: Find the Route**
```php
// backend/routes/api.php
Route::post('/events/{event}/respond', [EventController::class, 'respondToInvitation']);
```

**Step 4: Find the Controller Method**
```php
// backend/app/Http/Controllers/EventController.php
public function respondToInvitation(Request $request, Event $event) {
    $user = $request->user();
    $status = $request->status; // 'accepted' or 'declined'
    
    // Update pivot table
    $event->members()->updateExistingPivot($user->id, [
        'status' => $status
    ]);
    
    return response()->json(['message' => 'Response recorded']);
}
```

**Step 5: Check Database Changes**
```sql
-- event_user table updated
SELECT * FROM event_user 
WHERE event_id = ? AND user_id = ?;

-- status changed from 'pending' to 'accepted'
```

**Step 6: Verify Frontend Update**
```javascript
// After API call succeeds
await fetchData();  // Reloads events
const updatedEvent = events.find(e => e.id === selectedEvent.id);
setSelectedEvent(updatedEvent);  // Updates modal
```

---

## State Management Flow

### Global State (AuthContext)

```javascript
// frontend/src/context/AuthContext.jsx
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Load user on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();  // GET /api/user
    }
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage in any component
const { user } = useAuth();
```

### Local State (Component)

```javascript
// frontend/src/pages/Dashboard.jsx
export default function Dashboard() {
  // Component-specific state
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);
  
  // Update state
  const fetchData = async () => {
    const response = await api.get('/events');
    setEvents(response.data.events);
  };
}
```

### Props Flow (Parent → Child)

```javascript
// Parent: Dashboard.jsx
<Calendar 
  events={events}                    // Pass data down
  onDateSelect={handleDateSelect}    // Pass callback up
/>

// Child: Calendar.jsx
export default function Calendar({ events, onDateSelect }) {
  const handleClick = (date) => {
    onDateSelect(date, eventsForDate);  // Call parent callback
  };
}
```

---

## File Upload Flow

### How Image/PDF Upload Works

**1. User selects files**
```javascript
// frontend/src/components/EventForm.jsx
<input 
  type="file" 
  accept="image/*,application/pdf"
  multiple
  onChange={handleFileChange}
/>

const handleFileChange = (e) => {
  const files = Array.from(e.target.files);
  setImages(files);  // Store File objects
  
  // Create previews
  const previews = files.map(file => URL.createObjectURL(file));
  setImagePreviews(previews);
};
```

**2. Files sent as FormData**
```javascript
const formData = new FormData();
formData.append('title', title);
formData.append('date', date);

// Append each file
images.forEach((image) => {
  formData.append('images[]', image);
});

await api.post('/events', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

**3. Backend receives and validates**
```php
// backend/app/Http/Controllers/EventController.php
$request->validate([
    'images' => 'nullable|array|max:5',
    'images.*' => 'file|mimes:jpeg,jpg,png,gif,webp,pdf|max:25600',
]);

// 25600 KB = 25 MB per file
```

**4. Files stored in filesystem**
```php
if ($request->hasFile('images')) {
    foreach ($request->file('images') as $index => $image) {
        // Store in storage/app/public/events/
        $imagePath = $image->store('events', 'public');
        
        // Save to database
        $event->images()->create([
            'image_path' => $imagePath,
            'original_filename' => $image->getClientOriginalName(),
            'order' => $index,
        ]);
    }
}
```

**5. Files served back to frontend**
```php
// EventController returns URLs
'images' => $event->images->map(fn($img) => [
    'url' => asset('storage/' . $img->image_path),
    'original_filename' => $img->original_filename,
])
```

**6. Frontend displays files**
```javascript
// Check if PDF or image
const isPdf = imageUrl.toLowerCase().endsWith('.pdf');

{isPdf ? (
  <a href={imageUrl} target="_blank">
    Open PDF
  </a>
) : (
  <img src={imageUrl} alt="Event" />
)}
```

---

## Environment Variables

### Frontend (.env)
```bash
# frontend/.env
VITE_API_URL=http://localhost:8000

# Used in:
# frontend/src/services/api.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api'
});
```

### Backend (.env)
```bash
# backend/.env
APP_NAME="Event Management"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM_ADDRESS=your-email@gmail.com

SANCTUM_STATEFUL_DOMAINS=localhost:5173
SESSION_DOMAIN=localhost
```

---

## Running the Application

### Development Setup

**1. Start Backend (Laravel)**
```bash
cd backend

# Install dependencies (first time only)
composer install

# Set up environment
cp .env.example .env
php artisan key:generate

# Run migrations
php artisan migrate

# Create storage link
php artisan storage:link

# Start server
php artisan serve
# Server runs at: http://localhost:8000
```

**2. Start Frontend (React)**
```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
# Server runs at: http://localhost:5173
```

**3. Access Application**
```
Open browser: http://localhost:5173
Backend API: http://localhost:8000/api
```

### Common Commands

**Backend:**
```bash
# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Create new migration
php artisan make:migration create_table_name

# Run migrations
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Create controller
php artisan make:controller NameController

# Create model
php artisan make:model ModelName

# View routes
php artisan route:list
```

**Frontend:**
```bash
# Install new package
npm install package-name

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Testing Data Flow

### Manual Testing Checklist

**1. Test Authentication**
```
□ Register new user
□ Verify email with OTP
□ Login with credentials
□ Check token in localStorage
□ Access protected route
□ Logout
```

**2. Test Event Creation**
```
□ Navigate to /add-event
□ Fill form (title, date, time, location)
□ Select members to invite
□ Upload image/PDF
□ Submit form
□ Check event appears in calendar
□ Verify database has event record
```

**3. Test Event Request Flow**
```
□ Login as Coordinator
□ Submit event request
□ Login as Dean
□ See request in /event-requests
□ Approve request
□ Login as Coordinator
□ See "Add Event" button
□ Create event from approved request
□ Verify event linked to request
```

**4. Test Invitations**
```
□ Create event with members
□ Login as invited member
□ See pending invitation
□ Accept invitation
□ Check status updated in database
□ Verify event shows in calendar
```

---

## Advanced Topics

### Role-Based Access Control (RBAC)

**Role Hierarchy:**
```
Admin > Dean > Chairperson > Coordinator > Faculty Member
```

**Permissions by Role:**

| Action | Admin | Dean | Chair | Coord | Faculty |
|--------|-------|------|-------|-------|---------|
| Create Event Directly | ✓ | ✓ | ✓ | ✗ | ✗ |
| Request Event | ✗ | ✗ | ✓ | ✓ | ✗ |
| Approve Requests | ✓ | ✓ | ✓ | ✗ | ✗ |
| View All Users | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage Users | ✓ | ✗ | ✗ | ✗ | ✗ |

**Implementation:**

```php
// Backend: Route protection
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/admin/users', [AdminController::class, 'index']);
});

// Backend: Controller check
if (!in_array($user->role, ['Admin', 'Dean', 'Chairperson'])) {
    return response()->json(['error' => 'Unauthorized'], 403);
}
```

```javascript
// Frontend: Route protection
<Route path="/admin" element={
  <RoleProtectedRoute allowedRoles={['Admin']}>
    <Admin />
  </RoleProtectedRoute>
} />

// Frontend: Conditional rendering
{user?.role === 'Admin' && (
  <button onClick={handleAdminAction}>Admin Only</button>
)}
```

### Hierarchy Validation

**Purpose:** Prevent lower roles from inviting higher roles without approval

**Example:**
- Coordinator invites Dean → Requires approval
- Chairperson invites Faculty → No approval needed

**Implementation:**
```php
// backend/app/Services/HierarchyService.php
public function validateInvitations(User $host, array $memberIds) {
    $roleHierarchy = [
        'Admin' => 5,
        'Dean' => 4,
        'Chairperson' => 3,
        'Coordinator' => 2,
        'Faculty Member' => 1,
    ];
    
    $hostLevel = $roleHierarchy[$host->role];
    $violations = [];
    
    foreach ($memberIds as $memberId) {
        $member = User::find($memberId);
        $memberLevel = $roleHierarchy[$member->role];
        
        if ($memberLevel > $hostLevel) {
            $violations[] = $member;
        }
    }
    
    return new ValidationResult(
        requiresApproval: count($violations) > 0,
        violations: $violations
    );
}
```

---

## Performance Optimization

### Frontend Optimization

**1. Lazy Loading Routes**
```javascript
// Instead of:
import Dashboard from './pages/Dashboard';

// Use:
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

**2. Memoization**
```javascript
// Prevent unnecessary re-renders
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

**3. Debouncing API Calls**
```javascript
// Search with debounce
const debouncedSearch = debounce((query) => {
  api.get(`/search?q=${query}`);
}, 300);
```

### Backend Optimization

**1. Eager Loading (N+1 Problem)**
```php
// Bad: N+1 queries
$events = Event::all();
foreach ($events as $event) {
    echo $event->host->name;  // Separate query each time
}

// Good: 2 queries total
$events = Event::with('host')->get();
foreach ($events as $event) {
    echo $event->host->name;  // Already loaded
}
```

**2. Query Optimization**
```php
// Only select needed columns
Event::select('id', 'title', 'date')->get();

// Use pagination
Event::paginate(20);

// Cache results
Cache::remember('events', 3600, function () {
    return Event::all();
});
```

---

## Security Best Practices

### Frontend Security

**1. XSS Prevention**
```javascript
// React automatically escapes
<div>{userInput}</div>  // Safe

// Dangerous (avoid):
<div dangerouslySetInnerHTML={{__html: userInput}} />
```

**2. Token Storage**
```javascript
// Store in localStorage (current implementation)
localStorage.setItem('token', token);

// Alternative: httpOnly cookies (more secure)
// Requires backend configuration
```

**3. Input Validation**
```javascript
// Always validate on frontend AND backend
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

### Backend Security

**1. SQL Injection Prevention**
```php
// Bad: Raw SQL
DB::select("SELECT * FROM users WHERE email = '$email'");

// Good: Parameter binding
DB::select("SELECT * FROM users WHERE email = ?", [$email]);

// Best: Eloquent ORM
User::where('email', $email)->first();
```

**2. Mass Assignment Protection**
```php
// Model: Define fillable fields
protected $fillable = ['name', 'email', 'department'];

// Prevents:
User::create($request->all());  // Can't set 'role' or 'is_admin'
```

**3. Rate Limiting**
```php
// Throttle login attempts
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');  // 5 attempts per minute
```

---

## Conclusion

This guide covers the core architecture and data flow of your Event Management System. Key takeaways:

1. **Frontend (React)** handles UI and user interactions
2. **Backend (Laravel)** processes requests and manages data
3. **Database (SQLite)** stores all persistent data
4. **API (REST)** connects frontend and backend
5. **Authentication (Sanctum)** secures endpoints
6. **Roles & Permissions** control access
7. **Event Request Workflow** manages approvals

### Next Steps for Learning

1. **Modify existing features** - Change colors, add fields
2. **Add console.log()** everywhere to see data flow
3. **Use browser DevTools** to inspect network requests
4. **Read Laravel docs** - https://laravel.com/docs
5. **Read React docs** - https://react.dev

### Getting Help

- Check `storage/logs/laravel.log` for backend errors
- Check browser console for frontend errors
- Use `dd($variable)` in PHP to dump and die
- Use `console.log(variable)` in JavaScript to inspect

---

**Document Version:** 1.0  
**Last Updated:** March 3, 2026  
**Author:** System Documentation
