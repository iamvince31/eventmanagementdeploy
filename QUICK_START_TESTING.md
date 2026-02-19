# Quick Start Testing Guide

## 🚀 Start the Application

### 1. Start Backend (Laravel)
```bash
cd backend
php artisan serve
```
Backend will run at: `http://localhost:8000`

### 2. Start Frontend (React)
```bash
cd frontend
npm run dev
```
Frontend will run at: `http://localhost:5173`

## 🧪 Test Scenarios

### Scenario 1: Test Email Verification
**URL**: `http://localhost:5173/register`

**Steps**:
1. Enter username: `Test User`
2. Enter email: `main.john.doe@cvsu.edu.ph`
3. Click "Verify" button
4. Observe the result

**Expected Results**:
- ✅ **Success**: Green checkmark, "Email verified successfully"
- ❌ **Failure**: Error message about email not existing
- ⚠️ **Service Down**: Warning but allows registration

**Common Issues**:
- SMTP port 25 blocked by ISP/firewall
- Google blocking verification attempts
- Timeout errors

### Scenario 2: Complete Registration (Without 2FA)
**URL**: `http://localhost:5173/register`

**Steps**:
1. Fill in all fields:
   - Username: `Test User`
   - Email: `main.test.user@cvsu.edu.ph`
   - Department: Select any
   - Password: `password123`
   - Confirm Password: `password123`
2. Click "Verify" email (if working)
3. Click "Create Account"
4. On success screen, click "Continue to Login"
5. Login with the same credentials

**Expected Results**:
- Account created in Supabase
- Redirected to login page
- Can login successfully
- Redirected to dashboard

### Scenario 3: Complete Registration (With 2FA)
**URL**: `http://localhost:5173/register`

**Steps**:
1. Complete registration (steps 1-3 from Scenario 2)
2. On success screen, click "Setup 2FA (Recommended)"
3. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
4. Enter 6-digit code from app
5. Click "Verify & Enable"
6. Login with credentials
7. Enter 2FA code when prompted

**Expected Results**:
- QR code displayed
- 2FA enabled after verification
- Login requires 2FA code
- Dashboard accessible after 2FA

### Scenario 4: Login Without 2FA
**URL**: `http://localhost:5173/login`

**Steps**:
1. Enter email: `main.test.user@cvsu.edu.ph`
2. Enter password: `password123`
3. Click "Sign in"

**Expected Results**:
- Immediate redirect to dashboard
- No 2FA prompt

### Scenario 5: Login With 2FA
**URL**: `http://localhost:5173/login`

**Steps**:
1. Enter email (account with 2FA enabled)
2. Enter password
3. Click "Sign in"
4. Enter 6-digit code from authenticator app
5. Click "Verify"

**Expected Results**:
- 2FA code screen appears
- After verification, redirect to dashboard

## 🔍 Debugging

### Check Backend Logs
```bash
cd backend
tail -f storage/logs/laravel.log
```

### Check Frontend Console
Open browser DevTools (F12) → Console tab

### Check Supabase Dashboard
1. Go to: `https://supabase.com/dashboard`
2. Select your project
3. Go to Authentication → Users
4. Verify users are being created

### Common Errors

#### Email Verification Fails
**Error**: "Unable to verify email"
**Solution**: See "Email Verification Workaround" below

#### Supabase Connection Error
**Error**: "Failed to connect to Supabase"
**Check**:
- Frontend `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Backend `.env` has correct Supabase credentials
- Internet connection is working

#### 2FA QR Code Not Showing
**Error**: Blank QR code or error
**Check**:
- Supabase 2FA is enabled in dashboard
- User is authenticated before enrolling MFA

#### Login Fails After Registration
**Error**: "Invalid credentials"
**Check**:
- User exists in Supabase Dashboard
- Password is correct (minimum 6 characters)
- Email format is correct

## ⚠️ Email Verification Workaround

If email verification is not working (SMTP issues), you have two options:

### Option A: Disable Email Verification (Quick Fix)
This allows registration without verifying email exists.

**File**: `frontend/src/pages/RegisterUnified.jsx`

**Change**:
```javascript
// Find this line in handleRegister function:
if (!emailVerified) {
  setError('Please verify your CVSU email address first');
  return;
}

// Comment it out or remove it:
// if (!emailVerified) {
//   setError('Please verify your CVSU email address first');
//   return;
// }
```

**Also hide the Verify button**:
```javascript
// Find the Verify button and hide it:
<button
  type="button"
  onClick={handleEmailVerification}
  disabled={verifyingEmail || emailVerified || !email}
  className="hidden" // Add this class
  // ... rest of button code
>
```

### Option B: Use Format Validation Only
Keep the verification button but only validate format, don't check if email exists.

**File**: `backend/app/Services/EmailVerificationService.php`

**Change the `verifyCVSUEmail` method**:
```php
public function verifyCVSUEmail($email)
{
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return [
            'valid' => false,
            'message' => 'Invalid email format'
        ];
    }

    // Check if it's a CVSU email
    if (!$this->isCVSUEmail($email)) {
        return [
            'valid' => false,
            'message' => 'Email must be a CVSU email address'
        ];
    }

    // Just return valid if format is correct
    return [
        'valid' => true,
        'message' => 'Email format is valid'
    ];
}
```

## 📊 Test Results Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access registration page
- [ ] Email verification works (or workaround applied)
- [ ] Can complete registration without 2FA
- [ ] Can complete registration with 2FA
- [ ] Can login without 2FA
- [ ] Can login with 2FA
- [ ] Users appear in Supabase Dashboard
- [ ] Dashboard loads after login
- [ ] Can logout successfully

## 🎯 Next Steps After Testing

1. **If everything works**: Document any issues found and proceed with team setup
2. **If email verification fails**: Apply workaround and retest
3. **If Supabase issues**: Check configuration and credentials
4. **If 2FA issues**: Verify Supabase 2FA settings

## 📞 Need Help?

Check these files for more information:
- `CURRENT_STATUS_AND_NEXT_STEPS.md` - Detailed status and issues
- `TEAM_SETUP_GUIDE.md` - Team deployment guide
- `PROJECT_DOCUMENTATION.md` - Complete project documentation
- `SUPABASE_TESTING_GUIDE.md` - Supabase-specific testing

---

**Ready to test!** Start with Scenario 1 and work your way through.
