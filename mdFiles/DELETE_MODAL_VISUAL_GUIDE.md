# Delete Confirmation Modal - Visual Guide

## 🎨 Modal Appearance

### Desktop View
```
┌─────────────────────────────────────────────────────────┐
│                    Dark Backdrop (50% opacity)          │
│                                                         │
│     ┌───────────────────────────────────────────┐     │
│     │  ┌─────────────────────────────────────┐  │     │
│     │  │  ⚠️  Delete Event?                  │  │     │
│     │  │      This action cannot be undone   │  │     │
│     │  └─────────────────────────────────────┘  │     │
│     │  ─────────────────────────────────────────│     │
│     │                                           │     │
│     │  Are you sure you want to delete this    │     │
│     │  event?                                   │     │
│     │                                           │     │
│     │  ┌─────────────────────────────────────┐ │     │
│     │  │  Team Meeting - Project Review      │ │     │
│     │  └─────────────────────────────────────┘ │     │
│     │                                           │     │
│     │  All invited members will no longer see  │     │
│     │  this event.                              │     │
│     │                                           │     │
│     │  ─────────────────────────────────────────│     │
│     │                    [Cancel] [Delete Event]│     │
│     └───────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Mobile View
```
┌─────────────────────────┐
│   Dark Backdrop         │
│                         │
│  ┌───────────────────┐  │
│  │  ⚠️  Delete Event?│  │
│  │  Cannot be undone │  │
│  ├───────────────────┤  │
│  │                   │  │
│  │ Are you sure you  │  │
│  │ want to delete    │  │
│  │ this event?       │  │
│  │                   │  │
│  │ ┌───────────────┐ │  │
│  │ │ Team Meeting  │ │  │
│  │ └───────────────┘ │  │
│  │                   │  │
│  │ All invited       │  │
│  │ members will no   │  │
│  │ longer see this   │  │
│  │ event.            │  │
│  │                   │  │
│  ├───────────────────┤  │
│  │  [Cancel]         │  │
│  │  [Delete Event]   │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

## 🎭 Event Type Variations

### Regular Event
```
┌─────────────────────────────────────┐
│  ⚠️  Delete Event?                  │
│      This action cannot be undone   │
├─────────────────────────────────────┤
│  Are you sure you want to delete    │
│  this event?                        │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Department Seminar           │ │
│  └───────────────────────────────┘ │
│                                     │
│  All invited members will no longer │
│  see this event.                    │
├─────────────────────────────────────┤
│                [Cancel] [Delete Event]│
└─────────────────────────────────────┘
```

### Meeting
```
┌─────────────────────────────────────┐
│  ⚠️  Delete Meeting?                │
│      This action cannot be undone   │
├─────────────────────────────────────┤
│  Are you sure you want to delete    │
│  this meeting?                      │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Weekly Team Standup          │ │
│  └───────────────────────────────┘ │
│                                     │
│  All invited members will be        │
│  notified of the cancellation.      │
├─────────────────────────────────────┤
│              [Cancel] [Delete Meeting]│
└─────────────────────────────────────┘
```

### Personal Event
```
┌─────────────────────────────────────┐
│  ⚠️  Delete Personal Event?         │
│      This action cannot be undone   │
├─────────────────────────────────────┤
│  Are you sure you want to delete    │
│  this personal event?               │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Doctor's Appointment         │ │
│  └───────────────────────────────┘ │
│                                     │
│  All invited members will no longer │
│  see this event.                    │
├─────────────────────────────────────┤
│        [Cancel] [Delete Personal Event]│
└─────────────────────────────────────┘
```

## 🎨 Color Palette

### Header Section
- **Background:** `bg-red-50` (#FEF2F2)
- **Border:** `border-red-200` (#FECACA)
- **Icon Background:** `bg-red-100` (#FEE2E2)
- **Icon Color:** `text-red-600` (#DC2626)
- **Title:** `text-red-900` (#7F1D1D)
- **Subtitle:** `text-red-700` (#B91C1C)

### Content Section
- **Background:** `bg-white` (#FFFFFF)
- **Text:** `text-gray-700` (#374151)
- **Event Box Background:** `bg-gray-50` (#F9FAFB)
- **Event Box Border:** `border-gray-200` (#E5E7EB)
- **Event Title:** `text-gray-900` (#111827)
- **Helper Text:** `text-gray-600` (#4B5563)

### Footer Section
- **Background:** `bg-gray-50` (#F9FAFB)
- **Border:** `border-gray-200` (#E5E7EB)
- **Cancel Button:**
  - Background: `bg-white` (#FFFFFF)
  - Text: `text-gray-700` (#374151)
  - Border: `border-gray-300` (#D1D5DB)
  - Hover: `hover:bg-gray-50` (#F9FAFB)
- **Delete Button:**
  - Background: `bg-red-600` (#DC2626)
  - Text: `text-white` (#FFFFFF)
  - Hover: `hover:bg-red-700` (#B91C1C)

## 🎬 Animation Sequence

### Opening Animation (0.2s)
```
Frame 1 (0ms):
  Opacity: 0%
  Scale: 95%
  
Frame 2 (100ms):
  Opacity: 50%
  Scale: 97.5%
  
Frame 3 (200ms):
  Opacity: 100%
  Scale: 100%
```

### Visual Effect
```
Before:                 During:                After:
                        
                        ┌─────┐
                        │ ⚠️  │
                        └─────┘
                           ↓
                        Growing
                           ↓
┌─────────┐            ┌─────────┐         ┌─────────┐
│         │            │  ⚠️     │         │  ⚠️     │
│ Hidden  │    →       │ Fading  │    →    │ Visible │
│         │            │ In      │         │         │
└─────────┘            └─────────┘         └─────────┘
Opacity: 0%           Opacity: 50%        Opacity: 100%
Scale: 95%            Scale: 97.5%        Scale: 100%
```

## 🖱️ Interactive States

### Cancel Button States
```
Normal:
┌─────────┐
│ Cancel  │  ← Gray text, white bg, gray border
└─────────┘

Hover:
┌─────────┐
│ Cancel  │  ← Gray text, light gray bg
└─────────┘

Focus:
┌─────────┐
│ Cancel  │  ← Blue ring around button
└─────────┘

Active:
┌─────────┐
│ Cancel  │  ← Slightly darker gray bg
└─────────┘
```

### Delete Button States
```
Normal:
┌──────────────┐
│ Delete Event │  ← White text, red bg
└──────────────┘

Hover:
┌──────────────┐
│ Delete Event │  ← White text, darker red bg
└──────────────┘

Focus:
┌──────────────┐
│ Delete Event │  ← Red ring around button
└──────────────┘

Active:
┌──────────────┐
│ Delete Event │  ← Even darker red bg
└──────────────┘
```

## 📱 Responsive Breakpoints

### Desktop (≥768px)
- Modal width: 448px (max-w-md)
- Padding: 24px
- Button layout: Horizontal
- Font size: Base (16px)

### Tablet (≥640px, <768px)
- Modal width: 90% of screen
- Padding: 20px
- Button layout: Horizontal
- Font size: Base (16px)

### Mobile (<640px)
- Modal width: 95% of screen
- Padding: 16px
- Button layout: Horizontal (may stack)
- Font size: Slightly smaller (14px)

## 🎯 Click Targets

### Minimum Touch Targets (Mobile)
```
Cancel Button:
┌─────────────────┐
│                 │  ← 44px height minimum
│     Cancel      │
│                 │
└─────────────────┘
     ↑
  Minimum 44px width

Delete Button:
┌─────────────────┐
│                 │  ← 44px height minimum
│  Delete Event   │
│                 │
└─────────────────┘
     ↑
  Minimum 44px width
```

## 🔤 Typography

### Header
- **Title:** 18px (text-lg), Semi-bold (font-semibold)
- **Subtitle:** 14px (text-sm), Normal weight

### Content
- **Main Text:** 16px (text-base), Normal weight
- **Event Title:** 16px (text-base), Semi-bold (font-semibold)
- **Helper Text:** 14px (text-sm), Normal weight

### Buttons
- **Text:** 14px (text-sm), Semi-bold (font-semibold)

## 📐 Spacing

### Modal Structure
```
┌─────────────────────────────────────┐
│  ← 24px padding →                   │  ↑
│  ┌───────────────────────────────┐  │  16px
│  │  Header Content               │  │  ↓
│  └───────────────────────────────┘  │
│  ← 1px border →                     │
│  ┌───────────────────────────────┐  │  ↑
│  │                               │  │  20px
│  │  Content Section              │  │  ↓
│  │                               │  │
│  └───────────────────────────────┘  │
│  ← 1px border →                     │
│  ┌───────────────────────────────┐  │  ↑
│  │  Footer Buttons               │  │  16px
│  └───────────────────────────────┘  │  ↓
└─────────────────────────────────────┘
```

### Internal Spacing
- **Header padding:** 24px (px-6 py-4)
- **Content padding:** 24px horizontal, 20px vertical (px-6 py-5)
- **Footer padding:** 24px horizontal, 16px vertical (px-6 py-4)
- **Button gap:** 12px (gap-3)
- **Icon to text gap:** 12px (gap-3)

## 🎨 Shadow & Borders

### Modal Shadow
```
shadow-2xl = 0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

### Border Radius
```
Modal: rounded-2xl (16px)
Buttons: rounded-lg (8px)
Event box: rounded-lg (8px)
Icon circle: rounded-full (50%)
```

### Borders
```
Modal: border border-red-200 (1px solid)
Event box: border border-gray-200 (1px solid)
Cancel button: border border-gray-300 (1px solid)
Section dividers: border-t border-gray-200 (1px solid)
```

## 🌈 Visual Hierarchy

### Importance Levels
```
1. Warning Icon (⚠️)
   - Largest visual element
   - Red color draws attention
   - Circular background

2. Title ("Delete Event?")
   - Large, bold text
   - Red-900 color
   - Top of modal

3. Event Title
   - Highlighted in box
   - Bold text
   - Gray-900 color

4. Delete Button
   - Red background
   - White text
   - Right-aligned

5. Helper Text
   - Smaller, gray text
   - Provides context

6. Cancel Button
   - Gray, less prominent
   - Left-aligned
```

## 🎭 State Diagram

```
┌─────────────┐
│   Closed    │
│  (Hidden)   │
└──────┬──────┘
       │
       │ User clicks Delete
       ▼
┌─────────────┐
│   Opening   │
│ (Animating) │
└──────┬──────┘
       │
       │ Animation complete
       ▼
┌─────────────┐
│    Open     │
│  (Visible)  │
└──────┬──────┘
       │
       ├─────────────┬─────────────┐
       │             │             │
       │ Cancel      │ Delete      │ Backdrop
       │ clicked     │ clicked     │ clicked
       ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Closing   │ │   Closing   │ │   Closing   │
│ (Animating) │ │ (Animating) │ │ (Animating) │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │             │             │
       │             │ Delete      │
       │             │ event       │
       │             ▼             │
       │      ┌─────────────┐     │
       │      │   Deleted   │     │
       │      │  (Success)  │     │
       │      └─────────────┘     │
       │                          │
       └──────────┬───────────────┘
                  │
                  ▼
           ┌─────────────┐
           │   Closed    │
           │  (Hidden)   │
           └─────────────┘
```

## 📊 Comparison: Before vs After

### Before (window.confirm)
```
┌─────────────────────────────┐
│  localhost says:            │
│                             │
│  Delete "Team Meeting"?     │
│                             │
│         [OK]  [Cancel]      │
└─────────────────────────────┘

❌ Basic, unstyled
❌ Browser-dependent appearance
❌ No branding
❌ Limited information
❌ Poor mobile experience
```

### After (Custom Modal)
```
┌─────────────────────────────────────┐
│  ⚠️  Delete Meeting?                │
│      This action cannot be undone   │
├─────────────────────────────────────┤
│  Are you sure you want to delete    │
│  this meeting?                      │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Team Meeting                 │ │
│  └───────────────────────────────┘ │
│                                     │
│  All invited members will be        │
│  notified of the cancellation.      │
├─────────────────────────────────────┤
│              [Cancel] [Delete Meeting]│
└─────────────────────────────────────┘

✅ Professional, branded
✅ Consistent appearance
✅ Clear visual hierarchy
✅ Detailed information
✅ Great mobile experience
```

---

**Visual Design Version:** 1.0.0
**Last Updated:** March 10, 2026
**Status:** ✅ Production Ready
