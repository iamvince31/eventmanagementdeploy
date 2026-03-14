# Profile Picture Feature - Quick Setup Guide

## What's New?
Users can now upload profile pictures from the Account Settings page. The profile picture will be displayed in the navbar across all pages instead of the first letter icon.

## Setup Steps

### 1. Run the Database Migration
Double-click the batch file to run the migration:
```
RUN_PROFILE_PICTURE_MIGRATION.bat
```

Or manually run:
```bash
cd backend
C:\xampp\php\php.exe artisan migrate
```

This will add the `profile_picture` column to the `users` table.

### 2. Verify Directory Structure
The migration automatically creates the upload directory:
```
backend/public/uploads/profiles/
```

If it doesn't exist, create it manually.

### 3. Test the Feature

1. Start your backend and frontend servers
2. Login to your account
3. Navigate to Account Settings (click your avatar → Settings)
4. Click "Edit Profile"
5. Click the camera icon on the profile picture
6. Select an image (JPG, PNG, GIF - max 2MB)
7. See the preview update
8. Click "Save Changes"
9. Your profile picture should now appear in the navbar!

## Features

✅ Upload profile pictures (JPG, PNG, GIF, max 2MB)
✅ Real-time preview before saving
✅ Profile picture displayed in navbar on all pages
✅ Automatic deletion of old picture when uploading new one
✅ Graceful fallback to initial circle if no picture

## Pages Updated

All pages now show the profile picture in the navbar:
- Dashboard
- Account Settings
- Add Event
- Request Event
- Event Requests
- Default Events
- History
- Admin Panel

## Troubleshooting

### Profile picture not showing after upload?
- Check if the file was uploaded to `backend/public/uploads/profiles/`
- Verify the URL in the database (should be like `uploads/profiles/profile_1_1234567890.jpg`)
- Clear browser cache and refresh

### Upload fails?
- Check file size (must be under 2MB)
- Check file format (JPG, PNG, GIF only)
- Verify the uploads directory exists and has write permissions

### Old picture not deleted?
- Check file permissions on the uploads directory
- The system automatically deletes old pictures when uploading new ones

## Technical Details

### API Endpoint
```
POST /api/user/profile
Content-Type: multipart/form-data

Body:
- username: string
- email: string
- department: string
- profile_picture: file (optional)
```

### File Naming Convention
Files are stored as: `profile_{user_id}_{timestamp}.{extension}`

Example: `profile_1_1709380800.jpg`

### Database Column
```sql
ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) NULL;
```

## Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Check the Laravel logs in `backend/storage/logs/`
3. Verify XAMPP MySQL is running
4. Ensure the backend server is running on port 8000
