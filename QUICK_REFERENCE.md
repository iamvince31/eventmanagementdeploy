# Quick Reference Card

## 🚀 Start Commands

```bash
# Backend (Terminal 1)
cd backend
php artisan serve
# Runs at: http://localhost:8000

# Frontend (Terminal 2)
cd frontend
npm run dev
# Runs at: http://localhost:5173
```

## 🔗 Important URLs

| Page | URL | Purpose |
|------|-----|---------|
| Registration | http://localhost:5173/register | Create new account |
| Login | http://localhost:5173/login | Sign in |
| Dashboard | http://localhost:5173/dashboard | Main app |
| Supabase Test | http://localhost:5173/supabase-test | Test Supabase |
| Backend API | http://localhost:8000/api | API endpoint |

## 📧 Email Format

**Required Format**: `main.firstname.lastname@cvsu.edu.ph`

**Examples**:
- ✅ main.john.doe@cvsu.edu.ph
- ✅ main.maria.santos@cvsu.edu.ph
- ❌ john.doe@cvsu.edu.ph (missing "main.")
- ❌ main.john@cvsu.edu.ph (missing last name)

## 🔑 Test Credentials

Create your own test account:
```
Username: Test User
Email: main.test.user@cvsu.edu.ph
Department: Any
Password: password123
```

## 📱 2FA Apps

Compatible authenticator apps:
- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password
- LastPass Authenticator

## 🔍 Quick Checks

### Is Backend Running?
```bash
curl http://localhost:8000/api/auth/supabase/status
```
Should return: `{"configured":true}`

### Is Frontend Running?
Open: http://localhost:5173
Should see: Login or Dashboard page

### Are Users Created?
1. Go to: https://supabase.com/dashboard
2. Select project: kprmqdikdrbmjayxzszk
3. Authentication → Users
4. Check for new users

## 🐛 Quick Fixes

### Backend Won't Start
```bash
cd backend
composer install
php artisan key:generate
php artisan serve
```

### Frontend Won't Start
```bash
cd frontend
npm install
npm run dev
```

### Email Verification Fails
Already fixed! Now uses format validation only.

### Can't Login
1. Check email format is correct
2. Check password is at least 6 characters
3. Check user exists in Supabase Dashboard
4. Check backend is running

### 2FA Not Working
1. Check time on device is synchronized
2. Use current code (changes every 30 seconds)
3. Check Supabase Dashboard → Authentication → Providers
4. Ensure TOTP is enabled

## 📂 Key Files

### Frontend
```
frontend/src/
├── pages/
│   ├── RegisterUnified.jsx    # Registration page
│   ├── LoginUnified.jsx        # Login page
│   └── Dashboard.jsx           # Main dashboard
├── context/
│   └── SupabaseAuthContext.jsx # Auth functions
└── services/
    └── supabase.js             # Supabase client
```

### Backend
```
backend/
├── app/
│   ├── Services/
│   │   ├── EmailVerificationService.php  # Email validation
│   │   └── SupabaseService.php           # Supabase integration
│   └── Http/Controllers/
│       ├── EmailVerificationController.php
│       └── SupabaseAuthController.php
├── routes/
│   └── api.php                 # API routes
└── .env                        # Configuration
```

### Configuration
```
backend/.env                    # Backend config
frontend/.env                   # Frontend config
backend/config/services.php     # Supabase config
```

## 🔧 Environment Variables

### Backend (.env)
```env
SUPABASE_URL=https://kprmqdikdrbmjayxzszk.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://kprmqdikdrbmjayxzszk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=http://localhost:8000/api
```

## 📊 Testing Checklist

Quick checklist for testing:

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access /register page
- [ ] Email verification works (format check)
- [ ] Can create account without 2FA
- [ ] Can create account with 2FA
- [ ] Can login without 2FA
- [ ] Can login with 2FA
- [ ] Users appear in Supabase Dashboard
- [ ] Dashboard loads after login
- [ ] Can logout successfully

## 🎯 Common Tasks

### Create New User
1. Go to /register
2. Fill form with CVSU email
3. Click "Verify" (instant)
4. Click "Create Account"
5. Choose 2FA or skip

### Login
1. Go to /login
2. Enter email + password
3. Enter 2FA code if enabled
4. Access dashboard

### Enable 2FA
1. Register new account
2. On success screen, click "Setup 2FA"
3. Scan QR code with app
4. Enter 6-digit code
5. 2FA enabled

### Check Logs
```bash
# Backend logs
cd backend
tail -f storage/logs/laravel.log

# Frontend console
Open browser DevTools (F12) → Console
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| READY_TO_TEST.md | Main testing guide |
| QUICK_START_TESTING.md | Detailed test scenarios |
| AUTH_FLOW_DIAGRAM.md | Visual flow diagram |
| CURRENT_STATUS_AND_NEXT_STEPS.md | Complete status |
| TEAM_SETUP_GUIDE.md | Deployment guide |
| PROJECT_DOCUMENTATION.md | Technical docs |
| SESSION_SUMMARY.md | What was done |
| QUICK_REFERENCE.md | This file |

## 🆘 Get Help

### Check Documentation
Start with: `READY_TO_TEST.md`

### Check Logs
Backend: `backend/storage/logs/laravel.log`
Frontend: Browser DevTools Console

### Check Supabase
Dashboard: https://supabase.com/dashboard
Project: kprmqdikdrbmjayxzszk

### Common Error Messages

| Error | Solution |
|-------|----------|
| "Unable to verify email" | Fixed! Now uses format validation |
| "Invalid credentials" | Check email format and password |
| "Invalid 2FA code" | Use current code from app |
| "Failed to connect" | Check backend is running |
| "Supabase error" | Check .env configuration |

## 💡 Pro Tips

1. **Test without 2FA first** - Easier to debug
2. **Use browser incognito** - Fresh session each time
3. **Check DevTools Console** - See API calls and errors
4. **Check Supabase Dashboard** - Verify users are created
5. **Keep backend logs open** - See what's happening
6. **Use format validation** - Email verification is instant
7. **Sync device time** - Important for 2FA codes
8. **Test on different browsers** - Ensure compatibility

## 🎉 Success Indicators

You know it's working when:
- ✅ Registration completes without errors
- ✅ Email verification is instant (green checkmark)
- ✅ Login redirects to dashboard
- ✅ 2FA codes are accepted
- ✅ Users appear in Supabase Dashboard
- ✅ Sessions persist across page refreshes
- ✅ Logout works correctly

## 🚦 Status Indicators

### Backend Status
```bash
curl http://localhost:8000/api/auth/supabase/status
```
- ✅ `{"configured":true}` - Working
- ❌ Connection refused - Not running
- ❌ `{"configured":false}` - Not configured

### Frontend Status
- ✅ Page loads - Working
- ❌ "Cannot connect" - Backend not running
- ❌ Blank page - Check console for errors

### Supabase Status
- ✅ Users created - Working
- ❌ No users - Check configuration
- ❌ Error in dashboard - Check credentials

---

**Keep this handy while testing!**

**Quick Start**: Run both servers → Go to /register → Create account → Login → Done!
