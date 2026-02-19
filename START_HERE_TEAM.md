# 🚀 START HERE - Team Setup Guide

## Welcome Team Members!

This guide will help you set up the Event Management System on your computer.

## 📚 Documentation Overview

We have several guides to help you. Here's what to read and in what order:

### 1️⃣ **SETUP_CHECKLIST.md** ← START HERE
- Print this and check off each step
- Simple checklist format
- Everything you need to do

### 2️⃣ **TEAM_INSTALLATION_GUIDE.md**
- Detailed instructions for each step
- Troubleshooting tips
- Read if you get stuck

### 3️⃣ **ENV_CONFIGURATION_GUIDE.md**
- How to configure .env files
- What to change and what to keep
- Copy-paste ready configurations

### 4️⃣ **QUICK_REFERENCE.md**
- Quick commands and URLs
- Keep this handy while working
- Daily workflow reference

## ⚡ Quick Start (5 Steps)

### Step 1: Install Prerequisites
You need these installed first:
- PHP 8.1+ (use XAMPP for easiest setup)
- Composer
- Node.js 16+
- MySQL (included in XAMPP)
- Git

**Download XAMPP**: https://www.apachefriends.org/
**Download Node.js**: https://nodejs.org/
**Download Composer**: https://getcomposer.org/

### Step 2: Clone Repository
```bash
git clone <repository-url>
cd <project-folder>
```

### Step 3: Setup Backend
```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
# Create database "event_management" in phpMyAdmin
php artisan migrate
php artisan serve
```

### Step 4: Setup Frontend (New Terminal)
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

### Step 5: Test It Works
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- Try registering a test account!

## 📋 What You'll Install

### Backend Dependencies (composer install)
- Laravel framework
- Authentication packages
- Database drivers
- **Size**: ~50-100 MB
- **Time**: 2-5 minutes

### Frontend Dependencies (npm install)
- React
- React Router
- Tailwind CSS
- Supabase client
- **Size**: ~200-400 MB
- **Time**: 3-10 minutes

## 🔧 Configuration Files

### Backend (.env)
Located at: `backend/.env`

**What to change**:
- `DB_PASSWORD` - Your MySQL password (empty for XAMPP)

**What to keep**:
- All Supabase settings (already correct)

### Frontend (.env)
Located at: `frontend/.env`

**What to change**:
- Nothing! Already configured correctly

## ✅ Verification

After setup, check these:

1. **Backend running**: http://localhost:8000
2. **Frontend running**: http://localhost:5173
3. **API working**: http://localhost:8000/api/auth/supabase/status
4. **Can register**: http://localhost:5173/register

## 🐛 Common Issues

### "composer: command not found"
→ Install Composer from https://getcomposer.org/

### "npm: command not found"
→ Install Node.js from https://nodejs.org/

### "Database connection failed"
→ Start MySQL in XAMPP Control Panel
→ Create database "event_management" in phpMyAdmin

### "Port already in use"
→ Use different port: `php artisan serve --port=8001`
→ Update frontend .env: `VITE_API_URL=http://localhost:8001/api`

## 📞 Need Help?

1. Check **SETUP_CHECKLIST.md** - Step by step guide
2. Check **TEAM_INSTALLATION_GUIDE.md** - Detailed instructions
3. Check **ENV_CONFIGURATION_GUIDE.md** - Configuration help
4. Ask your team lead

## 🎯 Daily Workflow

### Starting Work
```bash
# Terminal 1 - Backend
cd backend
php artisan serve

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Stopping Work
Press `Ctrl + C` in each terminal

### Pulling Updates
```bash
git pull
cd backend && composer install
cd frontend && npm install
```

## 📊 Time Estimates

| Task | Time |
|------|------|
| Install prerequisites | 10-20 min |
| Clone repository | 1-2 min |
| Backend setup | 5-10 min |
| Frontend setup | 5-10 min |
| Testing | 5 min |
| **Total** | **25-45 min** |

## 🎓 What You're Building

### Event Management System
- User registration with CVSU email
- Optional 2FA security
- Create and manage events
- Invite members to events
- Schedule management
- Event notifications

### Technology Stack
- **Frontend**: React + Tailwind CSS
- **Backend**: Laravel (PHP)
- **Database**: MySQL
- **Authentication**: Supabase
- **2FA**: TOTP (Google Authenticator)

## 🔐 Important Notes

### Security
- Never commit .env files (already in .gitignore)
- Each team member has their own .env
- Supabase keys are shared within team
- Keep service role key private

### Git Workflow
```bash
# Before starting work
git pull

# After making changes
git add .
git commit -m "Description of changes"
git push
```

### Database
- Each team member has their own local database
- Database name: `event_management`
- Users created in Supabase are shared

## 📚 Additional Documentation

### For Development
- **PROJECT_DOCUMENTATION.md** - Technical documentation
- **AUTH_FLOW_DIAGRAM.md** - Authentication flow
- **QUICK_REFERENCE.md** - Commands and URLs

### For Testing
- **READY_TO_TEST.md** - Testing guide
- **QUICK_START_TESTING.md** - Test scenarios

### For Deployment
- **TEAM_SETUP_GUIDE.md** - Deployment options

## 🎉 Success Checklist

You're ready to start developing when:

- [ ] All prerequisites installed
- [ ] Repository cloned
- [ ] Backend dependencies installed (vendor/ folder exists)
- [ ] Frontend dependencies installed (node_modules/ folder exists)
- [ ] .env files configured
- [ ] Database created and migrated
- [ ] Backend server starts successfully
- [ ] Frontend server starts successfully
- [ ] Can access registration page
- [ ] Can create test account

## 🚦 Next Steps

After setup is complete:

1. **Test the application**
   - Register a test account
   - Try creating an event
   - Test all features

2. **Read the documentation**
   - Understand the codebase
   - Learn the architecture
   - Review coding standards

3. **Start developing**
   - Pick a task from your team lead
   - Create a new branch
   - Start coding!

## 💡 Pro Tips

1. **Use XAMPP** - Easiest way to get PHP + MySQL
2. **Keep terminals open** - One for backend, one for frontend
3. **Check DevTools Console** - See errors and API calls
4. **Use Git branches** - Don't work directly on main
5. **Test before pushing** - Make sure it works
6. **Ask questions** - Better to ask than break things!

## 📞 Support

### Documentation
- Start with SETUP_CHECKLIST.md
- Read TEAM_INSTALLATION_GUIDE.md for details
- Check ENV_CONFIGURATION_GUIDE.md for .env help

### Team Lead
- Ask if you're stuck
- Report any issues
- Suggest improvements

### Online Resources
- Laravel: https://laravel.com/docs
- React: https://react.dev/
- Tailwind: https://tailwindcss.com/docs

---

## 🎯 Summary

### What to Install
1. XAMPP (includes PHP + MySQL)
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

# Frontend (new terminal)
cd frontend
npm install
copy .env.example .env
npm run dev
```

### What to Test
- http://localhost:8000 (backend)
- http://localhost:5173 (frontend)
- Register test account
- Login and explore

---

**Ready to start?** Follow **SETUP_CHECKLIST.md** step by step!

**Questions?** Check **TEAM_INSTALLATION_GUIDE.md** or ask your team lead!

**Good luck and happy coding!** 🚀
