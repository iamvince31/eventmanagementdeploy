# Sunday Styling - Detailed Visual Guide

## Current Implementation

### Sunday Cells (Non-Interactive)
Sundays are now rendered as `<div>` elements (not buttons) with these styles:

```jsx
<div
  title="Sundays are not available"
  className="h-7 flex items-center justify-center text-xs rounded-md 
             bg-gray-200 text-gray-400 cursor-not-allowed opacity-50 
             pointer-events-none"
>
  {day}
</div>
```

### CSS Classes Breakdown:

| Class | Purpose |
|-------|---------|
| `bg-gray-200` | Medium gray background (darker than before) |
| `text-gray-400` | Light gray text |
| `opacity-50` | 50% transparency - makes it very faded |
| `cursor-not-allowed` | Shows ⛔ cursor on hover |
| `pointer-events-none` | Completely blocks all mouse interactions |
| `rounded-md` | Rounded corners |

### Visual Appearance:

**Sunday cells will look like:**
- 🔲 Medium gray background
- 🔤 Very light gray text
- 👻 50% faded/transparent
- ⛔ "Not allowed" cursor
- 🚫 Cannot be clicked at all

**Regular days (Mon-Sat) will look like:**
- ⬜ White background (or blue if today)
- 🔤 Dark text
- ✋ Pointer cursor
- ✅ Clickable and interactive

## Visual Comparison

### March 2026 Calendar:

```
Su      Mo      Tu      We      Th      Fr      Sa
[1]     2       3       4       5       6       7
gray    white   white   white   white   white   white
faded   normal  normal  normal  normal  normal  normal
⛔      ✋      ✋      ✋      ✋      ✋      ✋

[8]     9       10      11      12      13      14
gray    white   white   white   white   white   white
faded   normal  normal  normal  normal  normal  normal
⛔      ✋      ✋      ✋      ✋      ✋      ✋

[15]    16      17      18      19      20      21
gray    white   white   white   white   white   white
faded   normal  normal  normal  normal  normal  normal
⛔      ✋      ✋      ✋      ✋      ✋   