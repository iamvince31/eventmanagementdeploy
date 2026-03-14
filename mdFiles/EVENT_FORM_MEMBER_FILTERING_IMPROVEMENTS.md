# Event Form Member Filtering Improvements

## Summary
Improved the member invitation filtering in the Add Event form with two key enhancements:
1. Dean role is excluded from the role filter dropdown when a Dean is creating an event (other roles retain their own role in the filter)
2. Selected members are automatically sorted to the top of the list while maintaining filter functionality

## Problem
1. When a Dean creates an event, they could see "Dean" in the role filter dropdown, which was unnecessary since they can't invite themselves
2. When filtering members after selecting some, the selected members would get mixed with unselected ones, making it hard to see who was already invited

## Solution

### 1. Exclude Dean Role from Filter (Dean Only)
The role filter dropdown now excludes "Dean" when a Dean is creating an event. Other roles (Chairperson, Coordinator) keep their role in the filter.

**Example:**
- **Dean creating event** → Filter shows: Admin, Chairperson, Coordinator, Faculty Member (no "Dean")
- **Chairperson creating event** → Filter shows: Admin, Dean, Chairperson, Coordinator, Faculty Member (includes "Chairperson")
- **Coordinator creating event** → Filter shows: Admin, Dean, Chairperson, Coordinator, Faculty Member (includes "Coordinator")

**Rationale:**
- Dean is typically unique (one per department/college)
- Chairpersons and Coordinators may want to invite others with the same role
- Provides flexibility for Chairpersons and Coordinators while keeping Dean filter clean

### 2. Selected Members Stay at Top
Selected (checked) members are automatically sorted to the top of the list, making it easy to see who's already invited even when applying filters.

**Behavior:**
- Selected members appear first (sorted alphabetically among themselves)
- Unselected members appear below (sorted alphabetically among themselves)
- Sorting persists when changing filters or searching
- Makes it easy to review and manage invitations

## Changes Made

### EventForm.jsx
**Location:** `frontend/src/components/EventForm.jsx`

#### 1. Filter Out Dean Role (Dean Only)
**Lines 363-370:**
```javascript
const availableDepartments = [...new Set(members.map(m => m.department).filter(Boolean))];
const availableRoles = [...new Set(members.map(m => m.role).filter(Boolean))]
  .filter(role => {
    // Only exclude "Dean" role when current user is a Dean
    if (currentUser?.role === 'Dean' && role === 'Dean') {
      return false;
    }
    return true;
  });
```

**Logic:**
- Collects all unique roles from members
- Only filters out "Dean" role when current user is a Dean
- Other roles (Chairperson, Coordinator) keep their role in the filter
- Prevents showing irrelevant filter option for Dean

#### 2. Sort Selected Members First
**Lines 357-372:**
```javascript
// Further filter by search term and sort selected members first
const searchFilteredMembers = filteredMembers
  .filter(member =>
    member.username.toLowerCase().includes(searchMember.toLowerCase()) ||
    member.email.toLowerCase().includes(searchMember.toLowerCase())
  )
  .sort((a, b) => {
    // Sort selected members first
    const aSelected = selectedMembers.includes(a.id);
    const bSelected = selectedMembers.includes(b.id);
    
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    
    // If both selected or both not selected, sort alphabetically
    return a.username.localeCompare(b.username);
  });
```

**Sorting Logic:**
1. Check if member A is selected
2. Check if member B is selected
3. If A is selected and B is not → A comes first
4. If B is selected and A is not → B comes first
5. If both have same selection status → Sort alphabetically by username

## User Experience

### Before
**Role Filter:**
- Dean sees "Dean" option (can't invite themselves anyway)
- Cluttered with irrelevant option
- Chairperson and Coordinator also saw their own roles (but might need them)

**Member List:**
- Selected members mixed with unselected
- Hard to see who's already invited when filtering
- Need to scroll through entire list to find selected members

### After
**Role Filter:**
- **Dean** only sees: Admin, Chairperson, Coordinator, Faculty Member (no "Dean")
- **Chairperson** sees: Admin, Dean, Chairperson, Coordinator, Faculty Member (includes "Chairperson")
- **Coordinator** sees: Admin, Dean, Chairperson, Coordinator, Faculty Member (includes "Coordinator")
- Cleaner for Dean, flexible for others

**Member List:**
```
✓ Alice Johnson (Faculty Member) - Selected
✓ Bob Smith (Coordinator) - Selected
✓ Carol Davis (Faculty Member) - Selected
  David Wilson (Faculty Member) - Not selected
  Emma Brown (Faculty Member) - Not selected
  Frank Miller (Coordinator) - Not selected
```

**Benefits:**
- Easy to see who's already invited at a glance
- Selected members always visible at top
- Can quickly review invitations while filtering
- Reduces scrolling and searching

## Use Cases

### Use Case 1: Dean Creating Event
1. Dean opens Add Event form
2. Clicks role filter dropdown
3. **Sees:** Admin, Chairperson, Coordinator, Faculty Member
4. **Does NOT see:** Dean (their own role)
5. Selects "Faculty Member" to filter
6. Invites 3 faculty members
7. Changes filter to "Coordinator"
8. **Still sees:** The 3 selected faculty members at the top
9. Can easily add coordinators below

### Use Case 2: Chairperson Creating Event with Multiple Chairpersons
1. Chairperson opens Add Event form
2. Clicks role filter dropdown
3. **Sees:** Admin, Dean, Chairperson, Coordinator, Faculty Member
4. **Includes:** Chairperson (can invite other chairpersons)
5. Selects "Chairperson" to filter
6. Can invite other chairpersons from different departments
7. Flexibility to collaborate with peers

### Use Case 3: Coordinator with Many Invites
1. Coordinator invites 10 faculty members
2. Wants to add another coordinator
3. Changes role filter to "Coordinator"
4. **Sees:** 10 selected faculty members at top (even though filtering by Coordinator)
5. Other coordinators listed below
6. Can review all invitations without losing track

### Use Case 4: Searching After Selection
1. User selects 5 members from different roles
2. Uses search box to find "John"
3. **Sees:** Selected members named John at top
4. Unselected members named John below
5. Easy to see if John is already invited

## Technical Details

### Filter Exclusion
- Uses `currentUser?.role` to check if user is a Dean
- Only excludes "Dean" role when current user is a Dean
- Other roles (Chairperson, Coordinator) retain their role in the filter
- Allows flexibility for roles that may have multiple people
- No backend changes needed

### Sorting Algorithm
- **Time Complexity:** O(n log n) where n is number of filtered members
- **Space Complexity:** O(n) for the sorted array
- Runs on every filter/search change
- Efficient for typical member list sizes (< 1000 members)

### Maintains Existing Features
- ✓ Department filter still works
- ✓ Role filter still works
- ✓ Search still works
- ✓ Select All/Deselect All still works
- ✓ Checkbox selection still works
- ✓ All filters work together

## Testing Checklist

### Role Filter Exclusion
- [x] Dean doesn't see "Dean" in role filter
- [x] Chairperson DOES see "Chairperson" in role filter
- [x] Coordinator DOES see "Coordinator" in role filter
- [x] Admin sees all roles including "Admin"
- [x] Only Dean role is excluded, only for Dean users

### Selected Members Sorting
- [x] Selected members appear at top of list
- [x] Selected members sorted alphabetically among themselves
- [x] Unselected members sorted alphabetically among themselves
- [x] Sorting persists when changing role filter
- [x] Sorting persists when changing department filter
- [x] Sorting persists when searching
- [x] Sorting updates immediately when selecting/deselecting

### Combined Functionality
- [x] Can filter by role and see selected members at top
- [x] Can search and see selected members at top
- [x] Can use all filters together with proper sorting
- [x] Select All works with sorted list
- [x] Deselect All works with sorted list

## Benefits

1. **Cleaner UI for Dean** - No irrelevant "Dean" filter option
2. **Flexibility for Others** - Chairpersons and Coordinators can invite peers
3. **Better UX** - Selected members always visible
4. **Easier Management** - Quick review of invitations
5. **Less Confusion** - Clear separation of selected/unselected
6. **Maintains Flexibility** - All filters still work together
7. **No Performance Impact** - Efficient sorting algorithm
8. **Role-Appropriate** - Respects organizational structure

## Files Modified
- `frontend/src/components/EventForm.jsx`

## Date
March 4, 2026
