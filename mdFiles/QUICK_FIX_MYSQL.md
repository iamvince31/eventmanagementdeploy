# Quick Fix for MySQL Connection Issue

## The Problem
Your `php artisan migrate` command is hanging because it cannot connect to MySQL.

## Quick Solution (Choose One)

### Option 1: Restart MySQL in XAMPP (Recommended)

1. **Open XAMPP Control Panel**
2. **Stop MySQL** (click Stop button)
3. **Wait 10 seconds**
4. **Start MySQL** (click Start button)
5. **Wait for green "Running" status**
6. **Try again:**
   ```bash
   cd backend
   php artisan migrate
   ```

### Option 2: Use the Diagnostic Tool

1. **Run the diagnostic batch file:**
   ```bash
   cd backend
   fix-mysql-connection.bat
   ```
2. **Follow the instructions** it provides

### Option 3: Create Database Manually

If MySQL is running but database doesn't exist:

1. **Open browser:** http://localhost/phpmyadmin
2. **Click "New"** in left sidebar
3. **Database name:** `event_management`
4. **Collation:** `utf8mb4_unicode_ci`
5. **Click "Create"**
6. **Try migrate again**

### Option 4: Use Command Line to Create Database

1. **Open Command Prompt**
2. **Navigate to XAMPP MySQL:**
   ```bash
   cd C:\xampp\mysql\bin
   ```
3. **Run MySQL client:**
   ```bash
   mysql -u root -p
   ```
   (Press Enter when asked for password if you don't have one)
4. **Create database:**
   ```sql
   CREATE DATABASE event_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```
5. **Try migrate again**

### Option 5: Switch to SQLite (Temporary Solution)

If MySQL keeps having issues, use SQLite for now:

1. **Edit `backend/.env`:**
   ```env
   DB_CONNECTION=sqlite
   # Comment out MySQL settings:
   # DB_HOST=127.0.0.1
   # DB_PORT=3306
   # DB_DATABASE=event_management
   # DB_USERNAME=root
   # DB_PASSWORD=
   ```

2. **Create SQLite database file:**
   ```bash
   cd backend
   type nul > database\database.sqlite
   ```

3. **Clear cache and migrate:**
   ```bash
   php artisan config:clear
   php artisan migrate
   ```

## After Fixing

Once MySQL is working again, run these commands:

```bash
cd backend
php artisan config:clear
php artisan cache:clear
php artisan migrate
php artisan db:seed --class=DefaultEventSeeder
```

## Check if MySQL is Running

Open Task Manager (Ctrl+Shift+Esc) and look for `mysqld.exe` in the Details tab.

- **If you see it:** MySQL is running
- **If you don't see it:** Start MySQL in XAMPP Control Panel

## Still Having Issues?

The most common cause is that MySQL service is frozen. To fix:

1. **Open Task Manager** (Ctrl+Shift+Esc)
2. **Go to Details tab**
3. **Find `mysqld.exe`**
4. **Right-click → End Task**
5. **Open XAMPP Control Panel**
6. **Click Start for MySQL**
7. **Try migrate again**
