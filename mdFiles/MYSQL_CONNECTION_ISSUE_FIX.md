# MySQL Connection Issue - Troubleshooting Guide

## Problem
`php artisan migrate` command hangs with no response, indicating a database connection timeout.

## Root Cause
The MySQL service is either:
1. Not running
2. Frozen/hung
3. Not accepting connections on port 3306

## Solution Steps

### Step 1: Check MySQL Status in XAMPP

1. Open **XAMPP Control Panel**
2. Look at the **MySQL** row
3. Check if the status shows "Running" (green)

### Step 2: If MySQL is NOT Running

1. Click the **Start** button next to MySQL in XAMPP
2. Wait for it to turn green
3. Try `php artisan migrate` again

### Step 3: If MySQL is Running but Still Hangs

The MySQL service might be frozen. Follow these steps:

#### Option A: Restart MySQL via XAMPP
1. In XAMPP Control Panel, click **Stop** next to MySQL
2. Wait 5-10 seconds
3. Click **Start** again
4. Try `php artisan migrate` again

#### Option B: Force Kill MySQL Process
1. Open **Task Manager** (Ctrl+Shift+Esc)
2. Go to **Details** tab
3. Find `mysqld.exe` process
4. Right-click → **End Task**
5. Go back to XAMPP and click **Start** for MySQL
6. Try `php artisan migrate` again

### Step 4: If Still Not Working - Check Port 3306

Another application might be using port 3306:

1. Open **Command Prompt** as Administrator
2. Run: `netstat -ano | findstr :3306`
3. If you see a process ID (PID), check what's using it:
   - Open Task Manager → Details tab
   - Find the process with that PID
   - If it's not `mysqld.exe`, you need to stop that application

### Step 5: Alternative - Use Different Port

If port 3306 is blocked, configure MySQL to use a different port:

1. Stop MySQL in XAMPP
2. Edit `C:\xampp\mysql\bin\my.ini`
3. Find the line: `port=3306`
4. Change to: `port=3307` (or another free port)
5. Save the file
6. Update `backend/.env`:
   ```
   DB_PORT=3307
   ```
7. Start MySQL in XAMPP
8. Try `php artisan migrate` again

### Step 6: Create Database Manually

If MySQL is running but the database doesn't exist:

1. Open **phpMyAdmin** (http://localhost/phpmyadmin)
2. Click **New** in the left sidebar
3. Database name: `event_management`
4. Collation: `utf8mb4_unicode_ci`
5. Click **Create**
6. Try `php artisan migrate` again

### Step 7: Test Connection Directly

Run this command to test the connection:

```bash
cd backend
php test-db-connection.php
```

This will show you exactly what's wrong with the connection.

### Step 8: Check Laravel Configuration

Verify your `.env` file has correct settings:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=event_management
DB_USERNAME=root
DB_PASSWORD=
```

After changing `.env`, run:
```bash
php artisan config:clear
php artisan cache:clear
```

## Quick Fix Commands

If you just want to get it working quickly:

```bash
# 1. Clear Laravel cache
cd backend
php artisan config:clear
php artisan cache:clear

# 2. Restart MySQL in XAMPP Control Panel

# 3. Create database if it doesn't exist (via phpMyAdmin or command line)

# 4. Try migrate again
php artisan migrate
```

## Common Error Messages

### "SQLSTATE[HY000] [2002] Connection refused"
- MySQL service is not running
- Start MySQL in XAMPP

### "SQLSTATE[HY000] [1049] Unknown database"
- Database doesn't exist
- Create it via phpMyAdmin or command line

### "SQLSTATE[HY000] [2002] Connection timed out"
- MySQL is frozen/hung
- Restart MySQL service

### Command hangs with no output
- MySQL is not responding
- Force kill and restart MySQL

## Prevention

To prevent this issue in the future:

1. Always start MySQL before running Laravel commands
2. Don't force-close XAMPP without stopping services properly
3. Keep XAMPP updated
4. Monitor MySQL error logs at `C:\xampp\mysql\data\*.err`

## Still Not Working?

If none of these steps work:

1. Check MySQL error log: `C:\xampp\mysql\data\[computer-name].err`
2. Try reinstalling XAMPP
3. Use a different database (SQLite for development):
   ```env
   DB_CONNECTION=sqlite
   DB_DATABASE=database/database.sqlite
   ```
   Then create the file:
   ```bash
   touch database/database.sqlite
   php artisan migrate
   ```
