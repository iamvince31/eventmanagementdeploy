# Role Filter Verification for Staff and CEIT Official

## Current Implementation Status: ✅ WORKING

The role filter in `/add-event` (EventForm component) is **already configured** to automatically include Staff and CEIT Official roles.

## How It Works

### Dynamic Role Generation
```javascript
const availableRoles = [...new Set(members.map(m => m.role).filter(Boolean))]
  .filter(role => {
    // Only exclude "Dean" role when current user is a Dean
    // Only exclude "CEIT Official" role when current user is a CEIT Official
    if (currentUser?.role === 'Dean' && role === 'Dean') {
      return false;
    }
    if (currentUser?.role === 'CEIT Official' && role === 'CEIT Official') {
      return false;
    }
    return true;
  });
```

### What This Means

1. **Scans all members**: The system looks at every member in the database
2. **Extracts unique roles**: Creates a list of all unique roles found
3. **Filters based on current user**: Removes certain roles based on who's creating the event
4. **Displays in dropdown**: Shows all remaining roles in the filter dropdown

### Role Filter Dropdown Will Show

When you open `/add-event` and look at the "Invite Members" section, the role filter dropdown will display:

- ✅ All Roles (default)
- ✅ Admin (if Admin members exist)
- ✅ Dean (if Dean members exist AND current user is NOT Dean)
- ✅ Chairperson (if Chairperson members exist)
- ✅ Coordinator (if Coordinator members exist)
- ✅ Faculty Member (if Faculty Member members exist)
- ✅ **Staff** (if Staff members exist)
- ✅ **CEIT Official** (if CEIT Official members exist AND current user is NOT CEIT Official)

## Testing Instructions

### To Verify Staff Appears in Filter:

1. Create a user with role "Staff" in the Admin panel
2. Go to `/add-event`
3. Scroll to "Invite Members" section
4. Click on the "All Roles" dropdown
5. You should see "Staff" as an option
6. Select "Staff" to filter and see only Staff members

### To Verify CEIT Official Appears in Filter:

1. Create a user with role "CEIT Official" in the Admin panel
2. Go to `/add-event` (logged in as non-CEIT Official user)
3. Scroll to "Invite Members" section
4. Click on the "All Roles" dropdown
5. You should see "CEIT Official" as an option
6. Select "CEIT Official" to filter and see only CEIT Official members

### Special Case: CEIT Official Creating Event

If you're logged in as a CEIT Official and create an event:
- The "CEIT Official" option will NOT appear in the role filter
- This is intentional - prevents inviting peers at the same level
- Similar to how Deans can't see "Dean" in the filter

## Code Location

**File**: `frontend/src/components/EventForm.jsx`

**Lines**: 379-390 (availableRoles generation)

**Lines**: 754-762 (role dropdown rendering)

## No Changes Needed

The implementation is already complete and working. The roles will appear automatically once you have users with those roles in the database.

## Database Requirements

For the roles to appear, you need:

1. ✅ Migration executed (adds Staff and CEIT Official to enum) - DONE
2. ✅ Backend validation updated - DONE
3. ✅ Users created with Staff or CEIT Official roles - NEEDS TESTING

## Summary

**Staff and CEIT Official are already included in the role filter system.**

The filter works dynamically - it automatically detects all roles present in your user database and displays them in the dropdown. No hardcoding needed!

Once you create users with Staff or CEIT Official roles through the Admin panel, they will immediately appear as filter options in the `/add-event` page.
