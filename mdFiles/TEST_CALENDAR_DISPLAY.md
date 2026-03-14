# Test Calendar Display Fix

## Quick Test Steps

### 1. Set Up Test Event
1. Go to Default Events page (Academic Calendar)
2. Find "Registration Period" or any event
3. Click "Edit"
4. Set date to September 7-18, 2026
5. Click "Set"
6. Verify it shows "Sep 7 - 18, 2026" in the table

### 2. View on Dashboard
1. Go to Dashboard
2. Navigate calendar to September 2026
3. Look at dates 7-18

### Expected Result:
✅ Dates September 7-18 should be highlighted in blue
✅ Blue gradient background
✅ Blue border
✅ Calendar icon visible
✅ Tooltip shows "Registration Period" on hover

### 3. Test Multiple Months
1. Set another event for October 2026
2. Navigate to October on calendar
3. ✅ October event should be visible

### 4. Test Current School Year
1. Set an event for current month (March 2026)
2. View March on calendar
3. ✅ March event should be visible

## What to Look For

### Correct Display:
```
September 2026
Su  Mo  Tu  We  Th  Fr  Sa
        1   2   3   4   5
6   🔵  🔵  🔵  🔵  🔵  🔵   ← Blue highlighted
    🔵  🔵  🔵  🔵  🔵  🔵   ← Registration Period
    19  20  21  22  23  24
```

### Visual Indicators:
- Blue gradient background
- Blue border (2px)
- Calendar icon in top-right corner
- Hover shows event name and date range

## Troubleshooting

### If events don't appear:

1. **Clear browser cache**
   - Press `Ctrl + F5`
   - Or `Ctrl + Shift + Delete` → Clear cache

2. **Check browser console**
   - Press F12
   - Look for errors in Console tab
   - Check Network tab for API calls

3. **Verify API response**
   - In Network tab, find `/default-events?school_year=2026-2027`
   - Check if it returns the September event
   - Should see `school_year: "2026-2027"` in response

4. **Check date format**
   - Event date should be `2026-09-07`
   - End date should be `2026-09-18`
   - Format: YYYY-MM-DD

## Browser Console Test

Open browser console (F12) and run:
```javascript
// Check if default events are loaded
console.log('Default Events:', window.defaultEvents);

// Should show events from both school years
// 2025-2026 and 2026-2027
```

## API Test

Test the API directly:
```bash
# Test current school year
curl http://localhost:8000/api/default-events?school_year=2025-2026

# Test next school year
curl http://localhost:8000/api/default-events?school_year=2026-2027
```

Both should return events if they exist.

## Success Criteria

- ✅ Events from current school year appear on calendar
- ✅ Events from next school year appear on calendar
- ✅ Date ranges are highlighted correctly
- ✅ Tooltips show event information
- ✅ No console errors
- ✅ Calendar navigation works smoothly

## Common Issues

### Issue 1: Events appear in table but not on calendar
**Solution:** Clear browser cache and hard refresh

### Issue 2: Only current school year events appear
**Solution:** Verify the Dashboard.jsx changes were saved

### Issue 3: Calendar shows wrong dates
**Solution:** Check that dates are not Sundays (Sundays are excluded)

### Issue 4: No blue highlighting
**Solution:** Check that `defaultEvents` prop is passed to Calendar component

## Verification Checklist

- [ ] Default Events page shows correct dates
- [ ] Dashboard fetches both school years (check Network tab)
- [ ] Calendar receives defaultEvents prop
- [ ] September 2026 events are highlighted
- [ ] Current month events are highlighted
- [ ] Date ranges work correctly
- [ ] Tooltips appear on hover
- [ ] No JavaScript errors in console
