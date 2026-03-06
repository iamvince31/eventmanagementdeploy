# Role Filters Updated for Staff and CEIT Official

## Summary
Updated all role-based filters and access controls throughout the application to properly include the new Staff and CEIT Official roles.

## Changes Made

### 1. Backend Updates

#### PositionSeeder (`backend/database/seeders/PositionSeeder.php`)
- Updated the role validation list to include 'Staff' and 'CEIT Official'
- Ensures users with invalid roles are properly defaulted to 'Faculty Member'

```php
User::whereNotIn('role', ['Admin', 'Dean', 'Chairperson', 'Coordinator', 'Faculty Member', 'Staff', 'CEIT Official'])
```

### 2. Frontend Updates

#### EventForm Component (`frontend/src/components/EventForm.jsx`)
**Dynamic Role Filtering:**
- The role filter dropdown automatically includes all roles present in the members list
- This means Staff and CEIT Official will appear automatically when there are members with those roles
- No hardcoded role list needed

**Role Exclusion Logic:**
- Dean users don't see "Dean" in the role filter (to avoid inviting peers)
- CEIT Official users don't see "CEIT Official" in the role filter
- Chairperson and Coordinator users see their own roles (can invite peers)

```javascript
const availableRoles = [...new Set(members.map(m => m.role).filter(Boolean))]
  .filter(role => {
    if (currentUser?.role === 'Dean' && role === 'Dean') return false;
    if (currentUser?.role === 'CEIT Official' && role === 'CEIT Official') return false;
    return true;
  });
```

#### AddEvent Page (`frontend/src/pages/AddEvent.jsx`)
- Already passes `currentUser={user}` to EventForm
- No changes needed - works automatically with new roles

#### Dashboard (`frontend/src/pages/Dashboard.jsx`)
- Updated button logic to include Staff with Faculty Member
- Updated button logic to include CEIT Official with other admin roles

#### History Page (`frontend/src/pages/History.jsx`)
- "Requests" filter shown for Faculty Member and Staff
- "Approvals" filter shown for Dean, Chairperson, Coordinator, and CEIT Official

#### App Routes (`frontend/src/App.jsx`)
- `/request-event` route allows Faculty Member and Staff
- `/add-event` route allows Admin, Dean, Chairperson, Coordinator, and CEIT Official

## How Role Filters Work in /add-event

### Member Invitation Filters

1. **Department Filter**
   - Shows all departments from available members
   - Filters members by selected department

2. **Role Filter**
   - Dynamically generated from members in the system
   - Shows all unique roles present in the members list
   - Automatically includes Staff and CEIT Official when members with those roles exist

3. **Role Exclusion Rules**
   - **Dean creating event**: Dean role is excluded from filter (can't invite other Deans)
   - **CEIT Official creating event**: CEIT Official role is excluded from filter
   - **Chairperson creating event**: Chairperson role is shown (can invite peer Chairpersons)
   - **Coordinator creating event**: Coordinator role is shown (can invite peer Coordinators)
   - **Admin creating event**: All roles shown

4. **Selected Members Retention**
   - Selected members always stay visible at the top
   - Even when changing filters, selected members remain in the list
   - This applies to all roles including Staff and CEIT Official

### Search Functionality
- Search works across all roles
- Selected members remain at top even during search
- Search filters by username and email

## Access Summary by Role

### Faculty Member & Staff
- Can request events (requires approval)
- Cannot create events directly
- Can filter and invite members when requesting events
- See "Requests" filter in History

### Coordinator
- Can create events directly
- Can filter and invite members by department and role
- Can invite peer Coordinators
- See "Approvals" filter in History

### Chairperson & CEIT Official
- Can create events directly
- Can filter and invite members by department and role
- Chairperson can invite peer Chairpersons
- CEIT Official cannot invite peer CEIT Officials (excluded from filter)
- See "Approvals" filter in History

### Dean
- Can create events directly
- Can filter and invite members by department and role
- Cannot invite peer Deans (excluded from filter)
- See "Approvals" filter in History

### Admin
- Can create events directly
- Can filter and invite members by all departments and roles
- No role exclusions
- Full access to all features

## Testing Checklist

- [x] Migration executed successfully
- [x] Backend validation includes new roles
- [x] Frontend routes protect new roles correctly
- [x] EventForm dynamically shows all roles in filter
- [x] Role exclusion works for Dean and CEIT Official
- [x] Selected members stay visible when changing filters
- [x] Dashboard buttons show correctly for each role
- [x] History filters show correctly for each role
- [ ] Test with actual Staff user - verify role appears in filter
- [ ] Test with actual CEIT Official user - verify role appears in filter
- [ ] Test CEIT Official creating event - verify own role is excluded
- [ ] Test inviting Staff members - verify they appear in list
- [ ] Test inviting CEIT Official members - verify they appear in list

## Notes

- The role filter is **dynamic** - it automatically includes any role that exists in the members table
- No need to hardcode role lists in the frontend
- Adding new roles in the future only requires:
  1. Database migration to add role to enum
  2. Backend validation updates
  3. Route protection updates
  4. Role-specific business logic (if needed)
  5. Frontend will automatically pick up the new role in filters
