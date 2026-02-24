# Decline Reason Messaging Feature

## Summary
Implemented a complete messaging system that allows users to provide a reason when declining event invitations. The host receives these decline reasons as messages.

## Features Implemented

### 1. Database & Backend

#### Messages Table Migration
- Created `messages` table with fields:
  - `sender_id` - User who sent the message
  - `recipient_id` - User who receives the message
  - `event_id` - Related event (nullable)
  - `type` - Message type (decline_reason, general, etc.)
  - `message` - The actual message content
  - `is_read` - Read status (boolean)
  - `timestamps` - Created/updated timestamps

#### Message Model
- `backend/app/Models/Message.php`
- Relationships: sender, recipient, event
- Fillable fields and casts configured

#### Message Controller
- `backend/app/Http/Controllers/MessageController.php`
- Endpoints:
  - `GET /api/messages` - Get all messages for authenticated user
  - `POST /api/messages` - Send a new message
  - `POST /api/messages/{id}/read` - Mark message as read
  - `GET /api/messages/unread-count` - Get unread message count
  - `DELETE /api/messages/{id}` - Delete a message

### 2. Frontend Components

#### Messages Page
- `frontend/src/pages/Messages.jsx`
- Features:
  - List all received messages
  - Display sender info with avatar
  - Show related event details
  - Mark messages as read on click
  - Delete messages
  - Visual indicators for unread messages (green dot, highlighted background)
  - Empty state when no messages
  - Responsive design with green theme
  - Navbar with back to dashboard button

#### Decline Reason Modal
- Added to `Dashboard.jsx`
- Features:
  - Text area for entering decline reason (max 1000 characters)
  - Character counter
  - Send & Decline button
  - Cancel button
  - Validation (requires reason before sending)

### 3. Navigation

#### Navbar Updates
- Added Messages icon button in Dashboard navbar
- Positioned between Home and Notifications
- Mail envelope icon
- Navigates to `/messages` route

#### Routing
- Added `/messages` protected route in `App.jsx`
- Requires authentication to access

### 4. User Flow

1. **User receives event invitation**
2. **User clicks "Decline" button** → Opens decline reason modal
3. **User enters reason** → Types explanation (required)
4. **User clicks "Send & Decline"** → 
   - Event status changes to "declined"
   - Message sent to event host
   - Modal closes
5. **Host receives message** →
   - Appears in Messages page
   - Shows as unread (green highlight + dot)
   - Includes event details and decline reason
6. **Host reads message** → Click to mark as read
7. **Host can delete message** → Click delete button

## Technical Details

### API Endpoints
```
GET    /api/messages                 - List messages
POST   /api/messages                 - Send message
POST   /api/messages/{id}/read       - Mark as read
GET    /api/messages/unread-count    - Get unread count
DELETE /api/messages/{id}            - Delete message
```

### Message Structure
```json
{
  "id": 1,
  "sender_id": 2,
  "recipient_id": 1,
  "event_id": 5,
  "type": "decline_reason",
  "message": "I have a conflicting appointment",
  "is_read": false,
  "created_at": "2026-02-24T00:00:00.000000Z",
  "sender": { "id": 2, "name": "John Doe", "email": "john@cvsu.edu.ph" },
  "event": { "id": 5, "title": "Team Meeting", "date": "2026-03-01" }
}
```

### Color Scheme
- Primary: Green (matching app theme)
- Unread messages: Light green background (#green-50/30)
- Decline badge: Red (#red-100 background, #red-700 text)
- Unread indicator: Green dot (#green-500)

## Files Modified/Created

### Backend
- ✅ `backend/database/migrations/2026_02_24_005803_create_messages_table.php` (created)
- ✅ `backend/app/Models/Message.php` (created)
- ✅ `backend/app/Http/Controllers/MessageController.php` (created)
- ✅ `backend/routes/api.php` (modified - added message routes)

### Frontend
- ✅ `frontend/src/pages/Messages.jsx` (created)
- ✅ `frontend/src/pages/Dashboard.jsx` (modified - added decline modal & messages nav button)
- ✅ `frontend/src/App.jsx` (modified - added messages route)

## Usage

### For Users Declining Events:
1. Go to Dashboard
2. Click on an event you're invited to
3. Click "Decline" button
4. Enter your reason in the modal
5. Click "Send & Decline"

### For Hosts Viewing Decline Reasons:
1. Click Messages icon in navbar (mail envelope)
2. View all decline reasons and messages
3. Click message to mark as read
4. Click delete icon to remove message

## Future Enhancements (Optional)
- Real-time notifications using WebSockets
- Message threading/conversations
- Reply functionality
- Message search/filter
- Unread count badge on Messages icon
- Email notifications for new messages
- Message categories/types beyond decline reasons

---
**Date**: February 24, 2026
**Status**: Complete and functional
