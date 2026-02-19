# Folder Structure Guide

## 📁 Complete Project Structure

This shows what your project looks like after installation.

```
event-management-system/
│
├── 📂 backend/                          ← Laravel Backend
│   │
│   ├── 📂 app/                          ← Application code
│   │   ├── 📂 Http/
│   │   │   ├── 📂 Controllers/          ← API endpoints
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── EventController.php
│   │   │   │   ├── UserController.php
│   │   │   │   ├── SupabaseAuthController.php
│   │   │   │   └── EmailVerificationController.php
│   │   │   └── 📂 Middleware/           ← Request filters
│   │   │       ├── SecurityHeaders.php
│   │   │       └── ThrottleLoginAttempts.php
│   │   │
│   │   ├── 📂 Models/                   ← Database models
│   │   │   ├── User.php
│   │   │   ├── Event.php
│   │   │   ├── EventImage.php
│   │   │   └── UserSchedule.php
│   │   │
│   │   └── 📂 Services/                 ← Business logic
│   │       ├── SupabaseService.php
│   │       └── EmailVerificationService.php
│   │
│   ├── 📂 config/                       ← Configuration files
│   │   ├── app.php
│   │   ├── database.php
│   │   ├── services.php                 ← Supabase config
│   │   └── [other configs]
│   │
│   ├── 📂 database/                     ← Database files
│   │   ├── 📂 migrations/               ← Database schema
│   │   │   ├── create_users_table.php
│   │   │   ├── create_events_table.php
│   │   │   └── [other migrations]
│   │   └── database.sqlite              ← SQLite (if used)
│   │
│   ├── 📂 routes/                       ← API routes
│   │   └── api.php                      ← All API endpoints
│   │
│   ├── 📂 storage/                      ← File storage
│   │   ├── 📂 app/
│   │   │   └── 📂 public/
│   │   │       └── 📂 events/           ← Event images
│   │   └── 📂 logs/
│   │       └── laravel.log              ← Error logs
│   │
│   ├── 📂 vendor/                       ⭐ Created by composer install
│   │   └── [PHP packages]               ← ~50-100 MB
│   │
│   ├── .env                             ⭐ Created by you
│   ├── .env.example                     ← Template
│   ├── composer.json                    ← PHP dependencies
│   ├── composer.lock                    ← Locked versions
│   └── artisan                          ← Laravel CLI tool
│
├── 📂 frontend/                         ← React Frontend
│   │
│   ├── 📂 public/                       ← Static files
│   │   ├── favicon.ico
│   │   └── [other static files]
│   │
│   ├── 📂 src/                          ← Source code
│   │   │
│   │   ├── 📂 components/               ← Reusable components
│   │   │   ├── AuthBackground.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── EventForm.jsx
│   │   │   └── NotificationBell.jsx
│   │   │
│   │   ├── 📂 context/                  ← State management
│   │   │   ├── AuthContext.jsx
│   │   │   └── SupabaseAuthContext.jsx  ← Supabase auth
│   │   │
│   │   ├── 📂 pages/                    ← Page components
│   │   │   ├── RegisterUnified.jsx      ← Registration
│   │   │   ├── LoginUnified.jsx         ← Login
│   │   │   ├── Dashboard.jsx            ← Main dashboard
│   │   │   ├── AddEvent.jsx             ← Create event
│   │   │   ├── AccountDashboard.jsx     ← User settings
│   │   │   └── SupabaseTest.jsx         ← Testing page
│   │   │
│   │   ├── 📂 services/                 ← API services
│   │   │   ├── api.js                   ← Axios instance
│   │   │   └── supabase.js              ← Supabase client
│   │   │
│   │   ├── App.jsx                      ← Main app component
│   │   ├── main.jsx                     ← Entry point
│   │   └── index.css                    ← Global styles
│   │
│   ├── 📂 node_modules/                 ⭐ Created by npm install
│   │   └── [JavaScript packages]        ← ~200-400 MB
│   │
│   ├── .env                             ⭐ Created by you
│   ├── .env.example                     ← Template
│   ├── package.json                     ← Node dependencies
│   ├── package-lock.json                ← Locked versions
│   ├── vite.config.js                   ← Build config
│   └── tailwind.config.js               ← Tailwind config
│
├── 📂 .git/                             ← Git repository
│   └── [git files]
│
└── 📄 Documentation Files               ← Guides (root level)
    ├── START_HERE_TEAM.md               ← Start here!
    ├── SETUP_CHECKLIST.md               ← Setup steps
    ├── TEAM_INSTALLATION_GUIDE.md       ← Detailed guide
    ├── ENV_CONFIGURATION_GUIDE.md       ← .env help
    ├── QUICK_REFERENCE.md               ← Quick commands
    ├── READY_TO_TEST.md                 ← Testing guide
    ├── PROJECT_DOCUMENTATION.md         ← Technical docs
    └── [other docs]
```

## 🎯 Key Folders Explained

### Backend Folders

| Folder | Purpose | Size | Created By |
|--------|---------|------|------------|
| `app/` | Your application code | Small | Git |
| `config/` | Configuration files | Small | Git |
| `database/` | Migrations and seeds | Small | Git |
| `routes/` | API endpoints | Small | Git |
| `storage/` | Logs and uploads | Grows | Git |
| `vendor/` | PHP packages | 50-100 MB | composer install |
| `.env` | Configuration | Small | You copy |

### Frontend Folders

| Folder | Purpose | Size | Created By |
|--------|---------|------|------------|
| `public/` | Static files | Small | Git |
| `src/` | Your React code | Small | Git |
| `node_modules/` | JavaScript packages | 200-400 MB | npm install |
| `.env` | Configuration | Small | You copy |

## 📊 Folder Sizes

### Before Installation
```
project/
├── backend/          ~10 MB
└── frontend/         ~5 MB
Total: ~15 MB
```

### After Installation
```
project/
├── backend/
│   ├── vendor/       ~50-100 MB  ⭐ New
│   └── other         ~10 MB
│
└── frontend/
    ├── node_modules/ ~200-400 MB ⭐ New
    └── other         ~5 MB
    
Total: ~265-515 MB
```

## ⚠️ Important Notes

### Don't Commit These
These folders are in `.gitignore`:

```
backend/
├── vendor/          ❌ Don't commit (too large)
├── .env             ❌ Don't commit (sensitive)
└── storage/logs/    ❌ Don't commit (logs)

frontend/
├── node_modules/    ❌ Don't commit (too large)
├── .env             ❌ Don't commit (sensitive)
└── dist/            ❌ Don't commit (build output)
```

### Do Commit These
These should be in Git:

```
✅ All source code (app/, src/)
✅ Configuration templates (.env.example)
✅ Package definitions (composer.json, package.json)
✅ Documentation files
✅ Database migrations
```

## 🔍 Finding Important Files

### Backend

**Controllers** (API endpoints):
```
backend/app/Http/Controllers/
```

**Models** (Database):
```
backend/app/Models/
```

**Routes** (API paths):
```
backend/routes/api.php
```

**Configuration**:
```
backend/.env
backend/config/services.php
```

**Logs**:
```
backend/storage/logs/laravel.log
```

### Frontend

**Pages**:
```
frontend/src/pages/
```

**Components**:
```
frontend/src/components/
```

**Authentication**:
```
frontend/src/context/SupabaseAuthContext.jsx
```

**Configuration**:
```
frontend/.env
```

**Styles**:
```
frontend/src/index.css
```

## 📝 File Naming Conventions

### Backend (Laravel)
- Controllers: `PascalCase` + `Controller.php`
  - Example: `EventController.php`
- Models: `PascalCase` + `.php`
  - Example: `Event.php`
- Services: `PascalCase` + `Service.php`
  - Example: `SupabaseService.php`

### Frontend (React)
- Components: `PascalCase` + `.jsx`
  - Example: `EventForm.jsx`
- Pages: `PascalCase` + `.jsx`
  - Example: `Dashboard.jsx`
- Services: `camelCase` + `.js`
  - Example: `supabase.js`

## 🎯 Quick Navigation

### Working on Authentication?
```
Backend:
- backend/app/Http/Controllers/SupabaseAuthController.php
- backend/app/Services/SupabaseService.php

Frontend:
- frontend/src/pages/RegisterUnified.jsx
- frontend/src/pages/LoginUnified.jsx
- frontend/src/context/SupabaseAuthContext.jsx
```

### Working on Events?
```
Backend:
- backend/app/Http/Controllers/EventController.php
- backend/app/Models/Event.php

Frontend:
- frontend/src/pages/Dashboard.jsx
- frontend/src/pages/AddEvent.jsx
- frontend/src/components/EventForm.jsx
```

### Working on User Profile?
```
Backend:
- backend/app/Http/Controllers/UserController.php
- backend/app/Models/User.php

Frontend:
- frontend/src/pages/AccountDashboard.jsx
```

## 🔧 Configuration Files

### Backend Configuration
```
backend/
├── .env                    ← Your settings
├── .env.example            ← Template
├── config/
│   ├── app.php            ← App settings
│   ├── database.php       ← Database config
│   └── services.php       ← Supabase config
└── composer.json          ← PHP packages
```

### Frontend Configuration
```
frontend/
├── .env                   ← Your settings
├── .env.example           ← Template
├── package.json           ← Node packages
├── vite.config.js         ← Build config
└── tailwind.config.js     ← Styling config
```

## 📦 Package Files

### Backend Dependencies
```
backend/
├── composer.json          ← What packages to install
├── composer.lock          ← Exact versions installed
└── vendor/                ← Installed packages
```

### Frontend Dependencies
```
frontend/
├── package.json           ← What packages to install
├── package-lock.json      ← Exact versions installed
└── node_modules/          ← Installed packages
```

## 🚀 After Installation Checklist

Verify these folders/files exist:

### Backend
- [ ] `vendor/` folder exists (~50-100 MB)
- [ ] `.env` file exists (copied from .env.example)
- [ ] `storage/logs/` folder exists
- [ ] Can run: `php artisan serve`

### Frontend
- [ ] `node_modules/` folder exists (~200-400 MB)
- [ ] `.env` file exists (copied from .env.example)
- [ ] Can run: `npm run dev`

## 💡 Pro Tips

1. **Large Folders**: `vendor/` and `node_modules/` are large but necessary
2. **Don't Delete**: Never delete these folders manually
3. **Reinstall**: If corrupted, delete and run install again
4. **Git Ignore**: These folders are automatically ignored by Git
5. **Clean Install**: Delete these folders for fresh install

## 🔄 Reinstalling Dependencies

### Backend
```bash
cd backend
rm -rf vendor/           # Delete (or manually delete folder)
composer install         # Reinstall
```

### Frontend
```bash
cd frontend
rm -rf node_modules/     # Delete (or manually delete folder)
npm install              # Reinstall
```

---

**Use this guide to navigate the project structure!**

**Lost?** Check this guide to find what you need!
