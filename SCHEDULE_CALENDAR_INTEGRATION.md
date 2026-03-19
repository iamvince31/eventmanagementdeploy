# Schedule Calendar Integration with Semester Restrictions

## Overview

This implementation adds the ability for user class schedules to be displayed on the calendar alongside regular events and academic events, with semester-based restrictions. When a Faculty Member creates a class schedule, it will be reflected on the calendar view only during the appropriate semester periods.

## Semester System

The system recognizes three semester periods:

- **First Semester**: September to January
- **Second Semester**: February to June  
- **Mid-Year/Summer**: July to August

Class schedules are only visible on the calendar during these semester periods. During break periods between semesters, schedules are hidden from the calendar view.

## Changes Made

### Backend Changes

#### 1. DashboardController.php
- Added `UserSchedule` model import
- Added `getCurrentSemester()` helper method to determine current semester
- Added `isDateInCurrentSemester()` helper method for date validation
- Modified the `index()` method to fetch and transform user schedules
- Added semester information to schedule data transformation
- Time format is normalized to HH:MM (removing seconds)

#### 2. User.php Model
- Added `schedules()` relationship method to link users with their schedules

### Frontend Changes

#### 1. Dashboard.jsx
- Added `userSchedules` state variable
- Updated `fetchData()` to handle user schedules from API
- Modified `handleDateSelect()` to include semester-filtered schedule events
- Updated Calendar component props to include `userSchedules`
- Added semester detection logic for date-based filtering

#### 2. Calendar.jsx
- Added `userSchedules` prop parameter
- Enhanced `getScheduleEventsForDate()` with semester filtering logic
- Updated calendar cell rendering to display schedule events with orange color
- Added schedule events to the "View More" modal with semester awareness
- Updated event detail modal to handle schedule events
- Added "Class Schedule" legend item with orange color indicator

## Features

### Semester-Based Visibility
- Schedules only appear during semester periods (Sep-Jan, Feb-Jun, Jul-Aug)
- Automatically hidden during break periods between semesters
- Real-time semester detection based on current date

### Visual Indicators
- **Orange color**: Class schedule events
- **Blue color**: Academic calendar events  
- **Other colors**: Regular events (red/green for hosting/invited, purple for personal, etc.)

### Schedule Display
- Schedule events appear on the appropriate days of the week during semester periods
- Shows class name/description and time range
- Clickable to view details in modal
- Included in "View All" when there are many events on a date

### Data Structure
Schedule events are transformed with the following structure:
```javascript
{
  id: 'schedule-{id}',
  title: 'Class Name',
  description: 'Class Description', 
  day: 'Monday',
  start_time: '08:00',
  end_time: '10:00',
  time: '08:00 - 10:00',
  is_schedule: true,
  type: 'schedule',
  semester: 'second'
}
```

## Semester Logic

### Backend Semester Detection
```php
private function getCurrentSemester(\DateTime $date)
{
    $month = (int)$date->format('m');
    
    // First Semester: September (9) to January (1)
    if ($month >= 9 || $month <= 1) {
        return 'first';
    }
    
    // Second Semester: February (2) to June (6)
    if ($month >= 2 && $month <= 6) {
        return 'second';
    }
    
    // Mid-Year/Summer: July (7) to August (8)
    if ($month >= 7 && $month <= 8) {
        return 'midyear';
    }
    
    return null; // Break period
}
```

### Frontend Semester Detection
```javascript
const month = checkDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
let currentSemester;

// First Semester: September (9) to January (1)
if (month >= 9 || month <= 1) {
  currentSemester = 'first';
}
// Second Semester: February (2) to June (6)
else if (month >= 2 && month <= 6) {
  currentSemester = 'second';
}
// Mid-Year/Summer: July (7) to August (8)
else if (month >= 7 && month <= 8) {
  currentSemester = 'midyear';
}

// Only show schedules during semester periods
return currentSemester !== undefined;
```

## Testing

Comprehensive test scripts were created to verify:

1. **Schedule Calendar Integration** (`backend/test-schedule-calendar-integration.php`)
   - User schedule data retrieval
   - Data transformation for API response
   - Day-based filtering logic
   - Data integrity validation

2. **Semester Filtering** (`backend/test-semester-schedule-filtering.php`)
   - Semester detection accuracy
   - Date-based schedule filtering
   - Boundary condition testing
   - Current date logic validation

3. **Complete Integration** (`backend/test-semester-integration-complete.php`)
   - End-to-end API response testing
   - Data structure validation
   - Semester logic consistency
   - Real-world filtering scenarios

## Usage

1. Faculty members create their class schedules through the existing schedule management interface
2. Schedules automatically appear on the calendar on the appropriate days during semester periods
3. Schedules are automatically hidden during break periods between semesters
4. Users can click on schedule events to view details during active semester periods
5. Schedule events are included in conflict detection and event planning

## Benefits

- **Semester-appropriate visibility**: Class schedules only show during active academic periods
- **Automatic management**: No manual intervention needed for semester transitions
- **Conflict prevention**: Users can see their class times when planning events during semesters
- **Integrated experience**: All time-based information in one place with proper temporal context
- **Consistent UI**: Schedule events follow the same visual patterns as other events
- **Academic calendar alignment**: Respects traditional academic semester structure

## Technical Notes

- Schedule events are read-only in the calendar (no edit/delete functionality)
- Time format is consistently displayed as HH:MM
- Semester filtering is applied both on backend and frontend for consistency
- Schedule events respect the existing calendar date range limitations
- Performance optimized with proper data transformation and caching
- Semester boundaries are clearly defined and consistently applied
- Break periods between semesters properly hide schedule events