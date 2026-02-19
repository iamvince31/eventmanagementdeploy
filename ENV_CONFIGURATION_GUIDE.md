# Environment Configuration Guide

## 📝 What are .env files?

`.env` files contain configuration settings for your application. Each team member needs their own `.env` files, but most settings will be the same.

## 🔧 Backend Configuration

### File Location
`backend/.env`

### How to Create
```bash
cd backend
copy .env.example .env
# Mac/Linux: cp .env.example .env
```

### Required Configuration

```env
# ============================================
# APPLICATION SETTINGS
# ============================================
APP_NAME=Laravel
APP_ENV=local
APP_KEY=                    # ⚠️ Run: php artisan key:generate
APP_DEBUG=true
APP_URL=http://localhost:8000

# ============================================
# DATABASE SETTINGS
# ⚠️ UPDATE THESE BASED ON YOUR MYSQL SETUP
# ============================================
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=event_management
DB_USERNAME=root
DB_PASSWORD=                # Your MySQL password (empty for XAMPP default)

# ============================================
# SUPABASE SETTINGS
# ✅ SAME FOR ALL TEAM MEMBERS - DO NOT CHANGE
# ============================================
SUPABASE_URL=https://kprmqdikdrbmjayxzszk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwcm1xZGlrZHJibWpheXh6c3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzODY5NjEsImV4cCI6MjA4Njk2Mjk2MX0.qf0SZl_4-91O0lydaeICzhMkzcl-d_u_aA9bykolqNI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwcm1xZGlrZHJibWpheXh6c3prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTM4Njk2MSwiZXhwIjoyMDg2OTYyOTYxfQ.PtkMB71vCUnQ7MzmAJ0qq1_azIY4tUj-QdNyqmYMkU4

# ============================================
# FRONTEND URL
# ============================================
FRONTEND_URL=http://localhost:5173

# ============================================
# SESSION SETTINGS (Keep as is)
# ============================================
SESSION_DRIVER=database
SESSION_LIFETIME=120

# ============================================
# MAIL SETTINGS (Keep as is for now)
# ============================================
MAIL_MAILER=log
```

### What to Change

| Setting | What to Put | Example |
|---------|-------------|---------|
| `APP_KEY` | Run `php artisan key:generate` | Auto-generated |
| `DB_DATABASE` | Database name | `event_management` |
| `DB_USERNAME` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | Empty for XAMPP, or your password |

### What NOT to Change

- ✅ Keep `SUPABASE_URL` as is
- ✅ Keep `SUPABASE_ANON_KEY` as is
- ✅ Keep `SUPABASE_SERVICE_ROLE_KEY` as is
- ✅ Keep `FRONTEND_URL` as is (unless using different port)

## ⚛️ Frontend Configuration

### File Location
`frontend/.env`

### How to Create
```bash
cd frontend
copy .env.example .env
# Mac/Linux: cp .env.example .env
```

### Required Configuration

```env
# ============================================
# SUPABASE SETTINGS
# ✅ SAME FOR ALL TEAM MEMBERS - DO NOT CHANGE
# ============================================
VITE_SUPABASE_URL=https://kprmqdikdrbmjayxzszk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwcm1xZGlrZHJibWpheXh6c3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzODY5NjEsImV4cCI6MjA4Njk2Mjk2MX0.qf0SZl_4-91O0lydaeICzhMkzcl-d_u_aA9bykolqNI

# ============================================
# BACKEND API URL
# ============================================
VITE_API_URL=http://localhost:8000/api
```

### What to Change

| Setting | What to Put | Example |
|---------|-------------|---------|
| `VITE_API_URL` | Backend URL + /api | `http://localhost:8000/api` |

### What NOT to Change

- ✅ Keep `VITE_SUPABASE_URL` as is
- ✅ Keep `VITE_SUPABASE_ANON_KEY` as is

## 🔍 Common Configurations

### Using XAMPP (Most Common)

**Backend .env**:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=event_management
DB_USERNAME=root
DB_PASSWORD=              # Leave empty
```

### Using MySQL Workbench

**Backend .env**:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=event_management
DB_USERNAME=root
DB_PASSWORD=your_password  # Your MySQL password
```

### Using Different Ports

If port 8000 or 5173 is already in use:

**Backend** (using port 8001):
```bash
php artisan serve --port=8001
```

**Backend .env**:
```env
APP_URL=http://localhost:8001
```

**Frontend .env**:
```env
VITE_API_URL=http://localhost:8001/api
```

**Frontend** (using port 5174):
```bash
npm run dev -- --port=5174
```

## ⚠️ Important Notes

### Security

1. **Never commit .env files to Git**
   - Already in `.gitignore`
   - Contains sensitive information

2. **Each team member has their own .env**
   - Database passwords may differ
   - APP_KEY will be different

3. **Supabase keys are shared**
   - Same for all team members
   - Already in .env.example
   - Safe to share within team

### Troubleshooting

#### "APP_KEY not set"
```bash
cd backend
php artisan key:generate
```

#### "Database connection failed"
1. Check MySQL is running
2. Check database name exists
3. Check username/password in .env
4. Try: `php artisan config:clear`

#### "Supabase connection failed"
1. Check SUPABASE_URL is correct
2. Check SUPABASE_ANON_KEY is correct
3. Check internet connection
4. Verify keys match exactly (no extra spaces)

#### "CORS error" in frontend
1. Check FRONTEND_URL in backend .env
2. Check VITE_API_URL in frontend .env
3. Restart both servers

## 📋 Verification Checklist

### Backend .env
- [ ] File exists at `backend/.env`
- [ ] APP_KEY is generated (not empty)
- [ ] Database settings are correct
- [ ] Supabase URL and keys are set
- [ ] No syntax errors (no extra quotes, spaces)

### Frontend .env
- [ ] File exists at `frontend/.env`
- [ ] Supabase URL and key are set
- [ ] API URL points to backend
- [ ] No syntax errors

### Test Configuration
```bash
# Test backend
cd backend
php artisan config:clear
php artisan serve

# Test frontend (new terminal)
cd frontend
npm run dev

# Test API connection
# Open: http://localhost:8000/api/auth/supabase/status
# Should show: {"configured":true}
```

## 🎯 Quick Setup Commands

### Complete Backend Setup
```bash
cd backend
copy .env.example .env
php artisan key:generate
# Edit .env with your database password
php artisan migrate
php artisan serve
```

### Complete Frontend Setup
```bash
cd frontend
copy .env.example .env
# .env should already have correct values
npm run dev
```

## 📞 Need Help?

### Common Questions

**Q: Do I need to change Supabase keys?**
A: No! Keep them as they are in .env.example

**Q: What if my MySQL password is different?**
A: Update `DB_PASSWORD` in backend/.env with your password

**Q: Can I use a different database name?**
A: Yes, but update `DB_DATABASE` in backend/.env and create that database

**Q: What if ports are already in use?**
A: Use different ports (see "Using Different Ports" section above)

**Q: Should I commit .env files?**
A: NO! Never commit .env files. They're in .gitignore

## 📚 Reference

### Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `APP_KEY` | Encryption key | Auto-generated |
| `APP_URL` | Backend URL | http://localhost:8000 |
| `DB_*` | Database connection | MySQL settings |
| `SUPABASE_*` | Supabase connection | API keys |
| `VITE_*` | Frontend variables | Exposed to browser |

### File Locations

```
project/
├── backend/
│   ├── .env              ← Backend configuration
│   └── .env.example      ← Template (committed to git)
│
└── frontend/
    ├── .env              ← Frontend configuration
    └── .env.example      ← Template (committed to git)
```

---

**Remember**: 
- ✅ Copy from .env.example
- ✅ Update database settings
- ✅ Keep Supabase settings as is
- ❌ Never commit .env files
- ❌ Never share .env files publicly

**Questions?** Check TEAM_INSTALLATION_GUIDE.md or ask your team lead!
