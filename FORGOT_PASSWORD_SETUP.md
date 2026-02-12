# Forgot Password & Remember Me Setup Guide

## Frontend Changes ✅

### 1. Login Page (`frontend/src/pages/Login.jsx`)
- Added "Remember me" checkbox that saves email to localStorage
- Added "Forgot password?" link
- Email is auto-populated on return visits if "Remember me" was checked

### 2. New Pages Created
- **ForgotPassword.jsx** - Form to request password reset link
- **ResetPassword.jsx** - Form to set new password with token validation

### 3. Routes Updated (`frontend/src/App.jsx`)
- `/forgot-password` - Forgot password page
- `/reset-password` - Reset password page (with token and email query params)

### 4. Auth Context Updated (`frontend/src/context/AuthContext.jsx`)
- Added `forgotPassword()` method
- Added `resetPassword()` method

---

## Backend Setup Required

### 1. Configure Mail (`.env`)
Update your `.env` file with email configuration:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@eventmanagement.com
MAIL_FROM_NAME="Event Management System"
```

**Note:** You can use:
- **Mailtrap** (free testing): https://mailtrap.io
- **Gmail**: Enable "Less secure app access" or use App Passwords
- **SendGrid**: Get API key from SendGrid
- **Local**: Use `MAIL_DRIVER=log` for development

### 2. Create Password Reset Notification (if not exists)
Run this command in the `backend` directory:
```bash
php artisan make:notification ResetPasswordNotification
```

Then update `app/Models/User.php` to use custom notification:
```php
use Illuminate\Auth\Notifications\ResetPassword;

public function sendPasswordResetNotification($token)
{
    $this->notify(new ResetPassword($token));
}
```

### 3. Update User Model (`backend/app/Models/User.php`)
Ensure the User model has the `Notifiable` trait:
```php
use Illuminate\Notifications\Notifiable;

class User extends Model
{
    use Notifiable;
    // ... rest of model
}
```

### 4. Backend Routes ✅
Already added to `backend/routes/api.php`:
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token

### 5. Backend Controller ✅
Already added to `backend/app/Http/Controllers/AuthController.php`:
- `forgotPassword()` method
- `resetPassword()` method

---

## How It Works

### Remember Me Flow
1. User checks "Remember me" on login
2. Email is saved to browser's localStorage
3. On next visit, email field is pre-filled
4. Unchecking removes the saved email

### Forgot Password Flow
1. User clicks "Forgot password?" link
2. Enters email address
3. Backend sends reset link via email with token
4. User clicks link in email (format: `https://yourapp.com/reset-password?token=xxx&email=user@cvsu.edu.ph`)
5. User enters new password
6. Backend validates token and updates password

---

## Testing

### Frontend Testing
1. Go to login page
2. Check "Remember me" and login
3. Logout and return to login - email should be pre-filled
4. Click "Forgot password?" link
5. Enter email and submit
6. Check email for reset link (in Mailtrap inbox if using test service)

### Backend Testing
```bash
# In backend directory
php artisan tinker

# Create test user
$user = User::create([
    'name' => 'Test User',
    'email' => 'main.test.user@cvsu.edu.ph',
    'password' => Hash::make('password123'),
    'department' => 'IT'
]);

# Test forgot password endpoint
$response = Http::post('http://localhost:8000/api/forgot-password', [
    'email' => 'main.test.user@cvsu.edu.ph'
]);
```

---

## Environment Variables Checklist

- [ ] `MAIL_MAILER` configured
- [ ] `MAIL_HOST` set
- [ ] `MAIL_PORT` set
- [ ] `MAIL_USERNAME` set
- [ ] `MAIL_PASSWORD` set
- [ ] `MAIL_FROM_ADDRESS` set
- [ ] `APP_URL` set correctly (for reset links)

---

## Troubleshooting

**Issue:** "Unable to send reset link"
- Check mail configuration in `.env`
- Verify email service credentials
- Check Laravel logs: `backend/storage/logs/laravel.log`

**Issue:** Reset link not working
- Ensure `APP_URL` in `.env` matches your frontend URL
- Check token expiration (default 60 minutes)
- Verify email and token match in reset request

**Issue:** Email not received
- Check spam/junk folder
- Verify `MAIL_FROM_ADDRESS` is valid
- Test with Mailtrap first (easier debugging)

