# Academic Calendar - Admin Only Access

## Changes Made

The academic calendar (default events) feature has been restricted to Admin users only.

### Backend Changes

1. **Routes** (`backend/routes/api.php`)
   - Moved `/default-events` routes from public to authenticated routes
   - Added `admin` middleware to both GET and PUT endpoints
   - Only Admin users can now view and edit the academic calendar

2. **Middleware** (`backend/app/Http/Middleware/EnsureUserIsAdmin.php`)
   - Fixed role check to use 'Admin' (capital A) instead of 'admin'
   - Returns 403 Forbidden for non-admin users

### Frontend Changes

1. **Route Protection** (`frontend/src/App.jsx`)
   - Changed from `ProtectedRoute` to `RoleProtectedRoute` with `allowedRoles={['Admin']}`
   - Non-admin users will be redirected to dashboard if they try to access `/default-events`

2. **Navigation** (`frontend/src/pages/Dashboard.jsx`)
   - Academic Calendar button now only visible to Admin users
   - Added conditional rendering: `{user?.role === 'Admin' && ...}`

3. **Component Guard** (`frontend/src/pages/DefaultEvents.jsx`)
   - Added useEffect hook to redirect non-admin users to dashboard
   - Extra safety layer in case route protection is bypassed

## Testing

To test the changes:

1. **As Admin:**
   - Login with admin account
   - You should see the "Academic Calendar" button on the dashboard
   - You can access `/default-events` and edit dates

2. **As Non-Admin (Dean, Chairperson, Coordinator, Faculty Member):**
   - Login with non-admin account
   - The "Academic Calendar" button should NOT appear on the dashboard
   - Attempting to access `/default-events` directly will redirect to dashboard
   - API calls to `/default-events` will return 403 Forbidden

## API Endpoints

- `GET /api/default-events` - Admin only
- `PUT /api/default-events/{id}/date` - Admin only

Both endpoints require:
- Valid authentication token (Sanctum)
- User role must be 'Admin'
