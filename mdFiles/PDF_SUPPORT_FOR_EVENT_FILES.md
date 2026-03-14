# PDF Support for Event Files

## Summary
Extended the event file upload functionality to accept PDF documents in addition to images. Users can now upload up to 5 files (images or PDFs) per event, with a maximum size of 5MB per file.

## Changes Made

### 1. Frontend - EventForm Component

#### File Upload Validation
- **Accepted file types**: JPG, PNG, GIF, WebP, PDF
- **Maximum file size**: Increased from 2MB to 5MB (to accommodate PDFs)
- **Maximum files**: 5 files per event
- **Updated validation messages**: Changed from "images" to "files" terminology

#### File Preview Handling
- **Images**: Display as thumbnail previews (existing behavior)
- **PDFs**: Display with red PDF icon and "PDF" label
- **Preview structure**: Changed from simple URL strings to objects with `type` and `url`/`name` properties

#### Visual Updates
- Section title changed from "Event Images" to "Event Files"
- Help text updated: "(Max 5 files, 5MB each - Images & PDFs)"
- PDF preview shows red-themed icon in 128x128px box
- Consistent styling with image previews

### 2. Frontend - Dashboard Component

#### Event Details Modal
- **File carousel**: Now handles both images and PDFs
- **PDF display**: Shows PDF icon with "Open PDF" button
- **PDF button**: Opens PDF in new tab when clicked
- **Thumbnail strip**: PDFs show red PDF icon instead of image preview
- **Navigation**: Works seamlessly between images and PDFs

#### Visual Design
- PDF main view: Red-themed with document icon and "Open PDF" button
- PDF thumbnails: Red background with document icon
- Maintains green theme for selected file border
- Responsive and accessible design

### 3. Backend - EventController

#### Validation Rules (store method)
```php
'images.*' => 'file|mimes:jpeg,jpg,png,gif,webp,pdf|max:5120'
```
- Changed from `image` to `file` validator
- Added `pdf` to allowed MIME types
- Increased max size from 2048KB (2MB) to 5120KB (5MB)

#### MIME Type Validation
```php
$allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
```

#### Error Messages
- Updated to use "file" instead of "image" terminology
- Clear messaging for file type and size restrictions

#### Validation Rules (update method)
- Same changes applied to the update method
- Consistent validation across create and update operations

## Technical Details

### File Type Detection
- **Frontend**: Checks `file.type` property
- **Backend**: Uses `getMimeType()` method
- **PDF MIME type**: `application/pdf`

### File Storage
- PDFs stored in same location as images: `storage/app/public/events/`
- Laravel's `store()` method handles both images and PDFs
- File paths stored in `event_images` table (despite table name, it stores all file types)

### Preview Generation
```javascript
// Image preview
{ type: 'image', url: 'data:image/jpeg;base64,...' }

// PDF preview
{ type: 'pdf', name: 'document.pdf' }
```

### Display Logic
```javascript
// Check if file is PDF
getFixedImageUrl(file).toLowerCase().endsWith('.pdf')
```

## User Experience

### Uploading Files
1. Click "Add" button or drag & drop files
2. Select images (JPG, PNG, GIF, WebP) or PDFs
3. See instant preview:
   - Images: Thumbnail preview
   - PDFs: Red PDF icon with label
4. Remove files by hovering and clicking X button
5. Upload up to 5 files total (any combination)

### Viewing Files in Event Details
1. Open event details modal
2. Navigate through files using carousel
3. For images: View full-size preview
4. For PDFs: See PDF icon and click "Open PDF" button
5. PDF opens in new browser tab
6. Use thumbnail strip to quickly switch between files

## File Specifications

| Property | Value |
|----------|-------|
| Accepted Images | JPG, JPEG, PNG, GIF, WebP |
| Accepted Documents | PDF |
| Maximum File Size | 5MB |
| Maximum Files per Event | 5 |
| Storage Location | `storage/app/public/events/` |

## Visual Design

### PDF Preview (Upload)
- 128x128px square
- Red background (#red-50)
- Red border (#red-200)
- Red document icon
- "PDF" label

### PDF Display (Event Details)
- Full carousel view (w-full h-64)
- Red background (#red-50)
- Large document icon (w-20 h-20)
- "PDF Document" label
- "Open PDF" button (red theme)

### PDF Thumbnail
- 64x64px square
- Red background (#red-50)
- Red document icon
- Green border when selected

## Browser Compatibility
- PDF viewing requires browser with PDF support
- Opens in new tab using `target="_blank"`
- Falls back to browser's default PDF handler
- Works on all modern browsers (Chrome, Firefox, Safari, Edge)

## Security Considerations
- File type validation on both frontend and backend
- MIME type checking prevents malicious file uploads
- File size limits prevent storage abuse
- PDFs opened in new tab (sandboxed)
- `rel="noopener noreferrer"` for security

## Files Modified

### Frontend
- ✅ `frontend/src/components/EventForm.jsx`
  - Updated file validation (accept PDFs, 5MB limit)
  - Modified preview generation for PDFs
  - Updated UI text and labels
  
- ✅ `frontend/src/pages/Dashboard.jsx`
  - Updated carousel to handle PDFs
  - Added PDF display with "Open PDF" button
  - Updated thumbnail rendering for PDFs

### Backend
- ✅ `backend/app/Http/Controllers/EventController.php`
  - Updated validation rules (store method)
  - Updated validation rules (update method)
  - Added PDF to allowed MIME types
  - Increased file size limit to 5MB

## Future Enhancements (Optional)
- PDF preview/thumbnail generation
- In-browser PDF viewer (using PDF.js)
- File type icons for other document types
- Download button for PDFs
- File name display in carousel
- Multiple file type support (Word, Excel, etc.)

---
**Date**: February 24, 2026
**Status**: Complete and functional
**Compatibility**: All modern browsers with PDF support
