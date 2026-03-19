# Schedule Conflict Warning - Visual Guide

## Before Implementation ❌

```
Admin creates event at 2:00 PM
Invites faculty member who has class 1:00-3:00 PM
Event is created
❌ No warning shown
❌ Faculty member is double-booked
❌ Conflict discovered later
```

## After Implementation ✅

```
Admin creates event at 2:00 PM
Invites faculty member who has class 1:00-3:00 PM
Clicks "Create Event"
        ↓
┌─────────────────────────────────────────────┐
│  ⚠️  SCHEDULE CONFLICT DETECTED             │
│                                             │
│  The following participants have class      │
│  schedules that conflict with this event:   │
│                                             │
│  John Doe (john.doe@cvsu.edu.ph)           │
│  - Advanced Programming at 13:00 - 15:00    │
│                                             │
│  Do you want to create the event anyway?    │
│                                             │
│         [  OK  ]      [ Cancel ]            │
└─────────────────────────────────────────────┘
        ↓
Admin makes informed decision
✅ Can proceed if necessary
✅ Can cancel and reschedule
```

## Calendar View - Conflict Indicator

### Before
```
┌─────────────────────────────────────┐
│  March 2026                         │
├─────────────────────────────────────┤
│ SUN MON TUE WED THU FRI SAT        │
│                                     │
│      24  25  26  27  28  29  30    │
│                                     │
│  [Event 1]                          │
│  [Event 2]                          │
└─────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────┐
│  March 2026                         │
├─────────────────────────────────────┤
│ SUN MON TUE WED THU FRI SAT        │
│                                     │
│      24! 25  26  27  28  29  30    │
│       ↑                             │
│   Conflict!                         │
│                                     │
│  [Event 1]                          │
│  [Event 2] ← Conflicts with class   │
└─────────────────────────────────────┘
```

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    CREATE EVENT FLOW                     │
└─────────────────────────────────────────────────────────┘

1. Admin fills event form
   ├─ Title: "Department Meeting"
   ├─ Date: Friday, March 20
   ├─ Time: 08:00
   └─ Invites: Deleon_gab

2. Admin clicks "Create Event"
   ↓

3. Backend checks schedules
   ├─ Query: user_schedules table
   ├─ Filter: Friday + 08:00
   └─ Found: Deleon_gab has ITEC 55 (07:00-09:00)

4. Backend returns 409 Conflict
   {
     "warning": "schedule_conflict",
     "conflicts": [...]
   }
   ↓

5. Frontend shows warning dialog
   ┌──────────────────────────────────┐
   │  ⚠️  SCHEDULE CONFLICT           │
   │                                  │
   │  Deleon_gab has class:          │
   │  ITEC 55 at 07:00-09:00         │
   │                                  │
   │  Create anyway?                  │
   │  [OK] [Cancel]                   │
   └──────────────────────────────────┘
   ↓

6a. User clicks CANCEL          6b. User clicks OK
    ↓                               ↓
    Event not created               Retry with ignore_conflicts=true
    Form remains open               ↓
    Can change time                 Event created
                                    ↓
                                    Success message shown
```

## Warning Dialog Examples

### Single Conflict
```
┌────────────────────────────────────────────────────┐
│  ⚠️  SCHEDULE CONFLICT DETECTED                    │
│                                                    │
│  The following participants have class schedules   │
│  that conflict with this event:                    │
│                                                    │
│  John Doe (john.doe@cvsu.edu.ph)                  │
│  - Advanced Programming at 14:00 - 16:00           │
│                                                    │
│  Do you want to create the event anyway?           │
│                                                    │
│              [  OK  ]      [ Cancel ]              │
└────────────────────────────────────────────────────┘
```

### Multiple Conflicts
```
┌────────────────────────────────────────────────────┐
│  ⚠️  SCHEDULE CONFLICT DETECTED                    │
│                                                    │
│  The following participants have class schedules   │
│  that conflict with this event:                    │
│                                                    │
│  John Doe (john.doe@cvsu.edu.ph)                  │
│  - Advanced Programming at 14:00 - 16:00           │
│                                                    │
│  Jane Smith (jane.smith@cvsu.edu.ph)              │
│  - Database Systems at 13:00 - 15:00               │
│                                                    │
│  Bob Johnson (bob.johnson@cvsu.edu.ph)            │
│  - Web Development at 14:30 - 16:30                │
│                                                    │
│  Do you want to create the event anyway?           │
│                                                    │
│              [  OK  ]      [ Cancel ]              │
└────────────────────────────────────────────────────┘
```

## Calendar Conflict Indicator Detail

### Date Cell Without Conflict
```
┌──────────┐
│    24    │  ← Just the date number
│          │
│ [Event]  │
└──────────┘
```

### Date Cell With Conflict
```
┌──────────┐
│   24 !   │  ← Date + red exclamation mark
│     ↑    │
│  Warning │
│ [Event]  │  ← Event that conflicts with schedule
└──────────┘
```

### Hover Tooltip
```
┌──────────┐
│   24 !   │ ← Hover here
│          │
│ [Event]  │
└──────────┘
     ↓
┌─────────────────────────────┐
│ Schedule conflict detected  │ ← Tooltip appears
└─────────────────────────────┘
```

## Success Messages

### Event Created (No Conflicts)
```
┌────────────────────────────────────┐
│  ✅  Event created successfully    │
└────────────────────────────────────┘
```

### Event Created (Conflicts Ignored)
```
┌────────────────────────────────────────────────┐
│  ✅  Event created successfully                │
│      (conflicts ignored)                       │
└────────────────────────────────────────────────┘
```

### Event Submitted for Approval (Conflicts Ignored)
```
┌────────────────────────────────────────────────┐
│  ✅  Event submitted for approval              │
│      (conflicts ignored)                       │
│      Waiting for: Dean, Chairperson            │
└────────────────────────────────────────────────┘
```

## Color Coding

- 🔴 **Red (!)** - Conflict warning indicator
- 🟢 **Green** - Success messages
- 🟡 **Amber** - Warning dialogs
- 🔵 **Blue** - Information

## Responsive Design

### Desktop View
```
┌─────────────────────────────────────────────────────────┐
│  ⚠️  SCHEDULE CONFLICT DETECTED                         │
│                                                         │
│  The following participants have class schedules that   │
│  conflict with this event:                              │
│                                                         │
│  John Doe (john.doe@cvsu.edu.ph)                       │
│  - Advanced Programming at 14:00 - 16:00                │
│                                                         │
│  Do you want to create the event anyway?                │
│                                                         │
│              [  OK  ]      [ Cancel ]                   │
└─────────────────────────────────────────────────────────┘
```

### Mobile View
```
┌──────────────────────────┐
│  ⚠️  CONFLICT            │
│                          │
│  Participants with       │
│  conflicts:              │
│                          │
│  John Doe               │
│  john.doe@cvsu.edu.ph   │
│  Advanced Programming    │
│  14:00 - 16:00          │
│                          │
│  Create anyway?          │
│                          │
│  [  OK  ]  [ Cancel ]   │
└──────────────────────────┘
```

## Testing Checklist

- [ ] Create event with conflict → Warning appears
- [ ] Create event without conflict → No warning
- [ ] Click Cancel → Event not created
- [ ] Click OK → Event created with note
- [ ] Multiple conflicts → All listed
- [ ] Calendar shows (!) on conflict dates
- [ ] Tooltip shows on hover
- [ ] Mobile view works correctly
- [ ] Desktop view works correctly

## Summary

✅ Clear visual warnings
✅ Detailed conflict information
✅ User-friendly dialogs
✅ Calendar indicators
✅ Responsive design
✅ Accessible interface
