# MySQL Frozen - Emergency Fix

## The Problem
MySQL is completely frozen and not responding. This is why:
- `php artisan migrate` hangs forever
- phpMyAdmin shows "Maximum execution time exceeded"
- All database operations timeout after 120 seconds

## SOLUTION: Force Kill and Restart MySQL

### Method 1: Using Task Manager (Easiest)

1. **Press Ctrl+Shift+Esc** to open Task Manager
2. **Click "Details" tab**
3. **Find `mysqld.exe`** in the list
4. **Right-click on `mysqld.exe`** → Select **"End Task"**
5. **Confirm** when asked
6. **Open XAMPP Control Panel**
7. **Click "Start"** next to MySQL
8. **Wait for green "Running" status**
9. **Try your command again:**
   ```bash
   cd backend
   php artisan migrate
   ```

### Method 2: Using Command Line

1. **Open Command Prompt as Administrator**
2. **Run:**
   ```bash
   taskkill /F /IM mysqld.exe
   ```
3. **Open XAMPP Control Panel**
4. **Click "Start"** next to MySQL
5. **Try your command again**

### Method 3: Using the Batch File

1. **Run the emergency fix script:**
   ```bash
   FORCE_RESTART_MYSQL.bat
   ```
2. **Follow the on-screen instructions**

## After Restarting MySQL

Once MySQL is running again:

```bash
cd backend

# Clear Laravel cache
php artisan config:clear
php artisan cache:clear

# Create database if needed
# (Open http://localhost/phpmyadmin and create 'event_management' database)

# Run migrations
php artisan migrate
```

## Why This Happened

MySQL can freeze due to:
- **Corrupted table locks** - A query got stuck and locked tables
- **Memory issues** - MySQL ran out of memory
- **Disk I/O problems** - Hard drive is slow or full
- **Too many connections** - Connection pool exhausted
- **Improper shutdown** - XAMPP was force-closed previously

## Prevent This in the Future

1. **Always stop services properly** in XAMPP before closing
2. **Don't force-close XAMPP** (use Stop buttons)
3. **Restart MySQL weekly** if you use it heavily
4. **Check disk space** - ensure you have at least 1GB free
5. **Monitor MySQL logs** at `C:\xampp\mysql\data\*.err`

## Alternative: Use SQLite for Development

If MySQL keeps freezing, switch to SQLite temporarily:

1. **Edit `backend/.env`:**
   ```env
   DB_CONNECTION=sqlite
   DB_DATABASE=database/database.sqlite
   ```

2. **Comment out MySQL settings:**
   ```env
   # DB_HOST=127.0.0.1
   # DB_PORT=3306
   # DB_USERNAME=root
   # DB_PASSWORD=
   ```

3. **Create SQLite file:**
   ```bash
   cd backend
   type nul > database\database.sqlite
   ```

4. **Run migrations:**
   ```bash
   php artisan config:clear
   php artisan migrate
   ```

SQLite is faster for development and doesn't have these freezing issues.

## Check MySQL Error Logs

If this keeps happening, check the error log:

```
C:\xampp\mysql\data\[YOUR-COMPUTER-NAME].err
```

Look for errors like:
- "Out of memory"
- "Table is marked as crashed"
- "Too many connections"
- "Disk full"

## Still Not Working?

If MySQL won't start after killing the process:

1. **Check if port 3306 is in use:**
   ```bash
   netstat -ano | findstr :3306
   ```

2. **If another process is using it:**
   - Note the PID (last column)
   - Find that PID in Task Manager → Details
   - End that process
   - Start MySQL again

3. **Or change MySQL port:**
   - Edit `C:\xampp\mysql\bin\my.ini`
   - Change `port=3306` to `port=3307`
   - Update `backend/.env`: `DB_PORT=3307`
   - Start MySQL

## Quick Recovery Steps

```bash
# 1. Kill MySQL
taskkill /F /IM mysqld.exe

# 2. Start MySQL in XAMPP Control Panel

# 3. Clear Laravel cache
cd backend
php artisan config:clear

# 4. Test connection
php test-db-connection.php

# 5. Run migrations
php artisan migrate
```
