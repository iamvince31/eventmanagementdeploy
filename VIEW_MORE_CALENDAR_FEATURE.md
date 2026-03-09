# View More Calendar Feature Implementation

## Summary
Implemented "View More" button for calendar dates with more than 2 events (including academic events).

## Changes Made

### Calendar Component (`frontend/src/components/Calendar.jsx`)

1. **Display Limit Updated**
   - Changed from showing 3 events to showing only 2 events per calendar date
   - This applies to both academic events (green labels) and regular events (bullet points)

2. **View More Button**
   - Button now shows "View More (X)" where X is the total number of events
   - Only appears when there are more than 2 events on a date
   - Clicking opens a modal showing all events for that date

## How It Works

### Calendar Date Display
- Shows first 2 events (academic + regular combined)
- Academic events are displayed as green labels
- Regular events are displayed as bullet points with time
- If total events > 2, shows "View More (X)" button

### Modal Behavior
- Clicking "View More" opens a modal with complete event list
- Modal displays:
  - Day of week and date number at the top
  - All academic events (green bars)
  - All regular events (blue bullet points with time)
  - Click any event to see full details

## Example Scenarios

### Scenario 1: Date with 2 events
- Shows both events directly on calendar
- No "View More" button appears

### Scenario 2: Date with 3+ events
- Shows first 2 events on calendar
- Shows "View More (3)" button
- Clicking button opens modal with all 3 events

### Scenario 3: Date with 5 events (2 academic + 3 regular)
- Shows first 2 events on calendar (could be 2 academic, or 1 academic + 1 regular)
- Shows "View More (5)" button
- Modal displays all 5 events organized by type

## Visual Design
- "View More" button styled in blue with hover effects
- Shows total event count in parentheses
- Seamlessly integrates with existing calendar design
- Modal maintains the same styling as before

## Testing
Test the feature by:
1. Creating multiple events on the same date
2. Verifying only 2 events show on calendar
3. Confirming "View More" button appears when events > 2
4. Clicking button to see all events in modal
5. Testing with mix of academic and regular events
