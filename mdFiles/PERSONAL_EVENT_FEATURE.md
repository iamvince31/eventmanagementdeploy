# Personal Event Feature Implementation

## Summary
Implemented a personal event feature that allows all users to create private events visible only to themselves. Personal events are displayed in purple on the calendar and appear in the calendar legend.

## Features

### Personal Events
- **Private**: Only visible to the creator
- **Purple Color**: All personal events are purple (#8b5cf6)
- **Simple Form**: Title, description, date, and time
- **No Invitations**: Personal events are for the user only
- **Calendar Integration**: Appears on calendar with purple dots
- **Legend Entry**: Shows in calendar legend as "Personal Event"

### Available for All Roles
- Faculty Members
- Coordinators
- Chairpersons
- Deans
- Admins

## Changes Made

### Database Changes

#### Migration: `2026_03_04_000000_add_personal_event_fields_to_events_table.php`
Added two new fields to the events table:
- `is_personal` (boolean, default: false) - Marks event as personal
- `personal_color` (string, nullable) - Stores hex color code (#RRGGBB)

### Backend Changes

#### 1. PersonalEventController.php (NEW)
**Location:** `backend/app/Http/Controllers/PersonalEventController.php`

**Methods:**
- `store()` - Create a new personal event with purple color (#8b5cf6)
- `update()` - Update an existing personal event (owner only)
- `destroy()` - Delete a personal event (owner only)

**Features:**
- Automatically sets purple color for all personal events
- Ensures only the owner can modify/delete their personal events
- Sets `is_personal` flag and `personal_color` to #8b5cf6
- Sets location to "Personal" by default

#### 2. Event Model Updates
**Location:** `backend/app/Models/Event.php`

**Added to fillable:**
- `is_personal`
- `personal_color`

**Added to casts:**
- `is_personal` => 'boolean'

#### 3. EventController Updates
**Location:** `backend/app/Http/Controllers/EventController.php`

**index() method:**
- Filters out personal events from other users
- Only shows personal events to their creator
- Includes `is_personal` and `personal_color` in event transformation

**Query logic:**
```php
->where(function ($query) use ($user) {
    $query->where('is_personal', false)
        ->orWhere(function ($q) use ($user) {
            $q->where('is_personal', true)
              ->where('host_id', $user->id);
        });
})
```

#### 4. API Routes
**Location:** `backend/routes/api.php`

**Added routes:**
```php
Route::post('/personal-events', [PersonalEventController::class, 'store']);
Route::put('/personal-events/{event}', [PersonalEventController::class, 'update']);
Route::delete('/personal-events/{event}', [PersonalEventController::class, 'destroy']);
```

### Frontend Changes

#### 1. PersonalEvent.jsx (NEW)
**Location:** `frontend/src/pages/PersonalEvent.jsx`

**Features:**
- Clean, simple form for personal events
- No color selection needed (automatically purple)
- Sunday restriction (no events on Sundays)
- Success/error messages
- Redirects to dashboard after creation

#### 2. App.jsx Updates
**Location:** `frontend/src/App.jsx`

**Added:**
- Import for PersonalEvent component
- Route: `/personal-event` (protected, all authenticated users)
- Updated `/request-event` route to only allow Faculty Members

```javascript
<Route path="/personal-event" element={
  <ProtectedRoute>
    <PersonalEvent />
  </ProtectedRoute>
} />
```

#### 3. Dashboard.jsx Updates
**Location:** `frontend/src/pages/Dashboard.jsx`

**Added "Personal Event" button for all roles:**

**Faculty Members:**
- Request Event button (primary)
- Personal Event button (secondary)

**Other Roles (Coordinator, Chairperson, Dean, Admin):**
- Add Event button (primary)
- Personal Event button (secondary)

**Button styling:**
- Primary buttons: Green gradient background
- Personal Event button: White background with green border

#### 4. Calendar.jsx Updates
**Location:** `frontend/src/components/Calendar.jsx`

**Event Dot Rendering:**
- Personal events display with purple color (bg-purple-500)
- Tooltip shows "(Personal)" for personal events
- Falls back to red (hosting) or green (invited) for regular events

**Legend Addition:**
- Added "Personal Event" entry with purple box
- Appears alongside "Academic Event", "Hosting", and "Invited"

**Code:**
```javascript
const isPersonal = event.is_personal;

<div
  className={`w-2 h-2 rounded-full ${
    isPersonal
      ? 'bg-purple-500'
      : isHosted 
        ? 'bg-red-500' 
        : 'bg-green-500'
  }`}
  title={`${event.title} ${isPersonal ? '(Personal)' : isHosted ? '(Hosting)' : '(Invited)'}`}
/>
```

**Legend:**
```javascript
<div className="flex items-center gap-1.5">
  <div className="w-3 h-3 rounded bg-purple-500"></div>
  <span className="text-gray-600 font-medium">Personal Event</span>
</div>
```

## User Experience

### Creating a Personal Event

1. Click "Personal Event" button on Dashboard
2. Fill in the form:
   - Title (required)
   - Description (optional)
   - Date (required, no Sundays)
   - Time (required)
3. Click "Create Personal Event"
4. Event is automatically created with purple color
5. Redirected to Dashboard with success message

### Viewing Personal Events

- Personal events appear on the calendar with purple dots
- Only the creator can see their personal events
- Hover over the purple dot to see the title and "(Personal)" label
- Click the date to see full event details
- Purple box in calendar legend identifies personal events

### Privacy

- Personal events are completely private
- Not visible to other users, even admins
- Cannot be shared or have members
- Only the creator can view, edit, or delete

## Color System

Personal events use a fixed purple color:
- Color: #8b5cf6 (Purple)
- Automatically applied to all personal events
- Appears as purple dots on calendar
- Shown in calendar legend

## Technical Details

### Database Schema
```sql
ALTER TABLE events ADD COLUMN is_personal BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN personal_color VARCHAR(7) NULL;
```

### API Endpoints

**POST /api/personal-events**
- Creates a new personal event
- Body: { title, description, date, time, color }
- Returns: Created event with host data

**PUT /api/personal-events/{event}**
- Updates a personal event
- Only owner can update
- Body: { title?, description?, date?, time?, color? }
- Returns: Updated event

**DELETE /api/personal-events/{event}**
- Deletes a personal event
- Only owner can delete
- Returns: Success message

### Security

- Personal events are filtered at the database level
- Only the creator can see their personal events
- Update/delete operations verify ownership
- No way to share or expose personal events to others

## Testing Recommendations

1. **Create Personal Event:**
   - ✓ All roles can access /personal-event
   - ✓ Form validation works
   - ✓ Color selection works
   - ✓ Sunday restriction works
   - ✓ Event appears on calendar with correct color

2. **Privacy:**
   - ✓ Personal events not visible to other users
   - ✓ Personal events not in event lists for others
   - ✓ Cannot access other users' personal events via API

3. **Calendar Display:**
   - ✓ Personal events show with custom color
   - ✓ Tooltip shows "(Personal)" label
   - ✓ Multiple personal events with different colors work

4. **Edit/Delete:**
   - ✓ Only owner can edit personal events
   - ✓ Only owner can delete personal events
   - ✓ Unauthorized access returns 403

## Files Created
- `frontend/src/pages/PersonalEvent.jsx`
- `backend/app/Http/Controllers/PersonalEventController.php`
- `backend/database/migrations/2026_03_04_000000_add_personal_event_fields_to_events_table.php`

## Files Modified
- `frontend/src/App.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/components/Calendar.jsx`
- `backend/app/Models/Event.php`
- `backend/app/Http/Controllers/EventController.php`
- `backend/routes/api.php`

## Date
March 4, 2026
