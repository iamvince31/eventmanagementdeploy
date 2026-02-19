# Team Setup Guide
## Deploy Event Management System to Your Team

---

## 🎯 Overview

This guide will help you set up the Event Management System for your entire team, whether they're developers or end users.

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ Supabase project created
- ✅ Database configured
- ✅ Application working locally
- ✅ Git repository (GitHub, GitLab, etc.)

---

## 🚀 Quick Setup (3 Options)

### Option 1: Local Network (Fastest - Same WiFi)
**Best for:** Testing with team in same location
**Time:** 5 minutes

### Option 2: Cloud Deployment (Recommended)
**Best for:** Remote team, production use
**Time:** 30 minutes

### Option 3: Shared Development (For Developers)
**Best for:** Team working on code together
**Time:** 15 minutes

---

## 📱 Option 1: Local Network Setup

### Step 1: Get Your Local IP Address

**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.100`)

**On Mac/Linux:**
```bash
ifconfig
```
Look for "inet" (e.g., `192.168.1.100`)

### Step 2: Update Backend Configuration

Edit `backend/.env`:
```env
APP_URL=http://192.168.1.100:8000
FRONTEND_URL=http://192.168.1.100:5173

# Update Supabase redirect URLs
# (You'll need to add these in Supabase Dashboard)
```

### Step 3: Update Frontend Configuration

Edit `frontend/.env`:
```env
VITE_API_URL=http://192.168.1.100:8000/api
```

Update `frontend/src/services/api.js` and other files that have `localhost`:
```javascript
// Change from:
const API_URL = 'http://localhost:8000/api';

// To:
const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.100:8000/api';
```

### Step 4: Update Supabase Redirect URLs

1. Go to Supabase Dashboard
2. **Authentication** → **URL Configuration**
3. Add to **Redirect URLs**:
   - `http://192.168.1.100:5173/*`
   - `http://192.168.1.100:5173/auth/callback`
4. Update **Site URL**: `http://192.168.1.100:5173`

### Step 5: Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev -- --host
```

### Step 6: Share with Team

Tell your team to visit:
```
http://192.168.1.100:5173
```

**Requirements:**
- ✅ Same WiFi network
- ✅ Your computer must stay on
- ✅ Firewall allows connections

---

## ☁️ Option 2: Cloud Deployment (Recommended)

### A. Deploy Backend (Laravel)

#### Using Railway (Free Tier Available):

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Configure Environment Variables**
   Add all variables from `backend/.env`:
   ```env
   APP_NAME=EventManagement
   APP_ENV=production
   APP_KEY=base64:your-key-here
   APP_DEBUG=false
   APP_URL=https://your-app.railway.app
   
   DB_CONNECTION=mysql
   DB_HOST=your-railway-db-host
   DB_PORT=3306
   DB_DATABASE=railway
   DB_USERNAME=root
   DB_PASSWORD=your-db-password
   
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   SUPABASE_JWT_SECRET=your-jwt-secret
   
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

4. **Add MySQL Database**
   - In Railway project, click "New"
   - Select "Database" → "MySQL"
   - Copy connection details to environment variables

5. **Deploy**
   - Railway auto-deploys on git push
   - Get your backend URL: `https://your-app.railway.app`

#### Alternative: Heroku, DigitalOcean, AWS, etc.

### B. Deploy Frontend (React)

#### Using Vercel (Free):

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Select `frontend` folder as root directory

3. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Add Environment Variables**
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_URL=https://your-backend.railway.app/api
   ```

5. **Deploy**
   - Click "Deploy"
   - Get your frontend URL: `https://your-app.vercel.app`

#### Alternative: Netlify, GitHub Pages, etc.

### C. Update Supabase Configuration

1. Go to Supabase Dashboard
2. **Authentication** → **URL Configuration**
3. Update URLs:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**:
     - `https://your-app.vercel.app/*`
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app/dashboard`

### D. Share with Team

Send your team:
```
🎉 Event Management System is live!

URL: https://your-app.vercel.app

To get started:
1. Go to the URL above
2. Click "Register"
3. Use your CVSU email
4. Create your account
5. Start managing events!
```

---

## 👥 Option 3: Shared Development Setup

### For Developers Working on Code:

#### Step 1: Share Repository

1. **Push to GitHub/GitLab**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/event-management.git
   git push -u origin main
   ```

2. **Invite Team Members**
   - Go to repository settings
   - Add collaborators
   - They get email invitation

#### Step 2: Team Members Clone

```bash
git clone https://github.com/yourusername/event-management.git
cd event-management
```

#### Step 3: Share Environment Variables

**Create `.env.example` files** (already done):

**Backend** (`backend/.env.example`):
```env
APP_NAME=EventManagement
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=event_management
DB_USERNAME=root
DB_PASSWORD=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env.example`):
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:8000/api
```

**Share Supabase Keys Securely:**
- Use password manager (1Password, LastPass)
- Or encrypted message (Signal, WhatsApp)
- Or team secrets manager (Doppler, Vault)

#### Step 4: Team Setup Instructions

Create `DEVELOPER_SETUP.md`:
```markdown
# Developer Setup

## Prerequisites
- PHP 8.1+
- Composer
- Node.js 18+
- MySQL
- Git

## Setup Steps

1. Clone repository
2. Copy `.env.example` to `.env` in both backend and frontend
3. Fill in Supabase keys (ask team lead)
4. Install dependencies:
   ```bash
   # Backend
   cd backend
   composer install
   php artisan key:generate
   php artisan migrate
   
   # Frontend
   cd frontend
   npm install
   ```
5. Start servers:
   ```bash
   # Terminal 1
   cd backend
   php artisan serve
   
   # Terminal 2
   cd frontend
   npm run dev
   ```
6. Visit: http://localhost:5173
```

---

## 🔐 Security Checklist

### Before Sharing with Team:

- [ ] Change default passwords
- [ ] Update `APP_KEY` in production
- [ ] Set `APP_DEBUG=false` in production
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up proper database backups
- [ ] Review Supabase security rules
- [ ] Enable Row Level Security (RLS)
- [ ] Set up monitoring/logging
- [ ] Document admin credentials securely

---

## 📊 Team Roles & Access

### Recommended Setup:

**Project Owner (You):**
- Supabase: Owner
- GitHub: Admin
- Can: Everything

**Lead Developers (1-2 people):**
- Supabase: Admin or Developer
- GitHub: Maintainer
- Can: View database, make changes, review code

**Developers (Team members):**
- Supabase: Read-only (optional)
- GitHub: Developer
- Can: Write code, create PRs

**End Users (Everyone else):**
- No Supabase access
- No GitHub access
- Just use the app

---

## 📱 User Onboarding

### Email Template for Team:

```
Subject: Welcome to Event Management System!

Hi Team,

Our new Event Management System is ready! 🎉

🔗 Access: https://your-app.vercel.app
(or http://192.168.1.100:5173 if local)

📝 Getting Started:
1. Click "Register"
2. Use your CVSU email (main.firstname.lastname@cvsu.edu.ph)
3. Create a password
4. Optional: Enable 2FA for extra security
5. Start creating and managing events!

✨ Features:
- Create and manage events
- Invite team members
- Track schedules
- Avoid conflicts
- Get notifications

❓ Need Help?
- Contact: [your-email]
- Documentation: [link to docs]

Happy event planning!
```

---

## 🐛 Troubleshooting

### Common Issues:

**"Can't connect to backend"**
- Check backend is running
- Verify API URL in frontend `.env`
- Check firewall settings

**"Supabase errors"**
- Verify API keys are correct
- Check redirect URLs in Supabase
- Ensure email confirmation is disabled (for testing)

**"Database connection failed"**
- Check MySQL is running
- Verify database credentials
- Run migrations: `php artisan migrate`

**"CORS errors"**
- Update CORS settings in `backend/config/cors.php`
- Add frontend URL to allowed origins

---

## 📈 Monitoring & Maintenance

### Regular Tasks:

**Daily:**
- Check error logs
- Monitor user registrations
- Review system performance

**Weekly:**
- Database backup
- Update dependencies
- Review security logs

**Monthly:**
- Update documentation
- Review user feedback
- Plan new features

---

## 🎓 Training Materials

### Create These Documents:

1. **User Guide** - How to use the app
2. **Admin Guide** - How to manage users
3. **Developer Guide** - How to contribute code
4. **API Documentation** - API endpoints
5. **Troubleshooting Guide** - Common issues

---

## ✅ Launch Checklist

### Before Going Live:

- [ ] All features tested
- [ ] Database backed up
- [ ] Environment variables set
- [ ] HTTPS enabled
- [ ] Error logging configured
- [ ] Team members invited
- [ ] Documentation complete
- [ ] Support process defined
- [ ] Backup plan ready
- [ ] Monitoring set up

---

## 🚀 Quick Start Commands

### For You (Project Owner):

```bash
# Start local development
cd backend && php artisan serve --host=0.0.0.0
cd frontend && npm run dev -- --host

# Deploy to production
git push origin main  # Auto-deploys if configured

# Backup database
php artisan backup:run
```

### For Team Members:

```bash
# Clone and setup
git clone [repo-url]
cd event-management
# Copy .env files and fill in keys
cd backend && composer install && php artisan migrate
cd frontend && npm install

# Start development
cd backend && php artisan serve
cd frontend && npm run dev
```

---

## 📞 Support

### For Team Questions:

- **Technical Issues**: [your-email]
- **Account Problems**: [admin-email]
- **Feature Requests**: [GitHub Issues]
- **Documentation**: [link to docs]

---

**Choose your deployment option and follow the steps above. Your team will be up and running in no time!** 🚀
