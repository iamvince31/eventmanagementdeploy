# Event Management System - Team Documentation

## 🎯 Quick Links

### 🚀 Getting Started
1. **[START_HERE_TEAM.md](START_HERE_TEAM.md)** - Read this first!
2. **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** - Step-by-step checklist
3. **[TEAM_INSTALLATION_GUIDE.md](TEAM_INSTALLATION_GUIDE.md)** - Detailed instructions

### 🔧 Configuration
- **[ENV_CONFIGURATION_GUIDE.md](ENV_CONFIGURATION_GUIDE.md)** - How to set up .env files
- **[FOLDER_STRUCTURE_GUIDE.md](FOLDER_STRUCTURE_GUIDE.md)** - Project structure explained

### 📖 Reference
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Commands and URLs
- **[PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)** - Technical documentation
- **[AUTH_FLOW_DIAGRAM.md](AUTH_FLOW_DIAGRAM.md)** - Authentication flow

### 🧪 Testing
- **[READY_TO_TEST.md](READY_TO_TEST.md)** - Testing guide
- **[QUICK_START_TESTING.md](QUICK_START_TESTING.md)** - Test scenarios

### 🚢 Deployment
- **[TEAM_SETUP_GUIDE.md](TEAM_SETUP_GUIDE.md)** - Deployment options

---

## 📋 What You Need to Install

### Prerequisites
1. **XAMPP** (includes PHP + MySQL)
   - Download: https://www.apachefriends.org/
   
2. **Composer** (PHP package manager)
   - Download: https://getcomposer.org/
   
3. **Node.js** (includes npm)
   - Download: https://nodejs.org/
   
4. **Git** (version control)
   - Download: https://git-scm.com/

### Installation Commands

**Backend**:
```bash
cd backend
composer install          # Installs PHP packages (~50-100 MB)
copy .env.example .env    # Creates config file
php artisan key:generate  # Generates encryption key
php artisan migrate       # Sets up database
php artisan serve         # Starts server
```

**Frontend**:
```bash
cd frontend
npm install              # Installs JavaScript packages (~200-400 MB)
copy .env.example .env   # Creates config file
npm run dev              # Starts server
```

---

## 🎓 What You're Building

### Event Management System Features
- ✅ User registration with CVSU email
- ✅ Optional 2FA security (Google Authenticator)
- ✅ Create and manage events
- ✅ Invite members to events
- ✅ Schedule management
- ✅ Event notifications
- ✅ Reschedule requests

### Technology Stack
- **Frontend**: React + Tailwind CSS + Vite
- **Backend**: Laravel (PHP)
- **Database**: MySQL
- **Authentication**: Supabase + Laravel Sanctum
- **2FA**: TOTP (Time-based One-Time Password)

---

## 📚 Documentation Index

### For Setup (Start Here!)
| Document | Purpose | When to Read |
|----------|---------|--------------|
| START_HERE_TEAM.md | Overview and quick start | First thing |
| SETUP_CHECKLIST.md | Step-by-step checklist | During setup |
| TEAM_INSTALLATION_GUIDE.md | Detailed instructions | If stuck |
| ENV_CONFIGURATION_GUIDE.md | .env file help | During config |

### For Development
| Document | Purpose | When to Read |
|----------|---------|--------------|
| FOLDER_STRUCTURE_GUIDE.md | Project structure | When navigating code |
| PROJECT_DOCUMENTATION.md | Technical details | When developing |
| QUICK_REFERENCE.md | Quick commands | Keep handy |
| AUTH_FLOW_DIAGRAM.md | Auth system flow | Understanding auth |

### For Testing
| Document | Purpose | When to Read |
|----------|---------|--------------|
| READY_TO_TEST.md | Testing overview | Before testing |
| QUICK_START_TESTING.md | Test scenarios | During testing |

### For Deployment
| Document | Purpose | When to Read |
|----------|---------|--------------|
| TEAM_SETUP_GUIDE.md | Deployment options | When deploying |

### Status & History
| Document | Purpose | When to Read |
|----------|---------|--------------|
| SESSION_SUMMARY.md | What was done | Understanding changes |
| CURRENT_STATUS_AND_NEXT_STEPS.md | Current status | Checking progress |

---

## ⚡ Quick Start Commands

### Daily Workflow
```bash
# Start MySQL (if using XAMPP)
# Open XAMPP Control Panel → Start MySQL

# Terminal 1 - Backend
cd backend
php artisan serve

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Important URLs
- Backend API: http://localhost:8000
- Frontend App: http://localhost:5173
- Registration: http://localhost:5173/register
- Login: http://localhost:5173/login
- Dashboard: http://localhost:5173/dashboard

### Common Commands
```bash
# Backend
composer install          # Install dependencies
php artisan migrate       # Run migrations
php artisan serve         # Start server
php artisan config:clear  # Clear config cache

# Frontend
npm install              # Install dependencies
npm run dev              # Start dev server
npm run build            # Build for production

# Git
git pull                 # Get latest code
git status               # Check changes
git add .                # Stage changes
git commit -m "message"  # Commit changes
git push                 # Push to remote
```

---

## 🔍 Finding What You Need

### "I need to set up my computer"
→ Read **START_HERE_TEAM.md**
→ Follow **SETUP_CHECKLIST.md**

### "I'm stuck during installation"
→ Check **TEAM_INSTALLATION_GUIDE.md**
→ Look at Common Issues section

### "I don't know what to put in .env"
→ Read **ENV_CONFIGURATION_GUIDE.md**
→ Copy from .env.example

### "I want to understand the code"
→ Check **FOLDER_STRUCTURE_GUIDE.md**
→ Read **PROJECT_DOCUMENTATION.md**

### "I need quick commands"
→ Keep **QUICK_REFERENCE.md** handy

### "I want to test the system"
→ Follow **READY_TO_TEST.md**

### "I need to understand authentication"
→ Read **AUTH_FLOW_DIAGRAM.md**

---

## 🎯 Setup Time Estimates

| Task | Time |
|------|------|
| Download prerequisites | 10-20 min |
| Clone repository | 1-2 min |
| Backend setup | 5-10 min |
| Frontend setup | 5-10 min |
| Configuration | 5 min |
| Testing | 5 min |
| **Total** | **30-50 min** |

---

## ✅ Setup Verification

After setup, verify:

- [ ] PHP installed: `php --version`
- [ ] Composer installed: `composer --version`
- [ ] Node.js installed: `node --version`
- [ ] MySQL running (XAMPP)
- [ ] Backend dependencies installed (vendor/ exists)
- [ ] Frontend dependencies installed (node_modules/ exists)
- [ ] Backend .env configured
- [ ] Frontend .env configured
- [ ] Database created (event_management)
- [ ] Migrations run successfully
- [ ] Backend starts: http://localhost:8000
- [ ] Frontend starts: http://localhost:5173
- [ ] Can register test account
- [ ] Can login successfully

---

## 🐛 Common Issues

### Installation Issues
| Problem | Solution | Document |
|---------|----------|----------|
| composer not found | Install Composer | TEAM_INSTALLATION_GUIDE.md |
| npm not found | Install Node.js | TEAM_INSTALLATION_GUIDE.md |
| Database error | Check MySQL running | ENV_CONFIGURATION_GUIDE.md |
| Port in use | Use different port | QUICK_REFERENCE.md |

### Configuration Issues
| Problem | Solution | Document |
|---------|----------|----------|
| .env not found | Copy from .env.example | ENV_CONFIGURATION_GUIDE.md |
| APP_KEY error | Run php artisan key:generate | SETUP_CHECKLIST.md |
| Supabase error | Check .env keys | ENV_CONFIGURATION_GUIDE.md |

---

## 📞 Getting Help

### Step 1: Check Documentation
- Start with the relevant guide above
- Check Common Issues section
- Look at troubleshooting tips

### Step 2: Check Logs
```bash
# Backend logs
backend/storage/logs/laravel.log

# Frontend console
Browser DevTools (F12) → Console
```

### Step 3: Ask Team Lead
- Describe the problem
- Share error messages
- Mention what you've tried

---

## 🎓 Learning Resources

### Laravel (Backend)
- Official Docs: https://laravel.com/docs
- Video Tutorials: https://laracasts.com/

### React (Frontend)
- Official Docs: https://react.dev/
- Tutorial: https://react.dev/learn

### Tailwind CSS (Styling)
- Official Docs: https://tailwindcss.com/docs
- Playground: https://play.tailwindcss.com/

### Supabase (Authentication)
- Official Docs: https://supabase.com/docs
- Auth Guide: https://supabase.com/docs/guides/auth

---

## 🔐 Security Notes

### What to Keep Private
- ❌ .env files (never commit)
- ❌ Database passwords
- ❌ Supabase service role key
- ❌ APP_KEY

### What's Safe to Share (Within Team)
- ✅ Repository URL
- ✅ Supabase URL and anon key
- ✅ Database name
- ✅ Setup instructions

---

## 🚀 Ready to Start?

1. **Read** START_HERE_TEAM.md
2. **Follow** SETUP_CHECKLIST.md
3. **Configure** using ENV_CONFIGURATION_GUIDE.md
4. **Test** with READY_TO_TEST.md
5. **Start coding!**

---

## 📊 Project Statistics

- **Backend**: Laravel 11, PHP 8.1+
- **Frontend**: React 18, Vite 5
- **Database**: MySQL 8.0+
- **Authentication**: Supabase + Sanctum
- **Styling**: Tailwind CSS 3
- **Total Dependencies**: ~50 backend + ~200 frontend packages
- **Installation Size**: ~300-500 MB

---

## 🎉 Success!

When you see:
- ✅ Backend running at http://localhost:8000
- ✅ Frontend running at http://localhost:5173
- ✅ Can register and login
- ✅ Dashboard loads

**You're ready to develop!** 🚀

---

**Questions?** Check the relevant guide above or ask your team lead!

**Happy Coding!** 💻
