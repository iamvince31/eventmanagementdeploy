# Admin Validation Notifications

## Overview

Admins now receive notifications when new users register and need validation. These notifications appear in the notification bell alongside event invitations and messages. Clicking a notification redirects to the Admin panel with pending users highlighted.

## Implementation

### Backend Changes

1. **UserController** (`backend/app/Http/Controllers/UserController.php`)
   - Added `pendingValidation()` method
   - Returns list of users who:
     - Have `is_validated = false`
     - Have verified their email (`email_verified_at` is not null)
   - Only accessible by Admin users
   - Returns count and user details

2. **Routes** (`backend/routes/api.php`)
   - Added `GET /api/users/pending-validation` endpoint
   - Protected by `auth:sanctum` middleware
   - Admin-only access enforced in controller

### Frontend Changes

1. **NotificationBell Component** (`frontend/src/components/NotificationBell.jsx`)
   - Added `pendingUsers` state to track unvalidated users
   - Added `fetchPendingValidations()` function
   - Fetches pending validations only for Admin users
   - Displays pending users in notification dropdown
   - Clicking a pending user notification navigates to Admin panel with `highlightPending` state
   - Updates notification count to include pending validations

2. **Admin Page** (`frontend/src/pages/Admin.jsx`)
   - Added `showPendingOnly` state for filtering
   - Added `tableRef` for smooth scrolling to user table
   - Added useEffect to handle navigation state from notifications
   - When coming from notification, automatically:
     - Enables "Pending Only" filter
     - Scrolls to user table
   - Added "Pending Only" filter button in search bar
   - Updated filter logic to show only unvalidated users when enabled

## Features

### For Admins

1. **Notification Badge:**
   - Shows total count including pending validations
   - Example: "2 invitations, 1 message, 3 pending validations"

2. **Notification Dropdown:**
   - Displays pending users with blue badge "New User"
   - Shows user's name, email, and registration date
   - Click to navigate to Admin panel with pending filter enabled

3. **Admin Panel Enhancements:**
   - "Pending Only" filter button next to search bar
   - Toggle between showing all users or only pending validations
   - Shows count of pending users when filter is active
   - Smooth scroll to user table when coming from notification
   - Automatic filter activation when clicking notification

4. **Visual Indicators:**
   - Blue icon for user validations in notifications
   - Blue dot indicator for unread status
   - Light blue background for pending user items
   - Active filter button shows blue background with count badge

### For Non-Admin Users

- No changes to their notification experience
- Pending validation notifications are not shown
- API endpoint returns 403 Forbidden if accessed by non-admin

## User Flow

1. **New User Registration:**
   - User registers with CVSU email
   - User verifies email with OTP
   - User appears in admin's notifications

2. **Admin Notification:**
   - Admin sees notification badge increment
   - Admin opens notification dropdown
   - Admin sees "New User" notification with user details

3. **Admin Action:**
   - Admin clicks notification
   - Redirected to Admin panel
   - "Pending Only" filter automatically enabled
   - Page scrolls to user table
   - Admin can validate user and assign role/department

4. **Manual Filter:**
   - Admin can toggle "Pending Only" filter anytime
   - Filter persists until manually toggled off
   - Shows count of pending users in filter button

## API Endpoint

### GET /api/users/pending-validation

**Authentication:** Required (Sanctum token)

**Authorization:** Admin only

**Response:**
```json
{
  "pending_users": [
    {
      "id": 1,
      "username": "John Doe",
      "email": "john.doe@cvsu.edu.ph",
      "department": null,
      "role": "Faculty Member",
      "created_at": "2026-03-02T10:30:00.000000Z"
    }
  ],
  "count": 1
}
```

## Benefits

- Admins are immediately notified of new registrations
- One-click access to pending validations
- Automatic filtering saves time
- Smooth scrolling improves UX
- Manual filter toggle for flexibility
- Streamlined user validation workflow
- Better user experience for new registrants (faster validation)

## Technical Notes

- Notifications are fetched when NotificationBell component mounts
- Only users with verified emails appear in pending validations
- Clicking notification navigates to `/admin` with state `{ highlightPending: true }`
- State is cleared after processing to prevent re-triggering on page refresh
- Filter state is managed locally and can be toggled manually
- Smooth scroll uses `scrollIntoView` with behavior: 'smooth'
- Notification count includes: invitations + messages + pending validations (admin only)
