# Supabase Email Rate Limit - Solutions

## The Problem

Supabase free tier limits email sending to **3-4 emails per hour** during development.

Error message: `"Email rate limit exceeded"`

---

## ✅ Solution 1: Disable Email Confirmation (Testing Only)

**Best for development/testing:**

### Steps:
1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Click on **Email** provider
5. Find **"Confirm email"** toggle
6. Turn it **OFF**
7. Click **Save**

### What this does:
- Users can login immediately after registration
- No verification email needed
- Perfect for testing

### ⚠️ Important:
**Turn this back ON before going to production!**

---

## ✅ Solution 2: Manually Confirm Users

**For specific test users:**

### Steps:
1. Go to Supabase Dashboard
2. **Authentication** → **Users**
3. Find your test user in the list
4. Click on the user
5. Click **"Confirm email"** button
6. User is now verified!

### What this does:
- Manually verifies the user
- Bypasses email sending
- User can login immediately

---

## ✅ Solution 3: Use Different Email Addresses

**For multiple tests:**

Instead of resending to the same email, use different ones:
- `main.test1.user@cvsu.edu.ph`
- `main.test2.user@cvsu.edu.ph`
- `main.test3.user@cvsu.edu.ph`
- etc.

Each new email counts as a separate send.

---

## ✅ Solution 4: Wait for Rate Limit Reset

**If you hit the limit:**

- Rate limit: 3-4 emails per hour
- Resets: Every hour
- Just wait 60 minutes and try again

---

## ✅ Solution 5: Upgrade Supabase Plan

**For production:**

### Free Tier:
- 3-4 emails/hour
- Good for development
- Not suitable for production

### Pro Plan ($25/month):
- Unlimited emails
- Better rate limits
- Priority support
- More features

### Upgrade:
1. Go to Supabase Dashboard
2. Click **Settings** → **Billing**
3. Choose **Pro Plan**
4. Add payment method

---

## 🎯 Recommended Approach

### For Development (Now):
1. **Disable email confirmation** in Supabase
2. Test registration and login flows
3. Test 2FA setup
4. Everything works without emails!

### Before Production:
1. **Re-enable email confirmation**
2. Test with real emails
3. Consider upgrading to Pro plan
4. Set up custom SMTP (optional)

---

## 🔧 Alternative: Custom SMTP

**For unlimited emails on free tier:**

You can configure Supabase to use your own SMTP server:

### Steps:
1. Get SMTP credentials (Gmail, SendGrid, Mailgun, etc.)
2. Go to Supabase Dashboard
3. **Settings** → **Auth** → **SMTP Settings**
4. Enable custom SMTP
5. Enter your SMTP details:
   - Host: `smtp.gmail.com` (for Gmail)
   - Port: `587`
   - Username: Your email
   - Password: App password
6. Save

### Gmail App Password:
1. Go to Google Account settings
2. Security → 2-Step Verification
3. App passwords
4. Generate new app password
5. Use this in Supabase

---

## 📊 Rate Limits by Plan

| Plan | Email Limit | Cost |
|------|-------------|------|
| Free | 3-4/hour | $0 |
| Pro | Unlimited | $25/month |
| Team | Unlimited | $599/month |
| Enterprise | Unlimited | Custom |

---

## 🧪 Testing Without Emails

### Current Setup:
With email confirmation disabled, your flow becomes:

```
Register → Account Created → Login Immediately
         (no email needed)
```

### With 2FA:
```
Register → Setup 2FA → Scan QR → Verify Code → Login
         (no email needed)
```

### To Test:
1. Disable email confirmation
2. Register new account
3. Login immediately (no verification needed)
4. Test 2FA if you set it up
5. Everything works!

---

## ⚠️ Important Notes

### For Development:
- ✅ Disable email confirmation
- ✅ Test freely without limits
- ✅ Manually confirm users if needed

### For Production:
- ⚠️ Enable email confirmation
- ⚠️ Upgrade to Pro plan
- ⚠️ Or use custom SMTP
- ⚠️ Test with real emails first

---

## 🎯 Quick Fix Right Now

**Do this immediately:**

1. Open Supabase Dashboard
2. Authentication → Providers → Email
3. Turn OFF "Confirm email"
4. Save
5. Try registering again
6. Should work instantly!

---

## 📞 Need Help?

### Check Email Status:
- Supabase Dashboard → Authentication → Logs
- See all email attempts
- Check for errors

### Check User Status:
- Supabase Dashboard → Authentication → Users
- See if user was created
- Check email confirmation status

### Still Having Issues?
- Clear browser cache
- Try incognito mode
- Check console for errors
- Verify Supabase keys in .env

---

**Quick Fix: Disable email confirmation in Supabase Dashboard and test immediately!**
