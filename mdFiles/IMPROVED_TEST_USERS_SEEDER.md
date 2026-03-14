# Improved Test Users Seeder

## Overview
The TestUsersSeeder has been completely restructured to match the actual department structure used in the admin panel and properly organize users by college and department levels.

## Changes Made

### 1. Department Structure
**Old departments (generic):**
- Computer Science
- Information Technology
- Computer Engineering
- Electrical Engineering
- Mechanical Engineering

**New departments (matching admin panel):**
- DAFE: Department of Agricultural and Food Engineering
- DCEEE: Department of Civil and Environmental Engineering and Energy
- DCEA: Department of Computer Engineering and Architecture
- DIET: Department of Industrial and Electrical Technology
- DIT: Department of Information Technology

### 2. User Distribution

#### College Level (College of Engineering and Information Technology)
- **1 Dean** - Oversees the entire college
- **10 CEIT Officials** - College-level officials
- **10 Coordinators** - College-level coordinators

#### Department Level (Per Department × 5)
- **1 Chairperson** - Heads each department
- **10 Faculty Members** - Teaching staff per department
- **10 Staff** - Administrative staff per department

### 3. Total User Count
- 1 Admin
- 1 Dean
- 10 CEIT Officials
- 10 Coordinators
- 5 Chairpersons (1 per department)
- 50 Faculty Members (10 per department)
- 50 Staff (10 per department)
- **Total: 127 users**

### 4. Email Format
- **Admin:** `admin@cvsu.edu.ph`
- **Dean:** `dean.rodriguez@cvsu.edu.ph`
- **CEIT Officials:** `[firstname].[lastname].ceit[1-10]@cvsu.edu.ph`
- **Coordinators:** `[firstname].[lastname].coord[1-10]@cvsu.edu.ph`
- **Chairpersons:** `[firstname].[lastname].chair.[DEPT]@cvsu.edu.ph`
- **Faculty:** `[firstname].[lastname].fac[1-10].[DEPT]@cvsu.edu.ph`
- **Staff:** `[firstname].[lastname].staff[1-10].[DEPT]@cvsu.edu.ph`

Where `[DEPT]` is the department code: DAFE, DCEEE, DCEA, DIET, or DIT

### 5. Sample Accounts
```
Admin:       admin@cvsu.edu.ph
Dean:        dean.rodriguez@cvsu.edu.ph
CEIT:        maria.santos.ceit1@cvsu.edu.ph
Coordinator: carlos.aquino.coord1@cvsu.edu.ph
Chair (DIT): anna.delacruz.chair.DIT@cvsu.edu.ph
Faculty:     jennifer.lopez.fac1.DIT@cvsu.edu.ph
Staff:       gloria.perez.staff1.DIT@cvsu.edu.ph
```

All passwords: `11111111`

## Usage

Run the seeder:
```bash
php artisan db:seed --class=TestUsersSeeder
```

Or include it in DatabaseSeeder:
```php
$this->call([
    TestUsersSeeder::class,
]);
```

## Key Improvements

1. **Proper Hierarchy**: Dean, CEIT Officials, and Coordinators are now correctly assigned to the college level
2. **Department Alignment**: Departments now match exactly what's in the admin panel
3. **Realistic Scale**: 10 users per role provides sufficient test data
4. **Clear Email Patterns**: Easy to identify user roles and departments from email addresses
5. **Better Organization**: Code is well-structured with clear sections and comments
6. **Informative Output**: Seeder provides detailed summary of created users

## Role Restrictions (As Per System Design)

### College Level Roles (No Department Restrictions)
- **Dean**: Can create events, invite anyone
- **CEIT Officials**: Can create events, invite anyone
- **Coordinators**: Can create events, invite anyone

### Department Level Roles
- **Chairpersons**: Can create events, invite anyone
- **Faculty Members**: Must request events (requires approval), can only invite Faculty/Staff
- **Staff**: Must request events (requires approval), can only invite Faculty/Staff

## Notes

- All users are pre-validated (`is_validated = true`)
- All users have verified emails (`email_verified_at = now()`)
- All users have initialized schedules (`schedule_initialized = true`)
- The seeder checks for existing users and won't create duplicates
- Provides detailed statistics and sample accounts after seeding
