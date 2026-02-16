# Schedule Popup Fix - Only Show When Not Initialized

## Problem
The schedule setup popup was showing for all users on login, even those who had already saved their schedule. This was because the `schedule_initialized` flag wasn't being properly tracked and returned from the backend.

## Root Cause
1. The `schedule_initialized` field was not being returned in the login, register, and user profile endpoints
2. The frontend was initializing `hasSchedule` to `false` instead of checking the user's actual status
3. The user context wasn't being updated when schedule was saved

## Solution

### Backend Changes

#### 1. AuthController.php
Added `schedule_initialized` to all user response objects:

- **login()** - Returns `schedule_initialized` flag (defaults to false if null)
- **register()** - Returns `schedule_initialized: false` for new users
- **user()** - Returns current `schedule_initialized` status

#### 2. UserController.php
- **update()** - Returns `schedule_initialized` flag in profile update response

#### 3. ScheduleController.php
- Already correctly sets `schedule_initialized = true` when saving schedule (even empty schedules)
- Returns `initialized` flag in the index() method

### Frontend Changes

#### 1. Dashboard.jsx
- Initialize `hasSchedule` from user object: `useState(user?.schedule_initialized ?? false)`
- This prevents showing the popup for users who already have schedule initialized
- Still fetches latest status from API to ensure accuracy

#### 2. AddEvent.jsx
- Initialize `hasSchedule` from user object: `useState(user?.schedule_initialized ?? false)`
- Prevents redirect for users with initialized schedules
- Listens for schedule update events

#### 3. AccountDashboard.jsx
- Updates user context with `schedule_initialized: true` after saving
- Dispatches events to notify Dashboard and AddEvent pages
- Properly spreads user object to preserve all fields

## How It Works Now

1. **New User Registration**
   - User registers → `schedule_initialized: false`
   - Logs in → Dashboard shows schedule setup popup
   - User saves schedule (even empty) → `schedule_initialized: true`
   - User context updated in localStorage
   - Popup closes and won't show again

2. **Existing User Login**
   - User logs in → Backend returns `schedule_initialized: true`
   - Frontend initializes `hasSchedule` from user object
   - Dashboard loads without showing popup
   - API call confirms status

3. **Schedule Save**
   - User clicks "Save Schedule" → Backend sets `schedule_initialized: true`
   - Frontend updates user context
   - Events dispatched to all pages
   - Dashboard and AddEvent refresh their status

## Testing Checklist

- [x] New user sees popup on first login
- [x] Popup closes after saving empty schedule
- [x] User can create events after saving empty schedule
- [x] Existing user with schedule doesn't see popup
- [x] Switching accounts shows correct popup state
- [x] User context persists across page refreshes
- [x] Multiple tabs/windows stay in sync

## Files Modified

1. `backend/app/Http/Controllers/AuthController.php`
2. `backend/app/Http/Controllers/UserController.php`
3. `frontend/src/pages/Dashboard.jsx`
4. `frontend/src/pages/AddEvent.jsx`
5. `frontend/src/pages/AccountDashboard.jsx`

## Database Schema
The `schedule_initialized` column already exists in the users table from migration:
`2026_02_16_044241_add_schedule_initialized_to_users_table.php`
