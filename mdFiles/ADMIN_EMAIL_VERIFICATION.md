# Admin Email Verification

## Overview

When creating permanent admin accounts through the bootstrap admin, the new admins must verify their email addresses before they can login.

## How It Works

### Step 1: Bootstrap Admin Creates New Admin
1. Login as bootstrap admin
2. Click "Create Permanent Admin"
3. Fill in the form with the new admin's details
4. Submit

### Step 2: Verification Email Sent
- ✅ Admin account created (unverified)
- ✅ 6-digit OTP generated
- ✅ Email sent to new admin's address
- ✅ OTP expires in 10 minutes

### Step 3: New Admin Verifies Email
1. New admin receives email with 6-digit code
2. New admin goes to login page
3. Enters email and password
4. System detects unverified email
5. Redirected to email verification page
6. Enters 6-digit code
7. Email verified ✅

### Step 4: New Admin Can Login
- Email is now verified
- Can login normally
- Full admin access granted

## Email Content

The new admin receives an email with:
- **Subject**: "Verify Your Admin Account"
- **6-digit OTP code**
- **Expiration time**: 10 minutes
- **Instructions**: How to verify

## Verification Flow

```
Bootstrap Admin Creates Admin
         ↓
Admin Account Created (unverified)
         ↓
Verification Email Sent
         ↓
New Admin Receives Email
         ↓
New Admin Tries to Login
         ↓
System: "Please verify your email"
         ↓
Redirected to Verification Page
         ↓
Enters 6-digit Code
         ↓
Email Verified ✅
         ↓
Can Login Successfully
```

## Success Messages

### After Creating 1st Admin
```
✅ Permanent admin account created successfully!
📧 Verification email sent.
You can create 1 more admin before bootstrap is removed.

A verification code has been sent to the admin's email address.
The new admin must verify their email before they can login.
```

### After Creating 2nd Admin
```
✅ Permanent admin account created successfully!
📧 Verification email sent.
You now have 2 admins. Bootstrap admin will be removed automatically.

A verification code has been sent to the admin's email address.
The new admin must verify their email before they can login.
```

## Security Features

### 1. Email Validation
- Checks if email exists in CVSU system
- Only @cvsu.edu.ph emails allowed
- Email must be unique

### 2. OTP Security
- 6-digit random code
- Expires in 10 minutes
- One-time use only
- Stored securely in database

### 3. Verification Required
- Cannot login without verification
- System blocks unverified logins
- Clear error message shown

### 4. Audit Logging
```php
Log::info('Permanent admin created by bootstrap admin', [
    'new_admin_id' => $admin->id,
    'new_admin_email' => $admin->email,
    'created_by_bootstrap_id' => $currentUser->id,
    'email_sent' => $emailSent,
]);
```

## Testing

### Test 1: Create Admin and Verify
```bash
1. Login as bootstrap admin
2. Create new admin (admin1@cvsu.edu.ph)
3. Check email for verification code
4. Try to login → redirected to verification
5. Enter code → email verified
6. Login successfully
```

### Test 2: Try Login Without Verification
```bash
1. Create new admin
2. Try to login immediately
3. System shows: "Please verify your email address"
4. Redirected to verification page
```

### Test 3: Expired OTP
```bash
1. Create new admin
2. Wait 11 minutes
3. Try to verify with OTP
4. System shows: "Invalid or expired OTP"
5. Request new OTP
```

### Test 4: Check Database
```bash
php artisan tinker

# Check unverified admin
>>> User::where('email', 'admin1@cvsu.edu.ph')->first()->email_verified_at
=> null

# After verification
>>> User::where('email', 'admin1@cvsu.edu.ph')->first()->email_verified_at
=> "2026-02-24 10:30:00"
```

## Resend Verification Code

If the new admin doesn't receive the email or the code expires:

1. Go to login page
2. Enter email and password
3. System detects unverified email
4. Redirected to verification page
5. Click "Resend Code"
6. New OTP sent

## Email Configuration

Ensure Brevo SMTP is configured in `.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=your_brevo_username
MAIL_PASSWORD=your_brevo_smtp_key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@cvsu.edu.ph"
MAIL_FROM_NAME="CVSU Event Management"
```

## Troubleshooting

### Issue: Email not received
**Check:**
1. Brevo SMTP credentials in `.env`
2. Email address is valid @cvsu.edu.ph
3. Check spam folder
4. Check Brevo dashboard for delivery status

**Solution:**
```bash
# Check logs
tail -f backend/storage/logs/laravel.log

# Look for:
"Failed to send verification email to new admin"
```

### Issue: OTP expired
**Solution:**
1. Go to verification page
2. Click "Resend Code"
3. New OTP sent (valid for 10 minutes)

### Issue: Invalid OTP
**Check:**
1. Entered all 6 digits correctly
2. No spaces before/after code
3. Code hasn't expired
4. Using the most recent code (if resent)

### Issue: Admin created but no email sent
**Check logs:**
```bash
php artisan tinker
>>> DB::table('email_verification_otps')->where('email', 'admin1@cvsu.edu.ph')->first()
```

**Manual verification (for testing only):**
```bash
php artisan tinker
>>> $user = User::where('email', 'admin1@cvsu.edu.ph')->first();
>>> $user->email_verified_at = now();
>>> $user->save();
```

## API Response

### Success Response
```json
{
  "message": "Permanent admin account created successfully! Verification email sent.",
  "admin": {
    "id": 61,
    "name": "Admin One",
    "email": "admin1@cvsu.edu.ph",
    "department": "Administration",
    "role": "admin"
  },
  "permanent_admin_count": 1,
  "bootstrap_removed": false,
  "requires_verification": true
}
```

### Email Validation Error
```json
{
  "message": "This email address is not registered in the CVSU system."
}
```

## Benefits

### 1. Security
- Ensures email ownership
- Prevents unauthorized admin creation
- Verifies CVSU affiliation

### 2. Accountability
- Admins must use their real email
- Email verification creates audit trail
- Can contact admins if needed

### 3. Best Practice
- Standard security measure
- Prevents typos in email addresses
- Ensures admins can receive notifications

## Summary

✅ New admins must verify email before login
✅ 6-digit OTP sent via Brevo SMTP
✅ OTP expires in 10 minutes
✅ Can resend if needed
✅ Clear error messages
✅ Full audit logging
✅ Secure and user-friendly

This ensures all permanent admin accounts are properly verified and belong to real CVSU email addresses!
