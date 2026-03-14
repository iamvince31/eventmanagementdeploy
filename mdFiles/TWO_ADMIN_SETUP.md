# Two Admin Account Setup

## Overview

The bootstrap admin system now allows you to create **2 permanent admin accounts** before the bootstrap admin is automatically removed.

## How It Works

### Step 1: Login as Bootstrap Admin
```
Email: admin@cvsu.edu.ph
Password: SetupAdmin2024!
```

### Step 2: Create First Admin
1. Click "Create Permanent Admin" button
2. Fill in the form:
   - Name: Admin One
   - Email: admin1@cvsu.edu.ph
   - Department: Administration
   - Password: Your11111111
3. Submit

**Result**: 
- ✅ First admin created
- ✅ Bootstrap admin still active
- ✅ Message: "You can create 1 more admin before bootstrap is removed"
- ✅ Modal closes, you stay logged in

### Step 3: Create Second Admin
1. Click "Create Permanent Admin" button again
2. Fill in the form:
   - Name: Admin Two
   - Email: admin2@cvsu.edu.ph
   - Department: Administration
   - Password: YourPassword456
3. Submit

**Result**:
- ✅ Second admin created
- ✅ Bootstrap admin automatically deleted
- ✅ Message: "You now have 2 admins. Bootstrap admin will be removed"
- ✅ Redirected to login page after 2 seconds

### Step 4: Login with Permanent Admin
Use either of your newly created admin accounts:
```
Email: admin1@cvsu.edu.ph or admin2@cvsu.edu.ph
Password: (your chosen password)
```

## Key Features

### 1. Progressive Creation
- Create first admin → Bootstrap stays active
- Create second admin → Bootstrap removed automatically

### 2. Clear Feedback
- After 1st admin: "You can create 1 more admin"
- After 2nd admin: "Bootstrap admin will be removed"

### 3. Smart Redirect
- After 1st admin: Stay logged in, modal closes
- After 2nd admin: Redirect to login (bootstrap removed)

### 4. Audit Logging
```php
// After 1st admin
'permanent_admin_count' => 1,
'bootstrap_will_be_removed' => false

// After 2nd admin
'permanent_admin_count' => 2,
'bootstrap_will_be_removed' => true
```

## Testing

### Reset for Testing
```bash
cd backend
reset-bootstrap-admin.bat
```

Or manually:
```bash
php artisan tinker --execute="App\Models\User::where('role', 'admin')->delete();"
php artisan db:seed --class=AdminSeeder
```

### Test Scenario 1: Create 1 Admin
```
1. Login as bootstrap admin
2. Create 1 permanent admin
3. Verify: Bootstrap admin still exists
4. Verify: Can still access admin panel
5. Verify: Button still visible
```

### Test Scenario 2: Create 2 Admins
```
1. Login as bootstrap admin
2. Create 1st permanent admin
3. Create 2nd permanent admin
4. Verify: Redirected to login
5. Verify: Bootstrap admin deleted
6. Login with permanent admin
```

### Test Scenario 3: Check Database
```bash
php artisan tinker

# After 1st admin
>>> User::where('role', 'admin')->count()
=> 2  // 1 bootstrap + 1 permanent

# After 2nd admin
>>> User::where('role', 'admin')->count()
=> 2  // 2 permanent (bootstrap removed)

>>> User::where('is_bootstrap', true)->count()
=> 0  // Bootstrap removed
```

## Technical Details

### UserObserver Logic
```php
// Only remove bootstrap if we have 2+ permanent admins
$permanentAdminCount = User::where('role', 'admin')
    ->where('is_bootstrap', false)
    ->count();

if ($permanentAdminCount >= 2) {
    $this->removeBootstrapAdmins($user);
}
```

### Controller Response
```json
{
  "message": "Admin created successfully!",
  "admin": { ... },
  "permanent_admin_count": 1,
  "bootstrap_removed": false
}
```

After 2nd admin:
```json
{
  "message": "You now have 2 admins. Bootstrap admin will be removed",
  "admin": { ... },
  "permanent_admin_count": 2,
  "bootstrap_removed": true
}
```

### Frontend Logic
```javascript
const shouldLogout = response.data.bootstrap_removed || false;

if (shouldLogout) {
  // Redirect to login (bootstrap removed)
  window.location.href = '/login';
} else {
  // Stay logged in, close modal
  onClose();
}
```

## Why 2 Admins?

### Redundancy
- If one admin loses access, another can help
- No single point of failure

### Best Practice
- Multiple admins for production systems
- Backup admin for emergencies

### Security
- Bootstrap admin removed only after 2 permanent admins
- Ensures system always has admin access

## Troubleshooting

### Issue: Bootstrap not removed after 2nd admin
**Check:**
```bash
php artisan tinker
>>> User::where('role', 'admin')->where('is_bootstrap', false)->count()
```

**Solution:** Ensure UserObserver is registered:
```php
// app/Providers/AppServiceProvider.php
User::observe(UserObserver::class);
```

### Issue: Want to change threshold
**Edit UserObserver.php:**
```php
// Change from 2 to your desired number
if ($permanentAdminCount >= 2) {  // Change this number
    $this->removeBootstrapAdmins($user);
}
```

### Issue: Want to test with 1 admin removal
**Temporarily change threshold to 1:**
```php
if ($permanentAdminCount >= 1) {
    $this->removeBootstrapAdmins($user);
}
```

## Summary

✅ Bootstrap admin can create 2 permanent admins
✅ Bootstrap removed automatically after 2nd admin
✅ Clear feedback at each step
✅ Smart redirect behavior
✅ Full audit logging
✅ Easy to test and reset

This ensures your system always has at least 2 permanent admins before the bootstrap admin is removed!
