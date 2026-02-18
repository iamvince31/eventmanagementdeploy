# System Cleanup - Remove Unused Files and Features

## Files to DELETE (Root Directory)

### Unused API Files
- ❌ `api.php` - Old API file, not used (Laravel backend is used)
- ❌ `api-laravel.php` - Duplicate/old file
- ❌ `app.js` - Not used
- ❌ `index.php` - Not used
- ❌ `style.css` - Not used
- ❌ `update-colors.js` - One-time script, no longer needed

### Data Folder (Old JSON files - not used with Laravel)
- ❌ `data/availability.json` - Not used (using database)
- ❌ `data/events.json` - Not used (using database)
- ❌ `data/members.json` - Not used (using database)
- ❌ `data/users.json` - Not used (using database)
- ❌ **DELETE ENTIRE `data/` FOLDER**

## Backend - Unused Features

### Controllers to DELETE
- ❌ `backend/app/Http/Controllers/AvailabilityController.php` - Feature not implemented in frontend

### Routes to REMOVE from `backend/routes/api.php`
Remove these lines:
```php
use App\Http\Controllers\AvailabilityController;

// Availability
Route::get('/availabilities', [AvailabilityController::class, 'index']);
Route::post('/availabilities', [AvailabilityController::class, 'store']);
```

Also remove this route (not used):
```php
Route::get('/events/{event}/users/{user}/availability', [EventController::class, 'availability']);
```

### Database Tables - Unused
Check if these tables exist and are unused:
- `cache` table - Used by Laravel, KEEP
- `jobs` table - Used by Laravel queue system, KEEP if using queues, otherwise can remove
- No availability-related tables found (good!)

## Documentation Files - Keep or Archive

### Keep (Active Documentation)
- ✅ `HOW_TO_RUN.txt`
- ✅ `START.bat`
- ✅ `TEAMMATE_SETUP_GUIDE.txt`
- ✅ `SYSTEM_REQUIREMENTS_SPECIFICATION.md`

### Archive or Delete (Implementation Notes - No Longer Needed)
- ❌ `ADD_LOGO_GUIDE.md` - Implementation done
- ❌ `AUTH_PAGES_BACKGROUND_SUMMARY.md` - Implementation done
- ❌ `BACKGROUND_CONSISTENCY_UPDATE.md` - Implementation done
- ❌ `CALENDAR_YEAR_RESTRICTION.md` - Implementation done
- ❌ `CLASS_SCHEDULE_REQUIREMENT.md` - Implementation done
- ❌ `COLOR_SCHEME_UPDATE.md` - Implementation done
- ❌ `DASHBOARD_SCHEDULE_RESTRICTION.md` - Implementation done
- ❌ `EMPTY_SCHEDULE_SUPPORT.md` - Implementation done
- ❌ `FINAL_COLOR_UPDATE.md` - Implementation done
- ❌ `FORGOT_PASSWORD_SETUP.md` - Implementation done
- ❌ `FRONTEND_LOCKOUT_IMPROVEMENT.md` - Implementation done
- ❌ `IMAGE_UPLOAD_IMPROVEMENTS.md` - Implementation done
- ❌ `IMPLEMENT_SECURITY.md` - Implementation done
- ❌ `LOGIN_BACKGROUND_SLIDESHOW.md` - Implementation done
- ❌ `LOGIN_LIMITER_FIX.md` - Implementation done
- ❌ `LOGIN_LIMITER_GUIDE.md` - Keep for reference
- ❌ `PENTEST_GUIDE.md` - Keep for security testing
- ❌ `PER_EMAIL_LOCKOUT_TEST.md` - Implementation done
- ❌ `QUICK_TEST_LOGIN_LIMITER.md` - Implementation done
- ❌ `SCHEDULE_POPUP_FIX.md` - Implementation done
- ❌ `SCHEDULE_REQUIRED_MODAL.md` - Implementation done
- ❌ `SCHEDULE_SAVE_DEBUG.md` - Debugging doc, can delete
- ❌ `SCHEDULE_UI_IMPROVEMENTS.md` - Implementation done
- ❌ `SECURITY_ENHANCEMENTS.md` - Keep for reference
- ❌ `functional_requirements.md` - Keep for reference

## Pages - All Currently Used ✅

All pages in `frontend/src/pages/` are connected and used:
- ✅ Login.jsx
- ✅ Register.jsx
- ✅ ForgotPassword.jsx
- ✅ ResetPassword.jsx
- ✅ Dashboard.jsx
- ✅ AccountDashboard.jsx
- ✅ AddEvent.jsx

## Batch Files

### Keep
- ✅ `START.bat` - Main startup script
- ✅ `RUN_MIGRATIONS.bat` - Useful for database setup
- ✅ `RESET_AND_SETUP.bat` - Useful for fresh setup

### Can Delete
- ❌ `CHECK_MIGRATIONS.bat` - Rarely used
- ❌ `setup-database.bat` - Duplicate functionality
- ❌ `test-login-limiter.bat` - Testing script
- ❌ `test-security.bat` - Testing script

## Summary of Deletions

### High Priority (Delete Now)
1. `data/` folder (entire folder)
2. `api.php`
3. `api-laravel.php`
4. `app.js`
5. `index.php`
6. `style.css`
7. `update-colors.js`
8. `backend/app/Http/Controllers/AvailabilityController.php`

### Medium Priority (Archive or Delete)
- All implementation note markdown files (20+ files)
- Test batch files

### Keep
- Core documentation (HOW_TO_RUN, TEAMMATE_SETUP_GUIDE, SYSTEM_REQUIREMENTS_SPECIFICATION)
- Security guides (PENTEST_GUIDE, SECURITY_ENHANCEMENTS, LOGIN_LIMITER_GUIDE)
- Main batch files (START, RUN_MIGRATIONS, RESET_AND_SETUP)
