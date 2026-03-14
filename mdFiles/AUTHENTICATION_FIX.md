# Authentication Fix - Double Hashing Issue

## Problem Identified

The authentication system had a **double hashing** issue that prevented users from logging in:

1. The `User` model had `'password' => 'hashed'` in the `casts()` method
2. The `AuthController::register()` method was manually hashing passwords with `Hash::make()`
3. This caused passwords to be hashed twice during registration
4. Users couldn't log in because the stored password was double-hashed

## Fix Applied

### 1. Updated User Model
**File:** `backend/app/Models/User.php`

Removed the automatic password hashing from the casts:
```php
protected function casts(): array
{
    return [
        'email_verified_at' => 'datetime',
        // Removed: 'password' => 'hashed',
    ];
}
```

### 2. Password Hashing Now Handled Correctly
- Registration: `Hash::make()` in `AuthController::register()`
- Password Reset: `Hash::make()` in reset methods
- Login: `Hash::check()` for verification

## For Existing Users

If you have existing users who can't log in, run the password fix script:

```bash
cd backend
php fix-double-hashed-passwords.php
```

The script offers three options:
1. Reset all passwords to a temporary password (`TempPass123!`)
2. Set a specific password for a single user (useful for testing)
3. Exit without changes

## Testing the Fix

### For New Registrations:
1. Register a new user
2. Verify email with OTP
3. Login with the password you set during registration
4. Should work immediately

### For Existing Users:
1. Run the fix script to reset passwords
2. Users can either:
   - Use the temporary password if you chose option 1
   - Use "Forgot Password" to set a new password
   - Have admin set their password using option 2

## Verification

To verify the fix is working:
1. Create a new test account
2. Complete email verification
3. Login with the password you set
4. You should be able to access the dashboard

## Additional Notes

- The fix ensures passwords are only hashed once
- All new registrations will work correctly
- Existing users need password reset (one-time fix)
- The authentication flow remains unchanged for users
