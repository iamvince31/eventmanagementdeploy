# Test Calendar Highlighting Feature

## Pre-Test Checklist

✅ Date range migration has been run
✅ Backend server is running
✅ Frontend server is running
✅ You have admin/appropriate access

## Test Scenarios

### Test 1: Single-Day Academic Event

**Setup:**
1. Go to Academic Calendar page
2. Find or create an event for a single day (e.g., Oct 15)
3. Set only the start date (leave end date empty)
4. Save

**Expected Result:**
- Dashboard calendar shows Oct 15 with blue gradient background
- Calendar icon (📅) appears in top-right of Oct 15
- Hover over icon shows tooltip with event name
- Only Oct 15 is highlighted (not surrounding dates)

**Pass/Fail:** ___

---

### Test 2: Multi-Day Academic Event (Same Month)

**Setup:**
1. Go to Academic Calendar page
2. Create/edit an event with date range (e.g., Oct 15-19)
3. Set start date: Oct 15
4. Set end date: Oct 19
5. Save

**Expected Result:**
- Dashboard calendar shows Oct 15, 16, 17, 18, 19 all with blue backgrounds
- Each date has calendar icon
- Hover shows tooltip: "Event Name - Oct 15 - Oct 19"
- All 5 dates are highlighted continuously

**Pass/Fail:** ___

---

### Test 3: Cross-Month Academic Event

**Setup:**
1. Go to Academic Calendar page
2. Create event spanning two months (e.g., Dec 28 - Jan 3)
3. Set start date: Dec 28
4. Set end date: Jan 3
5. Save

**Expected Result:**
- December calendar: Dec 28, 29, 30, 31 highlighted in blue
- Navigate to January
- January calendar: Jan 1, 2, 3 highlighted in blue
- Tooltip shows full range on all dates

**Pass/Fail:** ___

---

### Test 4: Multiple Overlapping Events

**Setup:**
1. Create two academic events with overlapping dates:
   - Event A: Oct 15-17
   - Event B: Oct 16-18
2. Save both

**Expected Result:**
- Oct 15: Blue (Event A only)
- Oct 16-17: Blue (both events)
- Oct 18: Blue (Event B only)
- Hover tooltip shows both event names on overlapping dates

**Pass/Fail:** ___

---

### Test 5: Academic Event + Regular Events

**Setup:**
1. Create academic event: Oct 15-17
2. Create regular event on Oct 16
3. Save both

**Expected Result:**
- Oct 15-17: Blue background (academic event)
- Oct 16: Blue background + event dots (red/green)
- Calendar icon appears on all three dates
- Regular event dots appear below the date number

**Pass/Fail:** ___

---

### Test 6: Past Academic Events

**Setup:**
1. Create academic event in the past (e.g., last month)
2. Navigate to that month in calendar

**Expected Result:**
- Past dates are dimmed (opacity-40)
- Blue highlighting still visible but dimmed
- Calendar icon still appears
- Tooltip still works on hover

**Pass/Fail:** ___

---

### Test 7: Today's Date with Academic Event

**Setup:**
1. Create academic event that includes today's date
2. View dashboard

**Expected Result:**
- Today's date has green background (priority)
- Calendar icon still appears
- Tooltip shows academic event details
- "Today" label visible in top-right

**Pass/Fail:** ___

---

### Test 8: Legend Display

**Setup:**
1. View dashboard calendar
2. Scroll to bottom of calendar

**Expected Result:**
- Legend visible at bottom
- Shows three items:
  - Blue box: "Academic Event"
  - Red dot: "Hosting"
  - Green dot: "Invited"
- Text is readable and aligned

**Pass/Fail:** ___

---

### Test 9: Hover Tooltip Functionality

**Setup:**
1. Find date with academic event
2. Hover over calendar icon

**Expected Result:**
- Tooltip appears above icon
- Dark background with white text
- Shows event name
- Shows date range (if multi-day)
- Tooltip disappears when hover ends
- No flickering or jumping

**Pass/Fail:** ___

---

### Test 10: Mobile Responsiveness

**Setup:**
1. Open dashboard on mobile device or resize browser
2. View calendar

**Expected Result:**
- Blue highlighting still visible
- Calendar icon appropriately sized
- Tooltip works on tap/hover
- Legend readable on small screen
- No layout breaking

**Pass/Fail:** ___

---

## Visual Inspection Checklist

### Colors
- [ ] Blue gradient is visible and attractive
- [ ] Blue border is distinct
- [ ] Text color contrasts well with background
- [ ] Calendar icon is blue and visible
- [ ] Tooltip has dark background with white text

### Layout
- [ ] Calendar icon doesn't overlap date number
- [ ] Tooltip doesn't get cut off by calendar edges
- [ ] Legend is aligned properly at bottom
- [ ] Event dots don't overlap with calendar icon
- [ ] Grid spacing is consistent

### Interactions
- [ ] Hover states work smoothly
- [ ] Transitions are smooth (no jarring changes)
- [ ] Click to select date still works
- [ ] Tooltip appears/disappears cleanly
- [ ] No console errors

### Accessibility
- [ ] Sufficient color contrast
- [ ] Keyboard navigation works
- [ ] Screen reader can identify elements
- [ ] Focus states are visible
- [ ] No reliance on color alone

---

## Performance Check

### Load Time
- [ ] Calendar loads quickly (< 1 second)
- [ ] No lag when hovering over icons
- [ ] Smooth month navigation
- [ ] No memory leaks (check DevTools)

### Browser Compatibility
- [ ] Chrome: Works correctly
- [ ] Firefox: Works correctly
- [ ] Safari: Works correctly
- [ ] Edge: Works correctly
- [ ] Mobile browsers: Works correctly

---

## Bug Report Template

If you find issues, use this template:

```
**Issue:** [Brief description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Browser:** [Chrome/Firefox/Safari/Edge]
**Version:** [Browser version]
**Screenshot:** [If applicable]

**Console Errors:**
[Any errors from browser console]
```

---

## Test Results Summary

**Date Tested:** ___________
**Tested By:** ___________

**Total Tests:** 10
**Passed:** ___
**Failed:** ___

**Overall Status:** ✅ PASS / ❌ FAIL

**Notes:**
_______________________________________
_______________________________________
_______________________________________

---

## Next Steps

### If All Tests Pass ✅
- Feature is ready for production
- Document any edge cases discovered
- Train users on new feature

### If Tests Fail ❌
- Document failing tests
- Check console for errors
- Review implementation
- Fix issues and re-test

---

**Happy Testing!** 🧪✨
