# Edit & Delete Events - Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  Dashboard   │────────▶│   Calendar   │                  │
│  │              │         │              │                  │
│  │ - handleEdit │         │ - Edit Btn   │                  │
│  │ - handleDel  │         │ - Delete Btn │                  │
│  └──────────────┘         └──────────────┘                  │
│         │                         │                          │
│         │                         │                          │
│         ▼                         ▼                          │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  AddEvent    │         │ PersonalEvent│                  │
│  │  Form        │         │  Form        │                  │
│  └──────────────┘         └──────────────┘                  │
│         │                         │                          │
└─────────┼─────────────────────────┼──────────────────────────┘
          │                         │
          ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (api.js)                      │
│                                                               │
│  PUT  /api/events/{id}    - Update event                     │
│  DELETE /api/events/{id}  - Delete event                     │
└─────────────────────────────────────────────────────────────┘
          │                         │
          ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────┐           │
│  │        EventController.php                    │           │
│  │                                                │           │
│  │  update($request, $event)                     │           │
│  │  ├─ Check authorization                       │           │
│  │  ├─ Validate input                            │           │
│  │  ├─ Update event                              │           │
│  │  └─ Return updated event                      │           │
│  │                                                │           │
│  │  destroy($request, $event)                    │           │
│  │  ├─ Check authorization                       │           │
│  │  ├─ Delete event                              │           │
│  │  └─ Return success                            │           │
│  └──────────────────────────────────────────────┘           │
│                         │                                     │
│                         ▼                                     │
│  ┌──────────────────────────────────────────────┐           │
│  │              Event Model                      │           │
│  │         (Database Operations)                 │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Edit Event Flow

```
┌─────────────┐
│   User      │
│  (Host)     │
└──────┬──────┘
       │
       │ 1. Clicks on hosted event
       ▼
┌─────────────────────┐
│  Calendar Component │
│  Event Detail Modal │
└──────┬──────────────┘
       │
       │ 2. Clicks Edit button
       ▼
┌─────────────────────┐
│  Dashboard          │
│  handleEdit()       │
└──────┬──────────────┘
       │
       │ 3. Checks event type
       ▼
    ┌──┴──┐
    │ IF  │
    └──┬──┘
       │
   ┌───┴────────────────────┐
   │                        │
   ▼                        ▼
Personal Event?      Regular Event/Meeting?
   │                        │
   │ YES                    │ YES
   ▼                        ▼
Navigate to           Navigate to
/personal-event       /add-event
   │                        │
   └────────┬───────────────┘
            │
            │ 4. Form pre-populated
            ▼
    ┌───────────────┐
    │  Edit Form    │
    │  (Pre-filled) │
    └───────┬───────┘
            │
            │ 5. User modifies fields
            │ 6. User clicks Save
            ▼
    ┌───────────────┐
    │  API Call     │
    │  PUT /events  │
    └───────┬───────┘
            │
            │ 7. Backend validates
            ▼
    ┌───────────────┐
    │ Authorization │
    │    Check      │
    └───────┬───────┘
            │
        ┌───┴───┐
        │  IF   │
        └───┬───┘
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
  Host?           Not Host?
    │                │
    │ YES            │ NO
    ▼                ▼
Update Event    Return 403
    │            Unauthorized
    │                │
    └────────┬───────┘
             │
             │ 8. Return response
             ▼
    ┌────────────────┐
    │  Dashboard     │
    │  Refreshes     │
    └────────┬───────┘
             │
             │ 9. Calendar updates
             ▼
    ┌────────────────┐
    │  Updated Event │
    │  Displayed     │
    └────────────────┘
```

## Delete Event Flow

```
┌─────────────┐
│   User      │
│  (Host)     │
└──────┬──────┘
       │
       │ 1. Clicks on hosted event
       ▼
┌─────────────────────┐
│  Calendar Component │
│  Event Detail Modal │
└──────┬──────────────┘
       │
       │ 2. Clicks Delete button
       ▼
┌─────────────────────┐
│  Confirmation       │
│  Dialog             │
│  "Delete event?"    │
└──────┬──────────────┘
       │
   ┌───┴───┐
   │  IF   │
   └───┬───┘
       │
   ┌───┴────────────┐
   │                │
   ▼                ▼
Confirm?         Cancel?
   │                │
   │ YES            │ NO
   ▼                ▼
Continue        Close Dialog
   │            (No action)
   │                │
   │                └──────────┐
   │                           │
   │ 3. Modal closes           │
   ▼                           │
┌─────────────────────┐        │
│  Dashboard          │        │
│  handleDelete()     │        │
└──────┬──────────────┘        │
       │                       │
       │ 4. API call           │
       ▼                       │
┌─────────────────────┐        │
│  API Call           │        │
│  DELETE /events     │        │
└──────┬──────────────┘        │
       │                       │
       │ 5. Backend validates  │
       ▼                       │
┌─────────────────────┐        │
│  Authorization      │        │
│  Check              │        │
└──────┬──────────────┘        │
       │                       │
   ┌───┴───┐                   │
   │  IF   │                   │
   └───┬───┘                   │
       │                       │
   ┌───┴────────┐              │
   │            │              │
   ▼            ▼              │
Host?       Not Host?          │
   │            │              │
   │ YES        │ NO           │
   ▼            ▼              │
Delete      Return 403         │
Event       Unauthorized       │
   │            │              │
   └─────┬──────┘              │
         │                     │
         │ 6. Return response  │
         ▼                     │
┌─────────────────────┐        │
│  Dashboard          │        │
│  Refreshes          │        │
└──────┬──────────────┘        │
       │                       │
       │ 7. Calendar updates   │
       ▼                       │
┌─────────────────────┐        │
│  Event Removed      │        │
│  from Calendar      │        │
└─────────────────────┘        │
                               │
                               │
                    ┌──────────┘
                    │
                    ▼
            ┌───────────────┐
            │  No Changes   │
            │  Made         │
            └───────────────┘
```

## Authorization Decision Tree

```
                    ┌─────────────┐
                    │  User       │
                    │  Action     │
                    └──────┬──────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Is user      │
                    │ logged in?   │
                    └──────┬───────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
                  YES            NO
                    │             │
                    │             └──▶ Redirect to Login
                    │
                    ▼
            ┌───────────────┐
            │ Is user the   │
            │ event host?   │
            └───────┬───────┘
                    │
            ┌───────┴───────┐
            │               │
            ▼               ▼
          YES              NO
            │               │
            │               └──▶ Hide Edit/Delete Buttons
            │
            ▼
    ┌───────────────┐
    │ Show Edit &   │
    │ Delete Buttons│
    └───────┬───────┘
            │
            │ User clicks button
            ▼
    ┌───────────────┐
    │ Frontend      │
    │ Action        │
    └───────┬───────┘
            │
            │ API Request
            ▼
    ┌───────────────┐
    │ Backend       │
    │ Authorization │
    └───────┬───────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
Host ID          Host ID
matches?         doesn't match?
    │               │
    │ YES           │ NO
    ▼               ▼
Allow           Return 403
Action          Forbidden
    │               │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │  Response     │
    │  to Frontend  │
    └───────────────┘
```

## Event Type Routing

```
                    ┌─────────────┐
                    │  Edit       │
                    │  Clicked    │
                    └──────┬──────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Check Event  │
                    │ Type         │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ is_personal   │  │ event_type    │  │ is_default    │
│ === true      │  │ === 'event'   │  │ === true      │
└───────┬───────┘  │ or 'meeting'  │  └───────┬───────┘
        │          └───────┬───────┘          │
        │ YES              │ YES              │ YES
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Navigate to   │  │ Navigate to   │  │ No Edit       │
│ /personal-    │  │ /add-event    │  │ (Academic)    │
│ event         │  │               │  │               │
└───────┬───────┘  └───────┬───────┘  └───────────────┘
        │                  │
        │                  │
        └────────┬─────────┘
                 │
                 ▼
        ┌────────────────┐
        │  Edit Form     │
        │  Opens with    │
        │  Event Data    │
        └────────────────┘
```

## Component Communication

```
┌─────────────────────────────────────────────────────────┐
│                      Dashboard                          │
│                                                         │
│  State:                                                 │
│  - events: []                                           │
│  - selectedEvent: null                                  │
│                                                         │
│  Functions:                                             │
│  - handleEdit(event)                                    │
│  - handleDelete(event)                                  │
│  - fetchData()                                          │
│                                                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Props passed down
                     ▼
┌─────────────────────────────────────────────────────────┐
│                      Calendar                           │
│                                                         │
│  Props:                                                 │
│  - events                                               │
│  - defaultEvents                                        │
│  - currentUser                                          │
│  - onEditEvent    ◀─── handleEdit                      │
│  - onDeleteEvent  ◀─── handleDelete                    │
│                                                         │
│  State:                                                 │
│  - showEventDetailModal: false                          │
│  - selectedEvent: null                                  │
│                                                         │
│  Functions:                                             │
│  - handleEventClick(event)                              │
│  - Opens modal with event details                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
                     │
                     │ User interaction
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Event Detail Modal                         │
│                                                         │
│  Conditional Rendering:                                 │
│  {currentUser.id === selectedEvent.host.id && (         │
│    <>                                                   │
│      <button onClick={() => onEditEvent(event)}>       │
│        Edit                                             │
│      </button>                                          │
│      <button onClick={() => onDeleteEvent(event)}>     │
│        Delete                                           │
│      </button>                                          │
│    </>                                                  │
│  )}                                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────┐
│  User    │
│  Action  │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  UI Component   │
│  (Calendar)     │
└────┬────────────┘
     │
     │ Calls handler
     ▼
┌─────────────────┐
│  Dashboard      │
│  Handler        │
└────┬────────────┘
     │
     │ Makes API call
     ▼
┌─────────────────┐
│  API Service    │
│  (api.js)       │
└────┬────────────┘
     │
     │ HTTP Request
     ▼
┌─────────────────┐
│  Backend API    │
│  (Laravel)      │
└────┬────────────┘
     │
     │ Validates & Processes
     ▼
┌─────────────────┐
│  Database       │
│  (MySQL)        │
└────┬────────────┘
     │
     │ Returns data
     ▼
┌─────────────────┐
│  Backend API    │
│  Response       │
└────┬────────────┘
     │
     │ HTTP Response
     ▼
┌─────────────────┐
│  API Service    │
│  Receives       │
└────┬────────────┘
     │
     │ Updates state
     ▼
┌─────────────────┐
│  Dashboard      │
│  Refreshes      │
└────┬────────────┘
     │
     │ Re-renders
     ▼
┌─────────────────┐
│  UI Component   │
│  Updated        │
└─────────────────┘
```

## State Management

```
Initial State:
┌─────────────────────────────────────┐
│  Dashboard                          │
│  - events: []                       │
│  - selectedEvent: null              │
│  - isModalOpen: false               │
└─────────────────────────────────────┘

After Event Click:
┌─────────────────────────────────────┐
│  Dashboard                          │
│  - events: [...]                    │
│  - selectedEvent: {...}             │
│  - isModalOpen: true                │
└─────────────────────────────────────┘

After Edit Click:
┌─────────────────────────────────────┐
│  Dashboard                          │
│  - events: [...]                    │
│  - selectedEvent: {...}             │
│  - isModalOpen: false               │
│  → Navigate to /add-event           │
└─────────────────────────────────────┘

After Delete Confirm:
┌─────────────────────────────────────┐
│  Dashboard                          │
│  - events: [...] (refreshing)       │
│  - selectedEvent: null              │
│  - isModalOpen: false               │
│  → API call in progress             │
└─────────────────────────────────────┘

After Delete Success:
┌─────────────────────────────────────┐
│  Dashboard                          │
│  - events: [...] (updated)          │
│  - selectedEvent: null              │
│  - isModalOpen: false               │
│  → Event removed from list          │
└─────────────────────────────────────┘
```

---

**Legend:**
- `→` : Navigation/Flow direction
- `▼` : Downward flow
- `◀─` : Data/prop passing
- `┌─┐` : Component/Process boundary
- `IF` : Decision point
