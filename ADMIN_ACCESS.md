# Admin Access Control

## Overview
The admin dashboard is now restricted to users with the `admin` role only.

## Access Control Implementation

### Frontend Protection
1. **AdminRoute Component** - Custom route wrapper that:
   - Checks if user is logged in
   - Verifies user has `admin` role
   - Redirects non-admin users to `/dashboard`
   - Redirects non-logged-in users to `/login`

2. **Admin Page Check** - Additional check in the Admin component:
   - Redirects non-admin users immediately on page load
   - Prevents unauthorized access even if route is bypassed

3. **Conditional UI** - Admin Panel link only visible to admin users:
   - Shows in account dropdown menu
   - Only appears when `user.role === 'admin'`

### Backend Protection
1. **Admin Middleware** (`EnsureUserIsAdmin`):
   - Validates user is authenticated
   - Checks if user role is `admin`
   - Returns 403 Forbidden for non-admin users

2. **Protected Routes**:
   - `/api/users/all` - Get all users (including admins)
   - Protected by `admin` middleware

3. **Public Routes**:
   - `/api/users` - Get non-admin users only (for event invitations)
   - Available to all authenticated users

## How It Works

### For Admin Users:
1. Login with admin credentials
2. See "Admin Panel" option in account dropdown
3. Click to access `/admin` route
4. View all users in the system
5. Backend allows access to `/api/users/all`

### For Non-Admin Users:
1. Login with regular credentials
2. No "Admin Panel" option in dropdown
3. If they try to access `/admin` directly:
   - Frontend redirects to `/dashboard`
4. If they try to access `/api/users/all`:
   - Backend returns 403 Forbidden error

## Testing

### Test Admin Access:
```
Email: admin@example.com
Password: admin123
```
- Should see "Admin Panel" in dropdown
- Can access `/admin` page
- Can view all users

### Test Non-Admin Access:
```
Email: teacher@example.com
Password: teacher123
```
- Should NOT see "Admin Panel" in dropdown
- Redirected to `/dashboard` if accessing `/admin`
- Cannot access admin API endpoints

## Security Features

1. **Multi-layer Protection**:
   - Frontend route guard
   - Frontend component check
   - Backend middleware validation

2. **Role-based Access**:
   - Only `admin` role has access
   - Other roles (dean, chairperson, program_coordinator, teacher) are blocked

3. **API Protection**:
   - Admin endpoints require authentication + admin role
   - Returns proper HTTP status codes (403 Forbidden)

4. **User Separation**:
   - Admin users excluded from member lists
   - Cannot be invited to events
   - Separate user management interface

## Files Modified

### Frontend:
- `frontend/src/App.jsx` - Added AdminRoute component
- `frontend/src/pages/Admin.jsx` - Added role check
- `frontend/src/pages/Dashboard.jsx` - Added conditional Admin Panel link

### Backend:
- `backend/app/Http/Middleware/EnsureUserIsAdmin.php` - New middleware
- `backend/bootstrap/app.php` - Registered middleware alias
- `backend/routes/api.php` - Protected admin routes
- `backend/app/Http/Controllers/UserController.php` - Separate endpoints for admin/users

## Future Enhancements

Potential additions for role-based access:
- Dean dashboard with department-level access
- Chairperson dashboard with program-level access
- Program Coordinator dashboard with course-level access
- Hierarchical permissions system
