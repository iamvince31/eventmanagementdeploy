# Calendar Highlighting Quick Guide

## What You'll See

### Color Meanings

🔵 **Blue Gradient Background** = Academic Event Date Range
- Dates that fall within academic events (exams, breaks, etc.)
- Includes all days from start date to end date
- Calendar icon in top-right corner

🟢 **Green Background** = Today's Date
- Always shows current day
- Takes priority over other highlights

⚪ **White Background** = Regular Day
- No events or academic events scheduled

### Event Indicators

🔴 **Red Dot** = You're hosting this event
🟢 **Green Dot** = You're invited to this event
📅 **Calendar Icon** = Academic event (hover for details)

## How to Use

1. **View Academic Events**
   - Look for blue-highlighted dates
   - These show academic event ranges

2. **See Event Details**
   - Hover over the calendar icon (📅)
   - Tooltip shows event name and date range

3. **Check Your Events**
   - Red dots = events you created
   - Green dots = events you're invited to

4. **Select a Date**
   - Click any date to see all events
   - Event details appear on the right

## Examples

### Single-Day Event
```
┌─────────┐
│ 15  📅  │  ← Blue background
│         │     Calendar icon
└─────────┘
Hover: "Midterm Exam"
```

### Multi-Day Event (3 days)
```
┌─────────┬─────────┬─────────┐
│ 15  📅  │ 16  📅  │ 17  📅  │  ← All blue
│         │         │         │
└─────────┴─────────┴─────────┘
Hover: "Final Exams - Oct 15 - Oct 17"
```

### Mixed Events
```
┌─────────┐
│ 15  📅  │  ← Blue (academic event)
│ 🔴 🟢   │  ← Red & green dots (your events)
└─────────┘
```

## Legend (Bottom of Calendar)

```
🔵 Academic Event  🔴 Hosting  🟢 Invited
```

## Tips

✅ **Do:**
- Hover over calendar icons for details
- Check blue dates before scheduling
- Use legend to understand colors

❌ **Don't:**
- Ignore blue dates when planning
- Forget to check tooltips
- Schedule over academic events

## Common Scenarios

### Exam Week
All exam days highlighted in blue:
```
Mon  Tue  Wed  Thu  Fri
15   16   17   18   19   ← All blue
📅   📅   📅   📅   📅
```

### Winter Break
Spans across months:
```
December          January
...  28  29  30  31    1   2   3  ...
     🔵  🔵  🔵  🔵   🔵  🔵  🔵
     📅  📅  📅  📅   📅  📅  📅
```

### Regular Day with Events
```
┌─────────┐
│   15    │  ← White background
│ 🔴 🟢   │  ← Your events
└─────────┘
```

## Quick Reference

| Color | Meaning |
|-------|---------|
| 🔵 Blue gradient | Academic event range |
| 🟢 Green | Today |
| ⚪ White | Regular day |
| 🔴 Red dot | Hosting event |
| 🟢 Green dot | Invited to event |
| 📅 Icon | Academic event (hover for info) |

## Need Help?

- **Not seeing highlights?** Run the date range migration
- **Wrong colors?** Clear browser cache
- **No tooltips?** Hover over the calendar icon
- **More info?** See `CALENDAR_DATE_RANGE_HIGHLIGHTING.md`

---

**Enjoy your enhanced calendar!** 📅✨
