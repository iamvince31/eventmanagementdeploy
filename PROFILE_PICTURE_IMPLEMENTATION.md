# Profile Picture Upload Implementation

## Overview
Implemented profile picture upload functionality that allows users to upload their profile picture from the Account Settings page. The profile picture is then displayed in the navbar instead of the first letter icon.

## Changes Made

### Backend Changes

1. **Database Migration** (`backend/database/migrations/2026_03_02_000000_add_profile_picture_to_users_table.php`)
   - Added `profile_picture` column to users table (nullable string)

2. **User Model** (`backend/app/Models/User.php`)
   - Added `profile_picture` to `$fillable` array

3. **UserController** (`backend/app/Http/Controllers/UserController.php`)
   - Updated `update()` method to handle profile picture uploads
   - Validates image files (jpeg, png, jpg, gif, max 2MB)
   - Stores uploaded files in `public/uploads/profiles/` directory
   - Deletes old profile picture when new one is uploaded
   - Returns full URL of profile picture in API response

4. **AuthController** (`backend/app/Http/Controllers/AuthController.php`)
   - Updated login response to include `profile_picture` URL

5. **File Storage**
   - Created `backend/public/uploads/profiles/` directory for storing profile pictures
   - Added `.gitkeep` file to track the directory in git

### Frontend Changes

1. **AccountDashboard Component** (`frontend/src/pages/AccountDashboard.jsx`)
   - Added state for profile picture file and preview:
     - `profilePicture`: stores the selected file
     - `profilePicturePreview`: stores preview URL
   
   - Added `handleProfilePictureChange()` function to handle file selection and preview
   
   - Updated `handleSaveChanges()` to:
     - Use FormData for multipart/form-data submission
     - Include profile picture file in the request
     - Update user context with new profile picture URL
   
   - Updated profile display section:
     - Shows profile picture if available, otherwise shows initial circle
     - Added camera icon button for uploading new picture
     - Shows file format and size requirements
   
   - Updated navbar avatar:
     - Shows profile picture if available
     - Falls back to initial circle if no picture

2. **Dashboard Component** (`frontend/src/pages/Dashboard.jsx`)
   - Updated navbar avatar to show profile picture if available
   - Falls back to initial circle if no picture

3. **All Other Pages with Navbar**
   - Updated `RequestEvent.jsx` - navbar avatar
   - Updated `History.jsx` - navbar avatar
   - Updated `AddEvent.jsx` - navbar avatar
   - Updated `EventRequests.jsx` - navbar avatar
   - Updated `DefaultEvents.jsx` - navbar avatar
   - Updated `Admin.jsx` - navbar avatar
   - All pages now show profile picture in navbar if available

## Features

- Upload profile pictures (JPG, PNG, GIF, max 2MB)
- Real-time preview before saving
- Profile picture displayed in navbar across all pages
- Automatic deletion of old profile picture when uploading new one
- Graceful fallback to initial circle if no picture uploaded

## API Endpoints

### Update Profile (with picture)
```
POST /api/user/profile
Content-Type: multipart/form-data

Body:
- username: string
- email: string
- department: string
- profile_picture: file (optional)

Response:
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "username": "John Doe",
    "email": "john@cvsu.edu.ph",
    "department": "Department of IT",
    "profile_picture": "http://localhost:8000/uploads/profiles/profile_1_1234567890.jpg",
    "role": "Faculty Member",
    "is_validated": true,
    "schedule_initialized": true
  }
}
```

## File Structure
```
backend/
├── public/
│   └── uploads/
│       └── profiles/
│           ├── .gitkeep
│           └── profile_1_1234567890.jpg (uploaded files)
├── database/
│   └── migrations/
│       └── 2026_03_02_000000_add_profile_picture_to_users_table.php
└── app/
    ├── Models/
    │   └── User.php (updated)
    └── Http/
        └── Controllers/
            ├── UserController.php (updated)
            └── AuthController.php (updated)

frontend/
└── src/
    └── pages/
        ├── AccountDashboard.jsx (updated - upload & display)
        ├── Dashboard.jsx (updated - navbar avatar)
        ├── RequestEvent.jsx (updated - navbar avatar)
        ├── History.jsx (updated - navbar avatar)
        ├── AddEvent.jsx (updated - navbar avatar)
        ├── EventRequests.jsx (updated - navbar avatar)
        ├── DefaultEvents.jsx (updated - navbar avatar)
        └── Admin.jsx (updated - navbar avatar)
```

## Testing

1. Run the migration:
   ```bash
   cd backend
   php artisan migrate
   ```

2. Test the upload:
   - Navigate to Account Settings
   - Click "Edit Profile"
   - Click the camera icon on the profile picture
   - Select an image file
   - See the preview update
   - Click "Save Changes"
   - Verify the profile picture appears in the navbar

## Notes

- Profile pictures are stored with format: `profile_{user_id}_{timestamp}.{extension}`
- Old profile pictures are automatically deleted when uploading a new one
- The system gracefully handles missing profile pictures by showing the initial circle
- Maximum file size is 2MB
- Supported formats: JPEG, PNG, JPG, GIF
