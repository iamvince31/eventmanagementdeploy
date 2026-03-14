# Bootstrap Admin System - Implementation Guide

## Overview

This system implements a **secure, temporary bootstrap admin account** that:
- ✅ Creates automatically only if no admin exists
- ✅ Uses credentials from `.env` (not hardcoded)
- ✅ **Automatically deletes itself** when a real admin is created
- ✅ Leaves NO permanent backdoor
- ✅ Follows Laravel best practices

---

## How It Works

### 1. **Initial Setup**
When you run `php artisan db:seed`, the `AdminSeeder` checks:
- Is there any user with `role = 'admin'`?
- If **NO**, it creates a bootstrap admin using `.env` credentials
- If **YES**, it skips creation

### 2. **Bootstrap Admin Properties**
```php
[
    'name' => env('BOOTSTRAP_ADMIN_NAME'),
    'email' => env('BOOTSTRAP_ADMIN_EMAIL'),
    'password' => Hash::make(env('BOOTSTRAP_ADMIN_PASSWORD')),
    'role' => 'admin',
    'is_bootstrap' => true,  // ← Marks this as temporary
    'email_verified_at' => now(),
]
```

### 3. **Automatic Removal**
When a **real admin** is created (via registration or role update):
- The `UserObserver` detects the new admin
- It finds all users where `is_bootstrap = true`
- It **deletes them permanently**
- All their tokens are revoked

---

## Files Created/Modified

### ✅ New Files
1. **Migration**: `database/migrations/2026_02_24_011644_add_is_bootstrap_to_users_table.php`
   - Adds `is_bootstrap` boolean column to `users` table

2. **Seeder**: `database/seeders/AdminSeeder.php`
   - Creates bootstrap admin if no admin exists
   - Validates `.env` credentials

3. **Observer**: `app/Observers/UserObserver.php`
   - Monitors when new admins are created
   - Auto-removes bootstrap admins

### ✅ Modified Files
1. **User Model**: `app/Models/User.php`
   - Added `is_bootstrap` to `$fillable`
   - Added `is_bootstrap` to `$casts`

2. **AppServiceProvider**: `app/Providers/AppServiceProvider.php`
   - Registered `UserObserver`

3. **DatabaseSeeder**: `database/seeders/DatabaseSeeder.php`
   - Calls `AdminSeeder`

4. **Environment Files**: `.env` and `.env.example`
   - Added bootstrap admin credentials

---

## Configuration (.env)

Add these to your `.env` file:

```env
# Bootstrap Admin Configuration
BOOTSTRAP_ADMIN_NAME="Setup Admin"
BOOTSTRAP_ADMIN_EMAIL=admin@cvsu.edu.ph
BOOTSTRAP_ADMIN_PASSWORD=SetupAdmin2024!
```

### Security Notes:
- ⚠️ **Change the password** before deploying
- ⚠️ Use a **strong password** (min 12 characters)
- ⚠️ The email must match your domain pattern (e.g., `@cvsu.edu.ph`)
- ✅ Password is **always hashed** with `Hash::make()`

---

## Usage

### Step 1: Run Migrations
```bash
cd backend
php artisan migrate
```

### Step 2: Seed Bootstrap Admin
```bash
php artisan db:seed --class=AdminSeeder
```

**Output:**
```
Bootstrap admin created successfully!
⚠️  This is a TEMPORARY admin account for initial setup.
⚠️  It will be automatically removed when you create a real admin.
```

### Step 3: Login with Bootstrap Admin
- **Email**: `admin@cvsu.edu.ph` (from `.env`)
- **Password**: `SetupAdmin2024!` (from `.env`)

### Step 4: Create a Real Admin
Option A: **Register a new user** and change their role to `admin` in the database
Option B: **Update an existing user's role** to `admin`

```sql
-- Example: Make user with ID 5 an admin
UPDATE users SET role = 'admin' WHERE id = 5;
```

### Step 5: Bootstrap Admin Auto-Removed ✅
The moment you create/update a real admin:
- Bootstrap admin is **deleted from database**
- All bootstrap admin tokens are **revoked**
- System logs the removal

---

## Security Features

### ✅ 1. No Hardcoded Credentials
All credentials come from `.env`:
```php
$name = env('BOOTSTRAP_ADMIN_NAME');
$email = env('BOOTSTRAP_ADMIN_EMAIL');
$password = env('BOOTSTRAP_ADMIN_PASSWORD');
```

### ✅ 2. Password Always Hashed
```php
'password' => Hash::make($password)
```

### ✅ 3. Automatic Removal
The `UserObserver` ensures bootstrap admins are deleted when real admins exist:
```php
public function created(User $user): void
{
    if ($user->role === 'admin' && !$user->is_bootstrap) {
        $this->removeBootstrapAdmins($user);
    }
}
```

### ✅ 4. Token Revocation
Before deletion, all tokens are revoked:
```php
$bootstrapAdmin->tokens()->delete();
$bootstrapAdmin->delete();
```

### ✅ 5. Validation
- Email format validated
- Checks if admin already exists
- Prevents duplicate bootstrap admins

### ✅ 6. Audit Logging
All actions are logged:
```php
Log::info('Bootstrap admin created', ['email' => $email]);
Log::info('Removing bootstrap admin', ['bootstrap_admin_id' => $id]);
```

---

## Testing the System

### Test 1: Bootstrap Admin Creation
```bash
# Clear database
php artisan migrate:fresh

# Seed bootstrap admin
php artisan db:seed --class=AdminSeeder

# Check database
php artisan tinker
>>> User::where('is_bootstrap', true)->count()
=> 1
```

### Test 2: Automatic Removal
```bash
# Create a real admin
php artisan tinker
>>> $user = User::find(2);
>>> $user->role = 'admin';
>>> $user->save();

# Check bootstrap admin is gone
>>> User::where('is_bootstrap', true)->count()
=> 0
```

### Test 3: Seeder Skips if Admin Exists
```bash
# Run seeder again
php artisan db:seed --class=AdminSeeder

# Output: "Admin user already exists. Skipping bootstrap admin creation."
```

---

## Why This Approach is Secure

### 1. **Temporary by Design**
- Bootstrap admin has `is_bootstrap = true`
- Automatically deleted when real admin exists
- No manual cleanup needed

### 2. **No Permanent Backdoor**
- Once deleted, cannot be recreated (admin already exists)
- Seeder checks for existing admins first
- Observer ensures cleanup happens automatically

### 3. **Environment-Based**
- Credentials in `.env` (not version controlled)
- Different credentials per environment
- Easy to change without code changes

### 4. **Audit Trail**
- All actions logged with timestamps
- Can track when bootstrap admin was created/removed
- Includes triggering admin's information

### 5. **Laravel Best Practices**
- Uses Eloquent ORM
- Uses Observers (event-driven)
- Uses Seeders (database initialization)
- Uses Hash facade (secure password hashing)
- Uses Log facade (centralized logging)

---

## Troubleshooting

### Issue: "Bootstrap admin credentials not set in .env"
**Solution**: Add the credentials to `.env`:
```env
BOOTSTRAP_ADMIN_NAME="Setup Admin"
BOOTSTRAP_ADMIN_EMAIL=admin@cvsu.edu.ph
BOOTSTRAP_ADMIN_PASSWORD=YourStrong11111111!
```

### Issue: "Invalid bootstrap admin email format"
**Solution**: Ensure email matches your validation pattern (e.g., `@cvsu.edu.ph`)

### Issue: Bootstrap admin not removed
**Solution**: Check if `UserObserver` is registered in `AppServiceProvider`:
```php
User::observe(UserObserver::class);
```

### Issue: Want to manually remove bootstrap admin
```bash
php artisan tinker
>>> User::where('is_bootstrap', true)->delete();
```

---

## Alternative Approach: One-Time Setup Route

If you prefer a **web-based setup** instead of seeder:

### Create Setup Controller
```php
// app/Http/Controllers/SetupController.php
public function createBootstrapAdmin(Request $request)
{
    // Check if any admin exists
    if (User::where('role', 'admin')->exists()) {
        return response()->json(['message' => 'Admin already exists'], 403);
    }

    // Validate request
    $validated = $request->validate([
        'name' => 'required|string',
        'email' => 'required|email|unique:users',
        'password' => 'required|min:8|confirmed',
    ]);

    // Create bootstrap admin
    $admin = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
        'role' => 'admin',
        'is_bootstrap' => true,
        'email_verified_at' => now(),
    ]);

    return response()->json(['message' => 'Bootstrap admin created']);
}
```

### Add Route
```php
// routes/web.php
Route::post('/setup/admin', [SetupController::class, 'createBootstrapAdmin'])
    ->middleware('guest');
```

**Note**: This approach requires frontend implementation and is less automated than the seeder approach.

---

## Conclusion

This bootstrap admin system provides:
- ✅ **Secure** initial access
- ✅ **Automatic** cleanup
- ✅ **No backdoors**
- ✅ **Laravel best practices**
- ✅ **Full audit trail**

The bootstrap admin exists **only during initial setup** and is **automatically removed** when you create your first real admin account.
