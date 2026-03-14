# Department-Based Approval Routing Implementation

## Summary
Implemented department-based approval routing for Faculty/Staff event requests where:
- **Dean** approves ALL requests from any department
- **Chairperson** only approves requests from THEIR OWN department

## Changes Made

### 1. Database Migration
- **File**: `backend/database/migrations/2026_03_11_000005_add_department_to_event_requests.php`
- Added `department` column to `event_requests` table
- Migration executed successfully

### 2. Backend Updates

#### EventController.php
- Updated `createEventRequest()` method to store requester's department when creating event request
- Added `'department' => $user->department` to EventRequest creation

#### EventRequestController.php
- **index()**: Modified to filter requests based on role:
  - Faculty/Staff: See their own requests
  - Dean: See ALL requests (no department filter)
  - Chairperson: See ONLY requests from their department
  - Admin: See ALL requests
- **approve()**: Added department validation for Chairperson
  - Chairperson can only approve requests from their department
  - Returns 403 error if department doesn't match
- **decline()**: Added department validation for Chairperson
  - Chairperson can only decline requests from their department
  - Returns 403 error if department doesn't match
- **revert()**: Added department validation for Chairperson
  - Chairperson can only revert requests from their department
  - Returns 403 error if department doesn't match

#### EventRequest.php (Model)
- Added `'department'` to `$fillable` array

### 3. Frontend Updates

#### EventRequests.jsx
- Added department display in request details
- Shows department icon and name next to requester information
- Department is displayed for both Faculty/Staff and Dean/Chairperson views

## How It Works

### Example Workflow:
1. **DAFE Faculty Member** submits an event request
   - Request is stored with `department = 'DAFE'`
   
2. **Dean** sees the request
   - Can approve/decline (sees ALL requests from all departments)
   
3. **DAFE Chairperson** sees the request
   - Can approve/decline (only sees DAFE requests)
   
4. **DCEEE Chairperson** does NOT see the request
   - Filtered out because department doesn't match

### Approval Requirements:
- Faculty/Staff event requests require BOTH:
  - Dean approval (from any department)
  - Chairperson approval (from SAME department as requester)

## Testing Recommendations

1. Create event requests from Faculty/Staff in different departments (DAFE, DCEEE, DCEA, DIET, DIT)
2. Login as Dean - verify you see ALL requests
3. Login as DAFE Chairperson - verify you only see DAFE requests
4. Login as DCEEE Chairperson - verify you only see DCEEE requests
5. Test approve/decline/revert actions with department validation

## Files Modified
- `backend/database/migrations/2026_03_11_000005_add_department_to_event_requests.php` (created & run)
- `backend/app/Http/Controllers/EventController.php`
- `backend/app/Http/Controllers/EventRequestController.php`
- `backend/app/Models/EventRequest.php`
- `frontend/src/pages/EventRequests.jsx`

## Date
March 11, 2026
