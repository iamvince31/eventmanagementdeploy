# How to Start Your Application

## Problem: No data showing on frontend after running migrations

This happens when the required services aren't running. Follow these steps:

## Step 1: Start MySQL Database

1. Open **XAMPP Control Panel**
2. Click **Start** next to **MySQL**
3. Wait until it shows "Running" in green

## Step 2: Verify Database Connection

Run this command to test:
```bash
php backend/test-db-connection.php
```

You should see:
- ✓ Successfully connected to MySQL server!
- ✓ Database 'event_management' exists!
- List of tables

## Step 3: Start Backend Server

Open a terminal in the `backend` folder and run:
```bash
php artisan serve
```

You should see:
```
Server running on [http://127.0.0.1:8000]
```

Keep this terminal open!

## Step 4: Start Frontend Development Server

Open a NEW terminal in the `frontend` folder and run:
```bash
npm run dev
```

You should see:
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

Keep this terminal open too!

## Step 5: Access Your Application

Open your browser and go to:
```
http://localhost:5173
```

## Quick Troubleshooting

### MySQL won't start in XAMPP?
- Check if port 3306 is already in use
- Try stopping and starting again
- Restart XAMPP as Administrator

### Backend shows "Connection refused"?
- MySQL is not running - go back to Step 1

### Frontend shows blank page?
- Check browser console (F12) for errors
- Verify backend is running on port 8000
- Check that `frontend/.env` has: `VITE_API_URL=http://localhost:8000/api`

### Still no data?
1. Make sure you ran migrations: `php artisan migrate`
2. Check if you need to seed data: `php artisan db:seed`
3. Verify API routes work: `php artisan route:list --path=api`

## Common Startup Sequence

Every time you work on this project:

1. ✅ Start XAMPP → Start MySQL
2. ✅ Terminal 1: `cd backend` → `php artisan serve`
3. ✅ Terminal 2: `cd frontend` → `npm run dev`
4. ✅ Open browser: `http://localhost:5173`
