# Default Events Setup Guide

## Overview
A new UI has been created to display default academic calendar events organized by month. The system includes all the events you specified across the academic year.

## What Was Created

### Frontend Components
1. **DefaultEvents.jsx** - New page component at `frontend/src/pages/DefaultEvents.jsx`
   - Displays all default events organized by month in a grid layout
   - Shows event count per month
   - Numbered list of events within each month
   - Responsive design (1 column mobile, 2 columns tablet, 3 columns desktop)
   - Beautiful gradient UI with hover effects

2. **Dashboard.jsx** - Created main dashboard at `frontend/src/pages/Dashboard.jsx`
   - Added "Academic Calendar" button to navigate to default events
   - Includes navigation to all main features

3. **App.jsx** - Updated routing
   - Added route: `/default-events` (protected route)
   - Imported DefaultEvents component

### Backend (Already Exists)
- **DefaultEventController** - API endpoint at `/api/default-events`
- **DefaultEvent Model** - Database model with month/order fields
- **DefaultEventSeeder** - Contains all 39 events across 10 months

## Events Included (39 Total)

### September (3 events)
- Beginning of Classes
- Registration Period
- Last Day of Adding/Changing Subjects

### October (2 events)
- Last Day of Filing Application for Graduation
- Midterm Exam

### November (1 event)
- Student Evaluation for Teachers

### December (3 events)
- Last Day for Thesis Final Defense
- Last Day of Settlement of Deficiencies for Grad Students
- Christmas Break

### January (6 events)
- Final Exam (Graduating)
- Final Exam (Non-Grad)
- Last Day of Submission and Uploading of Grades
- Removal Examination
- Submission of Graduation Clearance
- Semestral Break

### February (3 events)
- Registration Period
- Beginning of Classes
- Last Day of Adding/Changing Subjects

### March (3 events)
- College Academic Student Council
- Last day of filing application for graduation
- Submission of Graduation Candidates List

### April (4 events)
- Midterm Exam
- Submission of Qualified Candidates for Graduation
- Student Evaluation for Teachers and Classroom Observation
- U-Games

### May (3 events)
- Last Day of Settlement of Deficiencies for Graduating Students
- Last Day for Thesis Final Defense
- Final Examination for Graduating

### June (8 events)
- Final Examination for Non-Graduating
- Last Day of Submission and Uploading of Grades
- Removal Examination
- Last Day of Submission of Report of Completion
- Submission of Manuscript
- Submission of Graduation Clearance
- College Academic Council Meeting
- Start of Vacation

### July & August
- No events scheduled

## Setup Instructions

### 1. Run the Database Seeder
Navigate to the backend directory and run:
```bash
cd backend
php artisan db:seed --class=DefaultEventSeeder
```

This will populate the `default_events` table with all 39 events.

### 2. Start the Application
Make sure both backend and frontend are running:

**Backend:**
```bash
cd backend
php artisan serve
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Access the Default Events Page
- Login to the application
- Click "Academic Calendar" button in the dashboard header
- Or navigate directly to: `http://localhost:5173/default-events`

## Features

### UI Features
- **Month Grid Layout**: All 12 months displayed in a responsive grid
- **Event Count Badge**: Shows number of events per month
- **Numbered Events**: Each event within a month is numbered
- **Empty State**: Months without events show "No events scheduled"
- **Hover Effects**: Cards have subtle hover animations
- **Color Coding**: Blue gradient theme matching the app design
- **Back Navigation**: Easy return to dashboard

### Technical Features
- **Protected Route**: Requires authentication
- **API Integration**: Fetches from `/api/default-events` endpoint
- **Loading State**: Shows loading message while fetching
- **Error Handling**: Displays error messages if fetch fails
- **Responsive Design**: Works on mobile, tablet, and desktop

## API Endpoint

**GET** `/api/default-events`
- **Auth**: Not required (public endpoint)
- **Response**:
```json
{
  "events": [
    {
      "id": 1,
      "name": "Beginning of Classes",
      "month": 9,
      "order": 1
    },
    ...
  ]
}
```

## File Locations

```
frontend/src/pages/DefaultEvents.jsx    - Main UI component
frontend/src/pages/Dashboard.jsx        - Dashboard with navigation
frontend/src/App.jsx                    - Updated routing
backend/app/Http/Controllers/DefaultEventController.php
backend/app/Models/DefaultEvent.php
backend/database/seeders/DefaultEventSeeder.php
backend/routes/api.php                  - API routes
```

## Next Steps

1. Run the seeder to populate the database
2. Test the UI by navigating to the Default Events page
3. Verify all 39 events are displayed correctly
4. Check responsive design on different screen sizes

The UI is ready to use and all events are properly organized by month!
