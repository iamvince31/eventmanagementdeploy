# "Failed to Fetch" Error - Troubleshooting Guide

## What "Failed to Fetch" Means

This error occurs when the frontend cannot connect to the backend API. It's a network/connection issue, not a code issue.

## Quick Fix Steps

### 1. Check if Backend Server is Running

Open a terminal and run:
```bash
cd backend
php artisan serve
```

The server should start on `http://localhost:8000` or `http://127.0.0.1:8000`

**Look for this output:**
```
Starting Laravel development server: http://127.0.0.1:8000
```

### 2. Check if Frontend is Running

Open another terminal and run:
```bash
cd frontend
npm run dev
```

The frontend should start on `http://localhost:5173`

### 3. Verify Both Servers Are Running

You should have TWO terminal windows open:
- Terminal 1: Backend running on port 8000
- Terminal 2: Frontend running on port 5173

### 4. Test the Connection

Open the test file I created:
```
file:///[your-project-path]/test-api-connection.html
```

Or simply open `test-api-connection.html` in your browser.

Follow the instructions:
1. Login to your app first
2. Get your token from browser console: `localStorage.getItem('token')`
3. Paste it in the test page
4. Click "Test Backend Server"
5. Click "Test Schedule Fetch"
6. Click "Test Schedule Save"

## Common Issues & Solutions

### Issue 1: Backend Not Running
**Symptom:** "Cannot connect to backend" error

**Solution:**
```bash
cd backend
php artisan serve
```

Keep this terminal open!

### Issue 2: Wrong Port
**Symptom:** Connection refused or timeout

**Check:** Is backend running on port 8000?
```bash
# Windows
netstat -ano | findstr :8000

# Should show something like:
# TCP    0.0.0.0:8000    0.0.0.0:0    LISTENING
```

**Solution:** Make sure backend is on port 8000 and frontend expects port 8000

### Issue 3: CORS Error
**Symptom:** "CORS policy" error in browser console

**Solution:** Backend CORS is already configured for localhost:5173. Make sure:
- Frontend is running on port 5173
- Backend CORS config includes your frontend URL

Check `backend/config/cors.php` - it should have:
```php
'allowed_origins' => [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
],
```

### Issue 4: Invalid Token
**Symptom:** 401 Unauthorized error

**Solution:**
1. Logout and login again
2. Get fresh token from localStorage
3. Try saving schedule again

### Issue 5: Database Not Running
**Symptom:** Backend crashes or 500 error

**Solution:**
1. Start MySQL/MariaDB (XAMPP Control Panel)
2. Check database credentials in `backend/.env`
3. Run migrations: `php artisan migrate`

### Issue 6: Validation Error
**Symptom:** 422 Unprocessable Entity

**Solution:** I fixed the validation rules. The schedule data should be:
```json
{
  "schedule": {
    "Monday": [
      {
        "id": 123456789,
        "startTime": "09:00",
        "endTime": "10:00",
        "description": "Class Name"
      }
    ],
    "Tuesday": [],
    ...
  }
}
```

Times must be in 24-hour format: "09:00", "14:30", etc.

## Step-by-Step Debugging

### Step 1: Open Browser DevTools (F12)

Go to Console tab and look for errors.

### Step 2: Go to Network Tab

1. Try saving schedule
2. Look for the POST request to `/api/schedules`
3. Check:
   - Status code (should be 200)
   - Request payload (the data being sent)
   - Response (the error message)

### Step 3: Check Backend Logs

Open `backend/storage/logs/laravel.log` and look for recent errors.

The log will show:
- User ID
- Error message
- Full stack trace

### Step 4: Test with Simple Data

Try saving just ONE class on Monday:
1. Click "Edit Schedule"
2. Select Monday
3. Add ONE class: 9:00 AM - 10:00 AM
4. Click "Save Schedule"
5. Check browser console for errors

## What I Fixed

1. **Removed strict validation** that was causing 422 errors
2. **Added better error messages** that show exactly what's wrong
3. **Added error logging** to Laravel logs
4. **Fixed User model** to properly handle schedule_initialized field

## Next Steps

1. **Start both servers** (backend and frontend)
2. **Open the test page** (test-api-connection.html)
3. **Test the connection** step by step
4. **Share the error** you see in the test results

The test page will tell you exactly what's wrong:
- ✓ Backend running? 
- ✓ Authentication working?
- ✓ Schedule fetch working?
- ✓ Schedule save working?

Once you run the tests, share the results and I can help further!
