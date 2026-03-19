# Calendar Component - Past Dates UI/UX Polish

## Overview
Enhanced the Calendar component to provide better visual feedback and user experience when viewing past dates on the dashboard.

## Changes Made

### 1. **Past Date Detection**
- Added `isPastDate` variable to identify dates before today
- Prevents interaction with past dates (click handlers disabled)
- Only applies to current month dates

### 2. **Visual Styling for Past Dates**

#### Date Cell Background
- Past date cells now have a grayed-out appearance (`bg-gray-50`)
- Reduced opacity (`opacity-60`) to visually distinguish them
- Cursor changes to `cursor-not-allowed` for past dates

#### Date Number
- Past date numbers display in gray (`text-gray-400`)
- Added a small "Past" label next to the date number for clarity
- Maintains green highlight for today's date

#### Event Badges
- Past events display with gray background (`bg-gray-300` for academic, `bg-gray-400` for regular)
- Reduced opacity (`opacity-75`) for subtle disabled appearance
- Cursor changes to `cursor-not-allowed`
- Hover effects disabled for past events

### 3. **Interaction Prevention**
- Click handlers check `isPastDate` before executing
- Past date cells cannot be selected
- Past events cannot be clicked to view details
- "View More" button hidden for past dates

### 4. **Past Events Indicator**
- When a past date has events, displays count: "X past event(s)"
- Provides context without allowing interaction
- Small, subtle text styling

### 5. **Legend Update**
- Added new legend item for "Past Events" (gray color)
- Shows on desktop as "Past Events", abbreviated as "Past" on mobile
- Helps users understand the visual distinction

## User Experience Improvements

✓ **Clear Visual Hierarchy**: Past dates are clearly distinguished from current/future dates
✓ **Prevents Accidental Clicks**: Disabled cursor and styling prevent confusion
✓ **Maintains Readability**: Events still visible but clearly marked as past
✓ **Responsive Design**: All changes work seamlessly on mobile and desktop
✓ **Accessibility**: Color changes combined with text labels for clarity
✓ **Consistent Styling**: Matches existing design system and color palette

## Technical Details

- No breaking changes to component props or functionality
- All existing features preserved for current/future dates
- Smooth transitions and hover effects maintained
- Mobile-responsive styling preserved

## Files Modified
- `frontend/src/components/Calendar.jsx`
