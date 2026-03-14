# Backend Authentication Upgrade Guide

## What Changed?

Your authentication system has been significantly improved with better security, cleaner code, and enhanced maintainability.

## New Files Created

### Form Request Classes
- `backend/app/Http/Requests/RegisterRequest.php` - Registration validation
- `backend/app/Http/Requests/LoginRequest.php` - Login validation  
- `backend/app/Http/Requests/ForgotPasswordRequest.php` - Password reset request validation
- `backend/app/Http/Requests/ResetPasswordRequest.php` - Password reset validation

### Service Classes
- `backend/app/Services/AuthService.php` - Authentication business logic

## Modified Files

### Controllers
- `backend/app/Http/Controllers/AuthController.php` - Refactored to use new services and requests

### Middleware
- `backend/app/Http/Middleware/ThrottleLoginAttempts.php` - Simplified to use AuthService

## Key Improvements

### 1. Stronger Password Requirements
**Before:** Minimum 6 characters
**After:** Minimum 8 characters with:
- Uppercase letters
- Lowercase letters
- Numbers
- Symbols
- Check against compromised passwords

### 2. Better Code Organization
- Validation logic moved to Form Request classes
- Business logic moved to AuthService
- Controllers are now thin and focused
- Reusable components

### 3. Enhanced Security
- Progressive account lockout
- Detailed security logging
- Input sanitization
- Protection against user enumeration

### 4. Improved Error Handling
- Consistent error responses
- Better user feedback
- Security-conscious messages

## Testing Your Changes

### 1. Test Registration
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "email": "main.test.user@cvsu.edu.ph",
    "password": "SecureP@ss123",
    "password_confirmation": "SecureP@ss123",
    "department": "Computer Science"
  }'
```

### 2. Test Login
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "main.test.user@cvsu.edu.ph",
    "password": "SecureP@ss123"
  }'
```

### 3. Test Rate Limiting
Try logging in with wrong password 3 times:
```bash
# Attempt 1
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "main.test.user@cvsu.edu.ph",
    "password": "WrongPassword"
  }'

# Attempt 2
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "main.test.user@cvsu.edu.ph",
    "password": "WrongPassword"
  }'

# Attempt 3 - Should trigger lockout
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "main.test.user@cvsu.edu.ph",
    "password": "WrongPassword"
  }'
```

### 4. Test OTP Flow
```bash
# Request OTP
curl -X POST http://localhost:8000/api/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "main.test.user@cvsu.edu.ph"
  }'

# Verify OTP (use OTP from email)
curl -X POST http://localhost:8000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "main.test.user@cvsu.edu.ph",
    "otp": "123456"
  }'

# Reset Password (use reset_token from verify response)
curl -X POST http://localhost:8000/api/reset-password-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "main.test.user@cvsu.edu.ph",
    "reset_token": "abc123...",
    "password": "NewSecureP@ss456",
    "password_confirmation": "NewSecureP@ss456"
  }'
```

## Breaking Changes

### Password Requirements
Existing users with weak passwords (less than 8 characters or missing required character types) will need to reset their passwords.

**Action Required:**
- Notify users about new password requirements
- Consider adding a password strength indicator in frontend
- Update frontend validation to match backend rules

### Removed Endpoints
- `POST /api/reset-password` (legacy token-based reset) - Use OTP flow instead

## Frontend Updates Needed

### 1. Update Registration Form
Add password strength indicator and show requirements:
```javascript
// Password requirements
const passwordRequirements = [
  'At least 8 characters',
  'One uppercase letter',
  'One lowercase letter', 
  'One number',
  'One special character'
];
```

### 2. Update Login Error Handling
Handle new error responses:
```javascript
// Handle lockout
if (error.response?.status === 429) {
  const { remaining_seconds } = error.response.data;
  showError(`Account locked. Try again in ${Math.ceil(remaining_seconds / 60)} minutes`);
}

// Handle failed attempts
if (error.response?.data?.errors?.email) {
  showError(error.response.data.errors.email[0]);
}
```

### 3. Update Password Reset Flow
Ensure frontend uses OTP flow:
1. Request OTP → `/api/request-otp`
2. Verify OTP → `/api/verify-otp`
3. Reset Password → `/api/reset-password-otp`

## Monitoring & Logs

### Security Events to Monitor
Check `storage/logs/laravel.log` for:
- Failed login attempts
- Account lockouts
- Successful logins
- Registration events
- Password resets

### Example Log Entries
```
[2026-02-19 10:30:15] local.WARNING: Failed login attempt {"email":"main.test.user@cvsu.edu.ph","user_id":1,"ip":"127.0.0.1","attempts":1}

[2026-02-19 10:30:45] local.WARNING: Account locked due to failed attempts {"email":"main.test.user@cvsu.edu.ph","user_id":1,"lockout_minutes":3}

[2026-02-19 10:35:20] local.INFO: Successful login {"user_id":1,"email":"main.test.user@cvsu.edu.ph","ip":"127.0.0.1"}
```

## Rollback Plan

If you need to rollback:

1. Restore original `AuthController.php` from git:
```bash
cd backend
git checkout HEAD -- app/Http/Controllers/AuthController.php
git checkout HEAD -- app/Http/Middleware/ThrottleLoginAttempts.php
```

2. Remove new files:
```bash
rm app/Http/Requests/RegisterRequest.php
rm app/Http/Requests/LoginRequest.php
rm app/Http/Requests/ForgotPasswordRequest.php
rm app/Http/Requests/ResetPasswordRequest.php
rm app/Services/AuthService.php
```

## Support

For issues or questions:
1. Check logs in `storage/logs/laravel.log`
2. Review `BACKEND_AUTH_IMPROVEMENTS.md` for detailed documentation
3. Test endpoints using the examples above

## Next Steps

1. ✅ Test all authentication endpoints
2. ✅ Update frontend validation rules
3. ✅ Add password strength indicator
4. ✅ Update error handling in frontend
5. ✅ Notify users about new password requirements
6. ✅ Monitor logs for security events
7. ✅ Consider adding 2FA in future
