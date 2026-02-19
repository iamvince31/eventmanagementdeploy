# Updated Team Setup Guide (Supabase Reverted)

## ⚠️ Important Update

The Supabase authentication has been reverted. The system now uses the original Laravel-React-Tailwind authentication.

## 📋 What Changed

### Removed
- ❌ Supabase authentication
- ❌ 2FA (Two-Factor Authentication)
- ❌ CVSU email validation requirement
- ❌ Email verification via SMTP

### Retained
- ✅ All event management features
- ✅ User registration and login
- ✅ Password reset with OTP
- ✅ Event invitations
- ✅ Schedule management
- ✅ Notification system

## 🚀 Quick Setup for Team Members

### Prerequisites (Same as Before)
1. **XAMPP** (PHP + MySQL) - https://www.apachefriends.org/
2. **Composer** - https://getcomposer.org/
3. **Node.js** - https://nodejs.org/
4. **Git** - https://git-scm.com/

### Installation Steps

**1. Clone Repository**
```bash
git clone <repository-url>
cd <project-folder>
```

**2. Backend Setup**
```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
# Create database "event_management" in phpMyAdmin
php artisan migrate
php artisan serve
```

**3. Frontend Setup (New Terminal)**
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## 🔧 Configuration

### Backend .env
Only need to configure database:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=event_management
DB_USERNAME=root
DB_PASSWORD=              # Your MySQL password (empty for XAMPP)
```

**Note**: Supabase settings are commented out and not needed.

### Frontend .env
Already configured correctly:

```env
VITE_API_URL=http://localhost:8000/api
```

**Note**: Supabase settings are commented out and not needed.

## ✅ What's Simpler Now

### No Supabase Setup Required
- ❌ No Supabase account needed
- ❌ No Supabase API keys to configure
- ❌ No external service dependencies
- ✅ Everything runs locally

### Simpler Registration
- ✅ Any email format accepted (no CVSU requirement)
- ✅ No email verification needed
- ✅ No 2FA setup
- ✅ Faster registration process

### Easier Testing
- ✅ Use any test email: `test@example.com`
- ✅ No authenticator app needed
- ✅ No external API calls
- ✅ Fully offline development

## 🧪 Testing

### Register Test Account
1. Go to: http://localhost:5173/register
2. Fill form:
   - Username: `Test User`
   - Email: `test@example.com` (any email works)
   - Department: Any
   - Password: `password123`
3. Click "Register"
4. Should redirect to login

### Login
1. Go to: http://localhost:5173/login
2. Enter credentials
3. Should reach dashboard

## 📊 Installation Size

**Backend** (composer install):
- Size: ~50-100 MB
- Time: 2-5 minutes

**Frontend** (npm install):
- Size: ~200-400 MB
- Time: 3-10 minutes

**Total Setup Time**: 25-40 minutes

## 🎯 Active Features

### Authentication
- ✅ User registration (any email)
- ✅ Login with email/password
- ✅ Password reset with OTP
- ✅ Session management
- ✅ Logout

### Event Management
- ✅ Create events
- ✅ Edit events
- ✅ Delete events
- ✅ Upload event images
- ✅ Set event location
- ✅ Auto-accept reschedule option

### User Features
- ✅ Invite members to events
- ✅ Accept/decline invitations
- ✅ View pending invitations (notification bell)
- ✅ Manage personal schedule
- ✅ Schedule conflict detection
- ✅ Request event reschedule
- ✅ Approve/reject reschedule requests

### Dashboard
- ✅ Calendar view
- ✅ Event statistics
- ✅ Upcoming events
- ✅ Event details modal
- ✅ Member list with status

## 🔍 Verification Checklist

After setup, verify:

- [ ] Backend runs at http://localhost:8000
- [ ] Frontend runs at http://localhost:5173
- [ ] Can register with any email
- [ ] Can login successfully
- [ ] Dashboard loads
- [ ] Can create events
- [ ] Can invite members
- [ ] Notification bell works
- [ ] No console errors

## 📝 Important Notes

### Database
- Each team member has their own local MySQL database
- Database name: `event_management`
- No shared database (everyone works independently)

### Email Format
- Any email format accepted
- No CVSU requirement
- No email verification
- Examples: `test@example.com`, `user@test.com`, etc.

### Authentication
- Uses Laravel Sanctum (token-based)
- Tokens stored in localStorage
- Session timeout: 120 minutes
- No external dependencies

## 🐛 Troubleshooting

### "composer: command not found"
→ Install Composer from https://getcomposer.org/

### "npm: command not found"
→ Install Node.js from https://nodejs.org/

### "Database connection failed"
→ Start MySQL in XAMPP Control Panel
→ Create database "event_management"
→ Check .env database credentials

### "Port already in use"
→ Backend: `php artisan serve --port=8001`
→ Frontend: `npm run dev -- --port=5174`

## 📚 Documentation

### For Setup
- **UPDATED_TEAM_SETUP.md** (this file) - Current setup guide
- **SUPABASE_REVERTED.md** - What changed
- **SETUP_CHECKLIST.md** - Step-by-step checklist

### For Development
- **PROJECT_DOCUMENTATION.md** - Technical documentation
- **FOLDER_STRUCTURE_GUIDE.md** - Project structure

### For Reference
- **QUICK_REFERENCE.md** - Commands and URLs

## 🎉 Summary

### What You Need
1. XAMPP (PHP + MySQL)
2. Composer
3. Node.js
4. Git

### What to Run
```bash
# Backend
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve

# Frontend
cd frontend
npm install
copy .env.example .env
npm run dev
```

### What to Test
- Register: http://localhost:5173/register
- Login: http://localhost:5173/login
- Dashboard: http://localhost:5173/dashboard

---

**Setup is now simpler!** No Supabase configuration needed.

**Questions?** Check SUPABASE_REVERTED.md for details on what changed.

**Ready to code!** 🚀
