# Backend Status Check

## The "Failed to Fetch" error means the browser cannot connect to the backend server.

This is NOT a code error - it's a connection problem.

## Step 1: Is the Backend Server Running?

Open a NEW terminal/command prompt and run:

```bash
cd backend
php artisan serve
```

**IMPORTANT:** Keep this terminal window open! Don't close it!

You should see:
```
Laravel development server started: http://127.0.0.1:8000
```

## Step 2: Test Backend Directly

Open your browser and go to:
```
http://localhost:8000
```

You should see the Laravel welcome page.

## Step 3: Test the API Endpoint

Open your browser and go to:
```
http://localhost:8000/api/user
```

You should see either:
- A JSON response (if you have a valid session)
- OR "Unauthenticated" error (which is fine - it means the API is working)

## Step 4: Check Browser Console

1. Open your application in the browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Try to save the schedule
5. Look for the EXACT error message

Common errors:

### "Failed to fetch"
- Backend server is not running
- Backend is on wrong port
- Firewall blocking connection

### "CORS policy"
- Backend is running but CORS is blocking
- Frontend URL not in allowed origins

### "401 Unauthorized"
- Backend is working
- Token is invalid or expired
- Need to login again

### "422 Unprocessable Entity"
- Backend is working
- Data validation failed
- Check the error message for details

### "500 Internal Server Error"
- Backend is working but crashed
- Check Laravel logs: `backend/storage/logs/laravel.log`

## Step 5: Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Try to save schedule
4. Look for the POST request to `schedules`
5. Click on it to see:
   - Request headers
   - Request payload (data being sent)
   - Response (error details)

## Quick Test Commands

### Check if port 8000 is in use:
```bash
# Windows
netstat -ano | findstr :8000
```

If nothing shows up, the backend is NOT running.

### Start backend server:
```bash
cd backend
php artisan serve
```

### Check Laravel logs:
```bash
# Windows
type backend\storage\logs\laravel.log
```

Look for recent errors (today's date).

## Most Likely Issue

Based on "failed to fetch", the backend server is probably not running.

**Solution:**
1. Open a terminal
2. Navigate to backend folder: `cd backend`
3. Start the server: `php artisan serve`
4. Keep the terminal open
5. Try saving schedule again

## If Backend Won't Start

Check for errors when running `php artisan serve`:

### Error: "Address already in use"
Another process is using port 8000.

**Solution:**
```bash
php artisan serve --port=8001
```

Then update frontend to use port 8001.

### Error: Database connection failed
MySQL is not running.

**Solution:**
1. Start XAMPP
2. Start MySQL service
3. Try again

### Error: Class not found
Autoload needs to be regenerated.

**Solution:**
```bash
cd backend
composer dump-autoload
php artisan serve
```

## After Backend is Running

1. You should see the terminal showing:
   ```
   Laravel development server started: http://127.0.0.1:8000
   ```

2. Try saving schedule again

3. You should see requests in the terminal:
   ```
   [timestamp] POST /api/schedules ........................... 200 OK
   ```

4. If you see 500 error, check `backend/storage/logs/laravel.log`

## Need More Help?

Share:
1. The EXACT error message from browser console
2. What you see when you run `php artisan serve`
3. What you see when you visit `http://localhost:8000` in browser
4. Screenshot of Network tab showing the failed request
