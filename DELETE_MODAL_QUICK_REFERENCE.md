# Delete Confirmation Modal - Quick Reference

## 🚀 Quick Start

### Import
```javascript
import ConfirmDeleteModal from './ConfirmDeleteModal';
```

### State Setup
```javascript
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [eventToDelete, setEventToDelete] = useState(null);
```

### Trigger Modal
```javascript
<button onClick={() => {
  setEventToDelete(event);
  setShowDeleteConfirm(true);
}}>
  Delete
</button>
```

### Render Modal
```javascript
<ConfirmDeleteModal
  isOpen={showDeleteConfirm}
  onClose={() => {
    setShowDeleteConfirm(false);
    setEventToDelete(null);
  }}
  onConfirm={() => {
    deleteEvent(eventToDelete);
    setShowDeleteConfirm(false);
    setEventToDelete(null);
  }}
  eventTitle={eventToDelete?.title}
  eventType="Event"
/>
```

## 📋 Props Reference

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | ✅ Yes | Controls modal visibility |
| `onClose` | function | ✅ Yes | Called when user cancels |
| `onConfirm` | function | ✅ Yes | Called when user confirms |
| `eventTitle` | string | ❌ No | Event title to display |
| `eventType` | string | ❌ No | 'Event', 'Meeting', or 'Personal Event' |

## 🎨 Event Types

```javascript
// Regular Event
eventType="Event"
// Result: "Delete Event?" / "Delete Event" button

// Meeting
eventType="Meeting"
// Result: "Delete Meeting?" / "Delete Meeting" button

// Personal Event
eventType="Personal Event"
// Result: "Delete Personal Event?" / "Delete Personal Event" button
```

## 🎯 Common Patterns

### Basic Usage
```javascript
<ConfirmDeleteModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleDelete}
  eventTitle="Team Meeting"
  eventType="Meeting"
/>
```

### With Event Object
```javascript
<ConfirmDeleteModal
  isOpen={showModal}
  onClose={handleClose}
  onConfirm={() => deleteEvent(event.id)}
  eventTitle={event.title || event.name}
  eventType={event.event_type === 'meeting' ? 'Meeting' : 'Event'}
/>
```

### With State Cleanup
```javascript
onClose={() => {
  setShowDeleteConfirm(false);
  setEventToDelete(null);
}}
onConfirm={() => {
  if (eventToDelete) {
    deleteEvent(eventToDelete);
    setShowDeleteConfirm(false);
    setEventToDelete(null);
  }
}}
```

## 🔄 State Flow

```
Initial State:
  showDeleteConfirm: false
  eventToDelete: null

User Clicks Delete:
  setEventToDelete(event)
  setShowDeleteConfirm(true)

User Cancels:
  setShowDeleteConfirm(false)
  setEventToDelete(null)

User Confirms:
  deleteEvent(eventToDelete)
  setShowDeleteConfirm(false)
  setEventToDelete(null)
```

## 🎨 Customization

### Change Colors
```javascript
// In ConfirmDeleteModal.jsx
className="bg-red-50"  →  className="bg-blue-50"
className="text-red-600"  →  className="text-blue-600"
```

### Change Messages
```javascript
// In ConfirmDeleteModal.jsx
"This action cannot be undone"  →  "Your custom message"
```

### Change Animation
```javascript
// In tailwind.config.js
'fadeIn': 'fadeIn 0.2s ease-in-out'  →  'fadeIn 0.3s ease-out'
```

## 🐛 Troubleshooting

### Modal Not Showing
```javascript
// Check state
console.log('isOpen:', showDeleteConfirm);
console.log('eventToDelete:', eventToDelete);

// Verify z-index
className="z-[60]"  // Should be higher than other modals
```

### Double Confirmation
```javascript
// Remove window.confirm() from handler
// Before:
if (window.confirm('Delete?')) {
  deleteEvent();
}

// After:
setEventToDelete(event);
setShowDeleteConfirm(true);
```

### Event Title Not Showing
```javascript
// Check event object
eventTitle={eventToDelete?.title || eventToDelete?.name || '(No title)'}
```

### Modal Not Closing
```javascript
// Ensure onClose is called
onClose={() => {
  setShowDeleteConfirm(false);  // Must set to false
  setEventToDelete(null);       // Clean up
}}
```

## 📱 Responsive Classes

```javascript
// Modal container
className="max-w-md w-full"  // Desktop: 448px, Mobile: 100%

// Padding
className="p-4"  // Responsive padding

// Buttons
className="flex gap-3"  // Horizontal layout with gap
```

## 🎭 Animation Classes

```javascript
// Modal entrance
className="animate-fadeIn"

// Defined in tailwind.config.js:
animation: {
  'fadeIn': 'fadeIn 0.2s ease-in-out',
}
keyframes: {
  fadeIn: {
    '0%': { opacity: '0', transform: 'scale(0.95)' },
    '100%': { opacity: '1', transform: 'scale(1)' },
  },
}
```

## 🔐 Security Notes

- ✅ Modal only shows for authorized users
- ✅ Backend still validates delete requests
- ✅ No security changes from original implementation
- ✅ State properly managed to prevent issues

## 📊 Performance Tips

- ✅ Modal only renders when `isOpen={true}`
- ✅ Use `useState` for local state
- ✅ Clean up state after close
- ✅ Avoid unnecessary re-renders

## 🎯 Best Practices

### Do's
- ✅ Clean up state after modal closes
- ✅ Show event title for confirmation
- ✅ Use appropriate event type
- ✅ Handle errors gracefully
- ✅ Provide clear messaging

### Don'ts
- ❌ Don't use window.confirm() alongside modal
- ❌ Don't forget to clean up state
- ❌ Don't skip error handling
- ❌ Don't hardcode event details
- ❌ Don't ignore accessibility

## 🧪 Testing Checklist

- [ ] Modal opens on delete click
- [ ] Modal closes on cancel
- [ ] Modal closes on confirm
- [ ] Event deletes on confirm
- [ ] Event title displays correctly
- [ ] Event type displays correctly
- [ ] No double confirmation
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Animation smooth

## 📚 Related Files

### Component
- `frontend/src/components/ConfirmDeleteModal.jsx`

### Usage
- `frontend/src/components/Calendar.jsx`
- `frontend/src/pages/Dashboard.jsx`

### Config
- `frontend/tailwind.config.js`

### Documentation
- `CUSTOM_DELETE_CONFIRMATION_MODAL.md`
- `DELETE_MODAL_VISUAL_GUIDE.md`
- `DELETE_MODAL_IMPLEMENTATION_SUMMARY.md`

## 🔗 Quick Links

### Code Examples
```javascript
// See Calendar.jsx lines 10-12 for state setup
// See Calendar.jsx lines 495-505 for trigger
// See Calendar.jsx lines 620-635 for modal render
```

### Styling
```javascript
// See ConfirmDeleteModal.jsx for all styles
// See tailwind.config.js for animations
```

## 💡 Pro Tips

1. **Always clean up state** after modal closes
2. **Use optional chaining** for event properties
3. **Provide fallback text** for missing titles
4. **Test on mobile** devices
5. **Check z-index** if modal hidden behind other elements

## 🎓 Common Use Cases

### Delete Event
```javascript
eventType="Event"
```

### Delete Meeting
```javascript
eventType="Meeting"
```

### Delete Personal Event
```javascript
eventType="Personal Event"
```

### Delete with Custom Message
```javascript
// Modify ConfirmDeleteModal.jsx
<p className="text-sm text-gray-600 mt-3">
  {customMessage || defaultMessage}
</p>
```

---

**Quick Reference Version:** 1.0.0
**Last Updated:** March 10, 2026
**Status:** ✅ Production Ready
