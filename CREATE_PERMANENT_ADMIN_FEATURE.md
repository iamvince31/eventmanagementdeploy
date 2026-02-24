# Create Permanent Admin Feature

## Overview

This feature allows the **bootstrap admin** to create a permanent admin account directly from the Admin Panel without going through the registration page.

## How It Works

### 1. Bootstrap Admin Login
- Login with bootstrap credentials from `.env`:
  - Email: `admin@cvsu.edu.ph`
  - Password: `SetupAdmin2024!`

### 2. Admin Panel Access
When logged in as bootstrap admin, you'll see:
- **Purple "Create Permanent Admin" button** in the top-right of the User Management header
- **Warning banner** indicating you're using a temporary bootstrap account

### 3. Create Permanent Admin
Click the "Create Permanent Admin" button to open a modal with:
- Full Name field
- Email field (must be @cvsu.edu.ph)
- Department field
- Password field (minimum 8 characters)
- Confirm Password field

### 4. Automatic Cleanup
Once you create a permanent admin:
- ✅ New admin account is created with `is_bootstrap = false`
- ✅ Bootstrap admin is automatically deleted
- ✅ All bootstrap admin tokens are revoked
- ✅ You're redirected to login page
- ✅ Login with your new permanent admin credentials

## Features

### Security
- ✅ Only bootstrap admin can see the button
- ✅ Only bootstrap admin can access the endpoint
- ✅ Email validation (@cvsu.edu.ph required)
- ✅ Password confirmation required
- ✅ Automatic bootstrap admin removal
- ✅ Token revocation on cleanup

### User Experience
- ✅ Clear visual indicators (purple button, warning banner)
- ✅ Modal form with validation
- ✅ Success/error messages
- ✅ Automatic redirect after creation
- ✅ Loading states

### Audit Trail
- ✅ Logs when permanent admin is created
- ✅ Logs which bootstrap admin created it
- ✅ Logs when bootstrap admin is removed

## Files Created/Modified

### Backend
1. **Controller**: `backend/app/Http/Controllers/SetupAdminController.php`
   - `createPermanentAdmin()` - Creates permanent admin
   - `checkBootstrapStatus()` - Checks if user is bootstrap admin

2. **Routes**: `backend/routes/api.php`
   - `GET /api/setup/check-bootstrap` - Check bootstrap status
   - `POST /api/setup/create-admin` - Create permanent admin

### Frontend
1. **Component**: `frontend/src/components/CreatePermanentAdminModal.jsx`
   - Modal form for creating permanent admin
   - Validation and error handling
   - Success message and redirect

2. **Page**: `frontend/src/pages/Admin.jsx`
   - Added bootstrap admin check
   - Added "Create Permanent Admin" button
   - Added warning banner
   - Integrated modal component

## API Endpoints

### Check Bootstrap Status
```http
GET /api/setup/check-bootstrap
Authorization: Bearer {token}
```

**Response:**
```json
{
  "is_bootstrap": true
}
```

### Create Permanent Admin
```http
POST /api/setup/create-admin
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@cvsu.edu.ph",
  "password": "SecurePassword123",
  "password_confirmation": "SecurePassword123",
  "department": "Computer Engineering"
}
```

**Success Response (201):**
```json
{
  "message": "Permanent admin account created successfully! Bootstrap admin will be removed automatically.",
  "admin": {
    "id": 2,
    "name": "John Doe",
    "email": "john.doe@cvsu.edu.ph",
    "department": "Computer Engineering",
    "role": "admin"
  }
}
```

**Error Response (403):**
```json
{
  "message": "Unauthorized. Only bootstrap admin can create permanent admins."
}
```

**Validation Error (422):**
```json
{
  "message": "The email has already been taken.",
  "errors": {
    "email": ["The email has already been taken."]
  }
}
```

## Usage Flow

### Step 1: Login as Bootstrap Admin
```
Email: admin@cvsu.edu.ph
Password: SetupAdmin2024!
```

### Step 2: Navigate to Admin Panel
- You'll see the purple "Create Permanent Admin" button
- You'll see a warning banner about being a bootstrap admin

### Step 3: Click "Create Permanent Admin"
- Modal opens with form fields

### Step 4: Fill in Details
```
Name: John Doe
Email: john.doe@cvsu.edu.ph
Department: Computer Engineering
Password: YourSecurePassword123
Confirm Password: YourSecurePassword123
```

### Step 5: Submit
- Click "Create Admin" button
- Success message appears
- Automatic redirect to login after 2 seconds

### Step 6: Login with New Admin
```
Email: john.doe@cvsu.edu.ph
Password: YourSecurePassword123
```

## Visual Indicators

### Bootstrap Admin Button
- **Color**: Purple gradient (from-purple-600 to-purple-700)
- **Icon**: User with plus sign
- **Text**: "Create Permanent Admin"
- **Position**: Top-right of User Management header
- **Hover Effect**: Scale up, darker gradient, enhanced shadow

### Warning Banner
- **Color**: Purple gradient background (from-purple-50 to-purple-100)
- **Border**: Left border (purple-500)
- **Icon**: Information circle
- **Title**: "Bootstrap Admin Account"
- **Message**: Explains temporary nature and next steps

### Modal
- **Header**: Green gradient (matches system theme)
- **Warning Box**: Yellow background with warning icon
- **Form Fields**: Standard input styling with green focus rings
- **Buttons**: Cancel (gray) and Create Admin (green)

## Security Considerations

### Authorization
- Only users with `is_bootstrap = true` can create permanent admins
- Endpoint checks user's bootstrap status before proceeding
- Returns 403 Forbidden if not bootstrap admin

### Validation
- Email must be unique
- Email must match @cvsu.edu.ph pattern
- Password must be at least 8 characters
- Password confirmation must match
- All fields are required

### Automatic Cleanup
- UserObserver detects new admin creation
- Finds all bootstrap admins
- Revokes their tokens
- Deletes bootstrap admin accounts
- Logs all actions

### No Backdoor
- Bootstrap admin is permanently deleted
- Cannot be recreated (admin already exists)
- Seeder skips if admin exists
- No way to restore bootstrap admin

## Testing

### Test 1: Bootstrap Admin Can See Button
```bash
# Login as bootstrap admin
# Navigate to /admin
# Verify purple button is visible
# Verify warning banner is visible
```

### Test 2: Regular Admin Cannot See Button
```bash
# Create a regular admin
# Login as regular admin
# Navigate to /admin
# Verify button is NOT visible
# Verify warning banner is NOT visible
```

### Test 3: Create Permanent Admin
```bash
# Login as bootstrap admin
# Click "Create Permanent Admin"
# Fill in form with valid data
# Submit
# Verify success message
# Verify redirect to login
# Verify bootstrap admin is deleted
```

### Test 4: Validation Errors
```bash
# Try with existing email -> Error
# Try with non-@cvsu.edu.ph email -> Error
# Try with mismatched passwords -> Error
# Try with short password -> Error
```

### Test 5: Unauthorized Access
```bash
# Login as regular user
# Try to POST /api/setup/create-admin
# Verify 403 Forbidden response
```

## Troubleshooting

### Issue: Button not showing
**Solution**: Check if user is bootstrap admin:
```bash
php artisan tinker
>>> User::where('is_bootstrap', true)->get()
```

### Issue: "Unauthorized" error
**Solution**: Verify you're logged in as bootstrap admin:
```bash
# Check user in browser console
console.log(localStorage.getItem('user'))
```

### Issue: Bootstrap admin not deleted
**Solution**: Check if UserObserver is registered:
```php
// app/Providers/AppServiceProvider.php
User::observe(UserObserver::class);
```

### Issue: Email validation failing
**Solution**: Ensure email ends with @cvsu.edu.ph:
```
✅ admin@cvsu.edu.ph
✅ john.doe@cvsu.edu.ph
❌ admin@gmail.com
❌ admin@cvsu.com
```

## Advantages Over Registration Page

### 1. Streamlined Setup
- No need to navigate to registration page
- No need to verify email
- No need to manually change role in database

### 2. Pre-Verified
- Admin created with `email_verified_at` set
- Admin created with `schedule_initialized = true`
- Ready to use immediately

### 3. Secure
- Only bootstrap admin can create
- Automatic cleanup after creation
- No manual intervention needed

### 4. User-Friendly
- Clear visual indicators
- Guided process with warnings
- Automatic redirect after creation

### 5. Audit Trail
- Logs who created the admin
- Logs when bootstrap was removed
- Full accountability

## Conclusion

This feature provides a secure, user-friendly way for bootstrap admins to create permanent admin accounts without leaving the Admin Panel. The automatic cleanup ensures no backdoors remain in the system.
