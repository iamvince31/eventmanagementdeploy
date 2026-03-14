# Event/Meeting Type Implementation

## Overview
Added the ability to distinguish between "Events" and "Meetings" in the event management system with different visual indicators on the calendar.

## Changes Made

### 1. Database Changes
- **Migration**: `2026_03_09_000000_add_event_type_to_events_table.php`
  - Added `event_type` enum column with values 'event' and 'meeting'
  - Default value is 'event'

### 2. Backend Changes
- **Event Model** (`backend/app/Models/Event.php`):
  - Added `event_type` to fillable fields

- **EventController** (`backend/app/Http/Controllers/EventController.php`):
  - Added validation for `event_type` field in both `store()` and `update()` methods
  - Updated `createEventDirectly()` method to include event_type when creating events

### 3. Frontend Changes
- **EventForm Component** (`frontend/src/components/EventForm.jsx`):
  - Added `eventType` state variable with default value 'event'
  - Added radio button selection for Event/Meeting type in the Event Details section
  - Updated form submission to include event_type
  - Updated form reset and editing logic to handle event_type

- **Calendar Component** (`frontend/src/components/Calendar.jsx`):
  - Updated event indicators to show different colors based on event type:
    - **Events**: Red (hosting) / Green (invited)
    - **Meetings**: Brown/Amber-800 (hosting) / Yellow (invited)
    - **Personal Events**: Purple (unchanged)
  - Updated tooltips to show event type information
  - Updated legend to include new color meanings

## Color Scheme
- **Academic Events**: Blue gradient background
- **Hosting Event**: Red indicator
- **Invited to Event**: Green indicator  
- **Hosting Meeting**: Brown (amber-800) indicator
- **Invited to Meeting**: Yellow indicator
- **Personal Event**: Purple indicator

## User Experience
1. When creating/editing an event, users can select between "Event" and "Meeting" using radio buttons
2. The calendar now visually distinguishes between events and meetings using different colors
3. Hover tooltips provide clear information about the type and user's role
4. The legend at the bottom of the calendar explains all color meanings

## Technical Notes
- The event_type field is required and validated on both frontend and backend
- Default value is 'event' to maintain backward compatibility
- All existing events have been updated to 'event' type via migration
- The event_type field is now included in the API response for proper color rendering
- The implementation maintains all existing functionality while adding the new type distinction

## Bug Fixes
- Fixed issue where event_type was not being returned in the API response
- Added migration to set default event_type for all existing events
- Calendar now correctly displays brown color for hosted meetings and yellow for invited meetings