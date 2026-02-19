# Setup Checklist for Team Members

Print this and check off each step as you complete it!

## ✅ Prerequisites Installation

- [ ] **PHP 8.1+** installed
  - Test: Open terminal/cmd and type: `php --version`
  - Download: https://windows.php.net/download/ or use XAMPP

- [ ] **Composer** installed
  - Test: `composer --version`
  - Download: https://getcomposer.org/download/

- [ ] **Node.js 16+** installed
  - Test: `node --version` and `npm --version`
  - Download: https://nodejs.org/

- [ ] **MySQL** installed and running
  - Use XAMPP (easiest): https://www.apachefriends.org/
  - Or MySQL: https://dev.mysql.com/downloads/installer/

- [ ] **Git** installed
  - Test: `git --version`
  - Download: https://git-scm.com/

## 📥 Project Setup

- [ ] **Clone repository**
  ```bash
  git clone <repository-url>
  cd <project-folder>
  ```

## 🔧 Backend Setup

- [ ] **Navigate to backend folder**
  ```bash
  cd backend
  ```

- [ ] **Install PHP dependencies**
  ```bash
  composer install
  ```
  ⏱️ Takes 2-5 minutes

- [ ] **Copy environment file**
  ```bash
  copy .env.example .env
  ```
  (Mac/Linux: `cp .env.example .env`)

- [ ] **Generate application key**
  ```bash
  php artisan key:generate
  ```

- [ ] **Configure .env file**
  - Open `backend/.env` in text editor
  - Update database settings:
    ```env
    DB_DATABASE=event_management
    DB_USERNAME=root
    DB_PASSWORD=        # Your MySQL password
    ```
  - Supabase settings should already be there

- [ ] **Create database**
  - Option A: MySQL command line
    ```bash
    mysql -u root -p
    CREATE DATABASE event_management;
    exit;
    ```
  - Option B: phpMyAdmin (http://localhost/phpmyadmin)
    - Click "New"
    - Database name: `event_management`
    - Click "Create"

- [ ] **Run database migrations**
  ```bash
  php artisan migrate
  ```

- [ ] **Create storage link**
  ```bash
  php artisan storage:link
  ```

- [ ] **Test backend server**
  ```bash
  php artisan serve
  ```
  - Should see: "Laravel development server started"
  - Open browser: http://localhost:8000
  - Should see Laravel page

## ⚛️ Frontend Setup

- [ ] **Open NEW terminal** (keep backend running)

- [ ] **Navigate to frontend folder**
  ```bash
  cd frontend
  ```

- [ ] **Install Node.js dependencies**
  ```bash
  npm install
  ```
  ⏱️ Takes 3-10 minutes

- [ ] **Copy environment file**
  ```bash
  copy .env.example .env
  ```
  (Mac/Linux: `cp .env.example .env`)

- [ ] **Verify .env file**
  - Open `frontend/.env` in text editor
  - Should have:
    ```env
    VITE_SUPABASE_URL=https://kprmqdikdrbmjayxzszk.supabase.co
    VITE_SUPABASE_ANON_KEY=eyJhbGc...
    VITE_API_URL=http://localhost:8000/api
    ```

- [ ] **Test frontend server**
  ```bash
  npm run dev
  ```
  - Should see: "Local: http://localhost:5173/"
  - Open browser: http://localhost:5173
  - Should see login page

## 🧪 Verification Tests

- [ ] **Backend is running**
  - URL: http://localhost:8000
  - Shows Laravel page

- [ ] **Frontend is running**
  - URL: http://localhost:5173
  - Shows login/register page

- [ ] **API is working**
  - Open: http://localhost:8000/api/auth/supabase/status
  - Should show: `{"configured":true}`

- [ ] **Can access registration**
  - Go to: http://localhost:5173/register
  - Form should load

- [ ] **Test registration**
  - Fill form with test data:
    - Username: `Test User`
    - Email: `main.test.user@cvsu.edu.ph`
    - Department: Any
    - Password: `password123`
  - Click "Verify" (should succeed instantly)
  - Click "Create Account"
  - Should see success screen

- [ ] **Test login**
  - Go to: http://localhost:5173/login
  - Enter test credentials
  - Should reach dashboard

## 📁 Verify Folder Structure

After installation, you should have:

```
backend/
├── vendor/          ✅ Created by composer install
├── .env             ✅ Copied from .env.example
└── [other files]

frontend/
├── node_modules/    ✅ Created by npm install
├── .env             ✅ Copied from .env.example
└── [other files]
```

## 🐛 Troubleshooting

### If composer install fails:
- [ ] Check PHP is installed: `php --version`
- [ ] Check Composer is installed: `composer --version`
- [ ] Try: `composer install --ignore-platform-reqs`

### If npm install fails:
- [ ] Check Node.js is installed: `node --version`
- [ ] Clear cache: `npm cache clean --force`
- [ ] Try again: `npm install`

### If database migration fails:
- [ ] Check MySQL is running (XAMPP Control Panel)
- [ ] Check database exists: `event_management`
- [ ] Check .env database credentials are correct
- [ ] Try: `php artisan migrate:fresh`

### If backend won't start:
- [ ] Check port 8000 is not in use
- [ ] Try different port: `php artisan serve --port=8001`
- [ ] Update frontend .env: `VITE_API_URL=http://localhost:8001/api`

### If frontend won't start:
- [ ] Check port 5173 is not in use
- [ ] Try: `npm run dev -- --port=5174`
- [ ] Access at: http://localhost:5174

## 📞 Need Help?

1. ✅ Check this checklist again
2. ✅ Read `TEAM_INSTALLATION_GUIDE.md` for detailed instructions
3. ✅ Check error messages in terminal
4. ✅ Ask team lead

## 🎉 Success!

If all checkboxes are checked, you're ready to start developing!

### Daily Workflow:
1. Start MySQL (if not auto-start)
2. Terminal 1: `cd backend && php artisan serve`
3. Terminal 2: `cd frontend && npm run dev`
4. Start coding!

### Stop Servers:
- Press `Ctrl + C` in each terminal

---

**Setup Complete?** ✅
**Ready to Code?** ✅
**Questions?** Ask your team lead!

---

## 📋 Quick Reference

| Command | Purpose |
|---------|---------|
| `composer install` | Install PHP dependencies |
| `npm install` | Install Node.js dependencies |
| `php artisan serve` | Start backend server |
| `npm run dev` | Start frontend server |
| `php artisan migrate` | Run database migrations |
| `git pull` | Get latest code |

| URL | Purpose |
|-----|---------|
| http://localhost:8000 | Backend API |
| http://localhost:5173 | Frontend app |
| http://localhost/phpmyadmin | Database admin (XAMPP) |

---

**Print this checklist and keep it handy!**
