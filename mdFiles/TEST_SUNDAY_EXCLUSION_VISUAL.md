# Sunday Exclusion - Visual Test Guide

## What to Expect

When you open the DatePicker component, you should see:

### Visual Indicators for Sundays:
1. **Gray background** (`bg-gray-100`)
2. **Light gray text** (`text-gray-300`)
3. **Disabled cursor** (`cursor-not-allowed`)
4. **Cannot be clicked** (button is disabled)
5. **Tooltip on hover**: "Sundays are not available"

### Example for March 2026:
```
Su  Mo  Tu  We  Th  Fr  Sa
1   2   3   4   5   6   7
8   9   10  11  12  13  14
15  16  17  18  19  20  21
22  23  24  25  26  27  28
29  30  31
```

**Sundays (should be grayed out and disabled):**
- March 1 (Sunday)
- March 8 (Sunday)
- March 15 (Sunday)
- March 22 (Sunday)
- March 29 (Sunday)

**All other days (Monday-Saturday):**
- Should be clickable (unless in the past)
- Should have normal text color
- Should highlight on hover

## Testing Steps

### 1. Open Event Creation Form
- Navigate to create a new event
- Click on the "Start Date" field
- The DatePicker dropdown should appear

### 2. Visual Check
Look at the calendar and verify:
- [ ] All Sundays have a gray background
- [ ] All Sundays have light gray text
- [ ] All Sundays show a "not-allowed" cursor when hovering
- [ ] The legend shows "Sundays are excluded"

### 3. Interaction Check
Try to click on a Sunday:
- [ ] Nothing should happen (button is disabled)
- [ ] The date should not be selected
- [ ] Tooltip should show "Sundays are not available"

### 4. Valid Date Selection
Click on a Monday-Saturday date:
- [ ] Date should be selected
- [ ] Date should appear in the input field
- [ ] Calendar should close
- [ ] Selected date should have green background

### 5. Previous/Next Month Sundays
Check the grayed-out dates from previous/next months:
- [ ] Sundays from other months should be even lighter (text-gray-200)
- [ ] Regular days from other months should be text-gray-300

## Expected CSS Classes

### For Current Month Sundays:
```jsx
className="h-7 flex items-center justify-center text-xs rounded-md transition-all 
           text-gray-300 bg-gray-100 cursor-not-allowed"
disabled={true}
```

### For Previous Month Sundays:
```jsx
className="h-7 flex items-center justify-center text-xs text-gray-200"
```

### For Next Month Sundays:
```jsx
className="h-7 flex items-center justify-center text-xs text-gray-200"
```

## Browser Testing

Test in multiple browsers to ensure consistent behavior:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)

## Mobile Testing

If testing on mobile:
- [ ] Sundays should still be visually distinct
- [ ] Touch interaction should not select Sundays
- [ ] Tooltip may not appear (expected on mobile)

## Troubleshooting

### If Sundays are not grayed out:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh the page (Ctrl+F5)
3. Check browser console for JavaScript errors
4. Verify the DatePicker.jsx file was saved correctly

### If Sundays can still be clicked:
1. Check that `disabled={disabled}` is on the button element
2. Verify `isDateDisabled()` returns true for Sundays
3. Check browser console for errors

### If styling looks wrong:
1. Verify Tailwind CSS is loaded
2. Check that all class names are correct
3. Inspect element in browser DevTools to see applied styles

## Code Reference

The key logic in DatePicker.jsx:

```javascript
// Disable Sundays and past dates
const isDateDisabled = (day) => {
  const date = new Date(year, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const isSunday = date.getDay() === 0;
  return date < today || isSunday;
};

// Render current month days
for (let day = 1; day <= daysInMonth; day++) {
  const date = new Date(year, month, day);
  const isSunday = date.getDay() === 0;
  const disabled = isDateDisabled(day);
  
  // Button with disabled state and gray styling
  <button
    disabled={disabled}
    title={isSunday ? 'Sundays are not available' : ''}
    className={disabled ? 'text-gray-300 bg-gray-100 cursor-not-allowed' : '...'}
  >
    {day}
  </button>
}
```

## Success Criteria

✅ All Sundays are visually grayed out
✅ All Sundays cannot be clicked
✅ Tooltip appears on Sunday hover
✅ Monday-Saturday dates work normally
✅ Legend shows "Sundays are excluded"
✅ Backend validation also blocks Sundays (422 error)

## Screenshots to Take

For documentation, capture:
1. DatePicker with March 2026 showing grayed Sundays
2. Hover state on a Sunday showing tooltip
3. Successfully selected Monday-Saturday date
4. Error message if Sunday is somehow submitted to backend
