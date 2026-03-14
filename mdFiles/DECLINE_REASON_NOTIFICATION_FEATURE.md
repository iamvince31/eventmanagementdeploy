# Decline Reason Notification Feature

## Summary
Implemented a decline reason messaging system integrated directly into the existing notification bell. When users decline event invitations, they provide a reason that is sent to the event host and appears as a notification.

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

#### Enhanced NotificationBell Component
- `frontend/src/components/NotificationBell.jsx`
- Features:
  - Fetches and displays decline reason messages alongside event invitations
  - Combined notification count (invitations + unread messages)
  - Visual distinction between invitations (green) and decline messages (red)
  - Unread indicator (red dot) for new messages
  - Click to view full message in modal popup
  - Mark as read automatically when viewing
  - Delete message functionality

#### Decline Reason Modal (in Dashboard)
- Added to `Dashboard.jsx`
- Features:
  - Text area for entering decline reason (max 1000 characters)
  - Character counter
  - Send & Decline button
  - Cancel button
  - Validation (requires reason before sending)

#### Message Detail Modal
- Popup modal showing full decline reason
- Displays:
  - Sender information with avatar
  - Event details (title, date)
  - Full decline reason message
  - Timestamp
  - Delete button

### 3. User Flow

1. **User receives event invitation** → Shows in notification bell with green icon
2. **User clicks "Decline" button** → Opens decline reason modal
3. **User enters reason** → Types explanation (required, max 1000 chars)
4. **User clicks "Send & Decline"** → 
   - Event status changes to "declined"
   - Message sent to event host
   - Modal closes
5. **Host sees notification** →
   - Red notification badge increases
   - Decline message appears in notification dropdown with red icon
   - Shows sender name, event title, and preview of reason
6. **Host clicks message** → 
   - Opens detailed modal with full reason
   - Message automatically marked as read
   - Red dot disappears
7. **Host can delete message** → Click delete button in modal

## Visual Design

### Notification Bell
- **Badge**: Red circle with total count (invitations + messages)
- **Dropdown**: 
  - Header shows breakdown: "X invitations, Y messages"
  - Event invitations: Green icon, yellow "Pending" badge
  - Decline messages: Red icon, red "Declined" badge
  - Unread messages: Light red background + red dot

### Message Detail Modal
- **Sender**: Avatar with gradient (red theme), name, email
- **Event**: Red-tinted info box with event title and date
- **Reason**: White box with full message text
- **Actions**: Close (gray) and Delete (red) buttons

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
- **Event Invitations**: Green (#green-100 bg, #green-600 icon)
- **Decline Messages**: Red (#red-100 bg, #red-600 icon)
- **Unread Messages**: Light red background (#red-50/30)
- **Unread Indicator**: Red dot (#red-500)
- **Notification Badge**: Red (#red-500)

## Files Modified/Created

### Backend
- ✅ `backend/database/migrations/2026_02_24_005803_create_messages_table.php` (created)
- ✅ `backend/app/Models/Message.php` (created)
- ✅ `backend/app/Http/Controllers/MessageController.php` (created)
- ✅ `backend/routes/api.php` (modified - added message routes)

### Frontend
- ✅ `frontend/src/components/NotificationBell.jsx` (modified - integrated messages)
- ✅ `frontend/src/pages/Dashboard.jsx` (modified - added decline modal, removed messages nav)
- ✅ `frontend/src/App.jsx` (modified - removed messages route)
- ❌ `frontend/src/pages/Messages.jsx` (deleted - no longer needed)

## Advantages Over Separate Messages Page

1. **Better UX**: Users don't need to navigate to a separate page
2. **Immediate visibility**: Decline reasons appear right in the notification bell
3. **Unified notifications**: All notifications in one place
4. **Less navigation**: One click to view message details
5. **Cleaner navbar**: No extra menu item needed
6. **Consistent with notification pattern**: Follows existing UI patterns

## Usage

### For Users Declining Events:
1. Go to Dashboard
2. Click on an event you're invited to
3. Click "Decline" button
4. Enter your reason in the modal (required)
5. Click "Send & Decline"

### For Hosts Viewing Decline Reasons:
1. See red notification badge on bell icon
2. Click notification bell
3. See decline messages with red icon and "Declined" badge
4. Click message to view full details in popup
5. Message automatically marked as read
6. Click "Delete Message" to remove

## Future Enhancements (Optional)
- Real-time notifications using WebSockets
- Email notifications for new decline messages
- Reply functionality
- Message categories/types beyond decline reasons
- Archive instead of delete
- Notification sound/desktop notifications

---
**Date**: February 24, 2026
**Status**: Complete and functional
**Integration**: Fully integrated with existing notification system
