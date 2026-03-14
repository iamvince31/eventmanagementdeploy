# Backend Authentication Improvements

## Overview
Comprehensive refactoring of the authentication system to improve security, maintainability, and code quality.

## Key Improvements

### 1. Form Request Validation Classes
Created dedicated request validation classes for better separation of concerns:

- `RegisterRequest.php` - Registration validation with strong password rules
- `LoginRequest.php` - Login validation with email format checking
- `ForgotPasswordRequest.php` - Password reset request validation
- `ResetPasswordRequest.php` - Password reset validation

**Benefits:**
- Centralized validation logic
- Automatic input sanitization (email normalization, trimming)
- Reusable validation rules
- Better error messages

### 2. AuthService Class
Created a dedicated service class (`AuthService.php`) to handle:

- User authentication logic
- Rate limiting and lockout management
- Failed login attempt tracking
- User registration
- Response formatting

**Benefits:**
- Single Responsibility Principle
- Testable business logic
- Reusable across controllers
- Cleaner controller code

### 3. Enhanced Security

#### Password Requirements
- Minimum 8 characters (up from 6)
- Must contain uppercase and lowercase letters
- Must contain numbers
- Must contain symbols
- Checks against compromised password database

#### Rate Limiting
- Progressive lockout system:
  - First lockout: 3 minutes
  - Subsequent lockouts: 5 minutes
- Tracks attempts per email/IP combination
- Automatic cleanup on successful login

#### Input Sanitization
- Automatic email normalization (lowercase, trimmed)
- Username trimming
- Validation against malicious input

### 4. Improved Error Handling

- Consistent error responses
- Security-conscious messages (don't reveal if email exists)
- Detailed logging for security events
- Better user feedback

### 5. Code Quality Improvements

- Removed code duplication
- Simplified controller methods
- Better separation of concerns
- Improved type safety
- Consistent coding standards

## Security Features

### Login Protection
1. Email/IP-based rate limiting
2. Progressive lockout duration
3. Detailed security logging
4. Protection against user enumeration

### Password Security
1. Strong password requirements
2. Compromised password checking
3. Secure password hashing (bcrypt)
4. Password confirmation on reset

### Audit Logging
All security events are logged:
- Failed login attempts
- Account lockouts
- Successful logins
- Registration events
- Password resets

## API Endpoints

### POST /api/register
Register a new user account.

**Request:**
```json
{
  "username": "john_doe",
  "email": "main.john.doe@cvsu.edu.ph",
  "password": "SecureP@ss123",
  "password_confirmation": "SecureP@ss123",
  "department": "Computer Science"
}
```

**Response:**
```json
{
  "message": "Registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "main.john.doe@cvsu.edu.ph",
    "department": "Computer Science",
    "schedule_initialized": false,
    "email_verified": false
  },
  "token": "1|abc123..."
}
```

### POST /api/login
Authenticate user and receive token.

**Request:**
```json
{
  "email": "main.john.doe@cvsu.edu.ph",
  "password": "SecureP@ss123"
}
```

**Response:**
```json
{
  "message": "Logged in successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "main.john.doe@cvsu.edu.ph",
    "department": "Computer Science",
    "schedule_initialized": false,
    "email_verified": false
  },
  "token": "2|xyz789..."
}
```

### POST /api/request-otp
Request OTP for password reset.

**Request:**
```json
{
  "email": "main.john.doe@cvsu.edu.ph"
}
```

**Response:**
```json
{
  "message": "If an account exists with this email, an OTP will be sent."
}
```

### POST /api/verify-otp
Verify OTP code.

**Request:**
```json
{
  "email": "main.john.doe@cvsu.edu.ph",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "OTP verified successfully.",
  "reset_token": "abc123xyz..."
}
```

### POST /api/reset-password-otp
Reset password using OTP token.

**Request:**
```json
{
  "email": "main.john.doe@cvsu.edu.ph",
  "reset_token": "abc123xyz...",
  "password": "NewSecureP@ss456",
  "password_confirmation": "NewSecureP@ss456"
}
```

**Response:**
```json
{
  "message": "Password reset successfully. You can now log in with your new password."
}
```

## Error Responses

### Validation Error (422)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["Email must be in format main.(firstname).(lastname)@cvsu.edu.ph"],
    "password": ["The password must contain at least one uppercase letter."]
  }
}
```

### Rate Limit Error (429)
```json
{
  "message": "Too many login attempts. Please try again in 3 minute(s).",
  "locked_until": 1708345200,
  "remaining_seconds": 180
}
```

### Authentication Error (401)
```json
{
  "message": "Invalid password. 2 attempt(s) remaining before lockout."
}
```

## Configuration

### Environment Variables
Ensure these are set in `.env`:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Mail Configuration
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="Event Management System"

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## Testing Recommendations

1. Test password strength validation
2. Test rate limiting (3 failed attempts)
3. Test progressive lockout (multiple lockout cycles)
4. Test email format validation
5. Test OTP flow end-to-end
6. Test concurrent login attempts
7. Test input sanitization

## Migration Notes

### Breaking Changes
- Password minimum length increased from 6 to 8 characters
- Password now requires uppercase, lowercase, numbers, and symbols
- Removed legacy `resetPassword` endpoint (use OTP flow instead)

### Backward Compatibility
- All existing API endpoints remain functional
- Token format unchanged
- Database schema unchanged

## Future Enhancements

1. Add email verification on registration
2. Implement 2FA (Two-Factor Authentication)
3. Add device tracking and management
4. Implement session management
5. Add password history to prevent reuse
6. Add CAPTCHA after multiple failed attempts
7. Implement IP-based geolocation blocking
8. Add webhook notifications for security events

## Maintenance

### Logs Location
Security logs are stored in `storage/logs/laravel.log`

### Cache Keys
- `login_attempts:{hash}` - Failed attempt counter
- `login_lockout:{hash}` - Lockout timestamp
- `login_lockout_count:{hash}` - Number of lockouts

### Cleanup
Cache entries automatically expire:
- Login attempts: 5 minutes
- Lockout: 3-5 minutes
- Lockout count: 1 hour
