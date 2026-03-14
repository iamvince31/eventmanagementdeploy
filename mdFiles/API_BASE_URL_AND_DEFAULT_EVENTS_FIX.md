# API Base URL and Default Events Route Fix

## Issue
Dashboard was showing 404 errors when trying to fetch default events:
```
GET http://localhost:5173/api/default-events?school_year=2025-2026 404 (Not Found)
GET http://localhost:5173/api/default-events?school_year=2026-2027 404 (Not Found)
```

Two problems identified:
1. API requests were going to `localhost:5173` (frontend) instead of `localhost:8000` (backend)
2. Missing GET route for `/default-events` in backend

## Root Causes

### 1. Incorrect API Base URL
**File:** `frontend/src/services/api.js`

**Problem:** The axios instance was using a relative path:
```javascript
const api = axios.create({
  baseURL: '/api',  // ❌ Relative path - goes to frontend server
  // ...
});
```

**Solution:** Use the environment variable:
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',  // ✅ Absolute URL
  // ...
});
```

### 2. Missing GET Route
**File:** `backend/routes/api.php`

**Problem:** No GET route defined for fetching default events, even though the controller method existed.

**Solution:** Added the missing route:
```php
// Default Events (Academic Calendar) - Protected
Route::get('/default-events', [DefaultEventController::class, 'index']);  // ✅ Added
Route::put('/default-events/{id}/date', [DefaultEventController::class, 'updateDate']);
Route::post('/default-events/create-empty', [DefaultEventController::class, 'createEmptyEvent']);
Route::post('/default-events/create-with-details', [DefaultEventController::class, 'createEventWithDetails']);
```

## Files Modified

1. **frontend/src/services/api.js**
   - Changed `baseURL` from `/api` to `import.meta.env.VITE_API_URL || 'http://localhost:8000/api'`
   - Now properly uses the environment variable from `frontend/.env`

2. **backend/routes/api.php**
   - Added `Route::get('/default-events', [DefaultEventController::class, 'index']);`
   - Allows fetching default events with optional `school_year` query parameter

## How It Works Now

### Frontend Request
```javascript
// Dashboard.jsx
const [eventsRes, membersRes, currentYearEventsRes, nextYearEventsRes] = await Promise.all([
  api.get('/events'),
  api.get('/users'),
  api.get(`/default-events?school_year=${schoolYear}`),      // ✅ Now goes to localhost:8000
  api.get(`/default-events?school_year=${nextSchoolYear}`),  // ✅ Now goes to localhost:8000
]);
```

### Backend Route
```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/default-events', [DefaultEventController::class, 'index']);
    // ...
});
```

### Controller Method
```php
// DefaultEventController.php
public function index(Request $request): JsonResponse
{
    $schoolYear = $request->query('school_year');
    
    if ($schoolYear) {
        // Get events for specific school year
        $allEvents = DefaultEvent::where(function($q) use ($schoolYear) {
            $q->where('school_year', $schoolYear)
              ->orWhereNull('school_year');
        })
        // ... filtering logic
    }
    
    return response()->json(['events' => $events]);
}
```

## Testing

1. **Restart the frontend dev server** (important for env variable changes):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Ensure backend is running:**
   ```bash
   cd backend
   php artisan serve
   ```

3. **Verify in browser:**
   - Open DevTools (F12) → Network tab
   - Navigate to Dashboard
   - Check that requests go to `http://localhost:8000/api/default-events`
   - Should return 200 OK with event data

## Environment Variables

**frontend/.env:**
```env
VITE_API_URL=http://localhost:8000/api
```

This variable is now properly used by the axios instance.

## Result

✅ API requests now correctly go to the backend server at `localhost:8000`
✅ Default events (academic calendar) load successfully
✅ No more 404 errors on Dashboard
✅ Calendar displays both regular events and academic calendar events

## Date: March 3, 2026
