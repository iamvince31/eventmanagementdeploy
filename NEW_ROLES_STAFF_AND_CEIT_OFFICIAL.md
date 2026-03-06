# New Roles: Staff and CEIT Official

## Summary
Added two new user roles to the system with specific access levels:
- **Staff**: Same access level as Faculty Member
- **CEIT Official**: Same access level as Chairperson/Coordinator/Dean

## Changes Made

### 1. Database Migration
**File**: `backend/database/migrations/2026_03_05_000000_add_staff_and_ceit_official_roles.php`
- Added "Staff" and "CEIT Official" to the role enum in users table
- Migration executed successfully

### 2. Backend Updates

#### User Model (`backend/app/Models/User.php`)
- Updated `canCreateEvents()` method to include CEIT Official

#### User Controller (`backend/app/Http/Controllers/UserController.php`)
- Updated role validation to include new roles: `'Staff'` and `'CEIT Official'`

#### Event Request Controller (`backend/app/Http/Controllers/EventRequestController.php`)
- Updated to allow both Faculty Member and Staff to submit event requests
- Changed error message to reflect both roles

#### Event Controller (`backend/app/Http/Controllers/EventController.php`)
- Updated to prevent Faculty Member and Staff from creating events directly
- Added CEIT Official to roles that can create events
- Updated error messages

#### Hierarchy Service (`backend/app/Services/HierarchyService.php`)
- Added Staff at hierarchy level 1 (same as Faculty Member)
- Added CEIT Official at hierarchy level 3 (same as Chairperson)

### 3. Frontend Updates

#### App.jsx (`frontend/src/App.jsx`)
- Updated `/request-event` route to allow Faculty Member and Staff
- Updated `/add-event` route to include CEIT Official

#### Dashboard (`frontend/src/pages/Dashboard.jsx`)
- Updated role-based button logic to show "Request Event" for Faculty Member and Staff
- Updated role-based button logic to show "Add Event" for Coordinator, Chairperson, Dean, Admin, and CEIT Official
- Updated empty state messages

#### History (`frontend/src/pages/History.jsx`)
- Updated activity type filters:
  - "Requests" filter shown for Faculty Member and Staff
  - "Approvals" filter shown for Dean, Chairperson, Coordinator, and CEIT Official

#### Admin Panel (`frontend/src/pages/Admin.jsx`)
- Added "Staff" and "CEIT Official" to roles dropdown
- Added badge colors:
  - Staff: emerald (bg-emerald-100 text-emerald-800)
  - CEIT Official: teal (bg-teal-100 text-teal-800)

#### Event Form (`frontend/src/components/EventForm.jsx`)
- Updated role filter exclusion logic:
  - Dean users don't see Dean role in filter
  - CEIT Official users don't see CEIT Official role in filter

## Access Levels

### Staff (Same as Faculty Member)
- Can request events (requires approval)
- Cannot create events directly
- Can create personal events
- Can accept/decline event invitations
- Shows "Requests" filter in History

### CEIT Official (Same as Chairperson/Coordinator/Dean)
- Can create events directly (no approval needed)
- Can create personal events
- Can approve event requests
- Can invite members to events
- Shows "Approvals" filter in History
- Their own role is excluded from role filter when creating events

## Role Hierarchy
1. Faculty Member, Staff (Level 1)
2. Coordinator (Level 2)
3. Chairperson, CEIT Official (Level 3)
4. Dean (Level 4)
5. Admin (Level 5)

## Testing Recommendations
1. Create test users with Staff and CEIT Official roles
2. Verify Staff can request events but not create them directly
3. Verify CEIT Official can create events directly
4. Verify role filters in History page show correctly for each role
5. Verify role exclusion in EventForm works for CEIT Official
6. Verify hierarchy validation works with new roles
