# Login Credentials

## Admin Account
- **Email:** admin@example.com
- **Password:** admin123
- **Role:** Admin
- **Department:** Administration
- **Access:** Full access to admin panel and all features
- **Status:** ✅ Email Verified

## Teacher Account
- **Email:** teacher@example.com
- **Password:** teacher123
- **Role:** Teacher
- **Department:** IT
- **Access:** Standard user features (create events, view calendar, etc.)

---

## Troubleshooting

### Can't Login to Admin Account?

Run this command to reset the admin password:
```bash
cd backend
php artisan admin:reset-password
```

This will reset the admin password to `admin123` and verify the email.

---

## Available Roles

The system supports the following roles:
- **admin** - Full system access, user management
- **dean** - Department head level access
- **chairperson** - Department chair level access
- **program_coordinator** - Program coordinator level access
- **teacher** - Standard faculty member access (default for all new registrations)

**Note:** All new user registrations are automatically assigned the **teacher** role. Only admins can change user roles through the Admin Panel.

---

## How to Use

1. Navigate to the login page
2. Enter the email and password from above
3. Click "Login"

## Admin Features
- Access to `/admin` route
- View all users in a table
- Manage users (view, delete)
- All standard user features
- **Note:** Admin users are NOT shown in member lists and cannot be invited to events

## Teacher Features
- Create and manage events
- View calendar
- Invite members to events
- Accept/decline event invitations
- View personal schedule

---

## Reset Database (if needed)

To reset the database and recreate these accounts:

```bash
cd backend
php artisan migrate:fresh --seed
```

This will drop all tables, recreate them, and seed the default admin and teacher accounts.
