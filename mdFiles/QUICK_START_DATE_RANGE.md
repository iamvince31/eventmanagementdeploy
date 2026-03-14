# Quick Start: Date Range Feature

## 🚀 Installation (3 Steps)

### Step 1: Run Migration
```bash
# Double-click this file:
RUN_DATE_RANGE_MIGRATION.bat

# Or run manually:
cd backend
php artisan migrate --path=database/migrations/2026_03_02_100000_add_end_date_to_default_events_table.php
```

### Step 2: Test (Optional)
```bash
cd backend
php test-date-range.php
```

### Step 3: Restart Servers
```bash
# Backend
cd backend
php artisan serve

# Frontend (in new terminal)
cd frontend
npm run dev
```

## ✨ What You Get

### Before
- Events could only have a single date
- Multi-day events (exams, breaks) looked like single days

### After
- Events can have start AND end dates
- Multi-day events display as ranges
- Single-day events work exactly as before

## 📝 Usage

1. Go to **Academic Calendar** page
2. Click **Edit** on any event
3. Set **Start Date** (required)
4. Set **End Date** (optional) for multi-day events
5. Click **Save**

## 📅 Display Examples

| Input | Display |
|-------|---------|
| Oct 15 only | Oct 15, 2024 |
| Oct 15 - Oct 19 | Oct 15 - 19, 2024 |
| Dec 20 - Jan 5 | Dec 20, 2024 - Jan 5, 2025 |

## ✅ Validation

- End date must be ≥ start date
- Both dates must be within school year (Sept-Aug)
- Validated on both frontend and backend

## 🎯 Use Cases

Perfect for:
- **Midterm Exams** (Oct 15-19)
- **Final Exams** (Dec 10-14)
- **Winter Break** (Dec 20 - Jan 5)
- **Orientation Week** (Sept 1-5)
- **Registration Period** (Aug 15-25)

## 🔧 Files Changed

- ✅ Database: Added `end_date` column
- ✅ Backend: Updated model & controller
- ✅ Frontend: Enhanced UI with two date pickers

## 📚 More Info

- **Complete Guide**: `DATE_RANGE_FEATURE_GUIDE.md`
- **Implementation Details**: `DATE_RANGE_IMPLEMENTATION_SUMMARY.md`
- **Test Script**: `backend/test-date-range.php`

---

**That's it!** Run the migration and start using date ranges. 🎉
