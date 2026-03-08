# Test Accounts

This seeder creates test accounts for development and testing purposes.

## Running the Seeder

```bash
php artisan db:seed --class=TestUsersSeeder
```

Or run all seeders:
```bash
php artisan db:seed
```

## Account Structure

All test accounts use the password: `11111111`

### Leadership (2 accounts)
- 1 Admin: `admin@cvsu.edu.ph`
- 1 Dean: `dean.rodriguez@cvsu.edu.ph`

### Departments (5 departments)
- Computer Science
- Information Technology
- Computer Engineering
- Electrical Engineering
- Mechanical Engineering

### Per Department (10 accounts each, 50 total)
- 1 Chairperson
- 5 Coordinators
- 5 Faculty Members

### Chairpersons (5 accounts)
| Name | Email | Department |
|------|-------|------------|
| Maria Santos Garcia | maria.garcia@cvsu.edu.ph | Computer Science |
| John Paul Rivera | john.rivera@cvsu.edu.ph | Information Technology |
| Sarah Anne Reyes | sarah.reyes@cvsu.edu.ph | Computer Engineering |
| Michael James Cruz | michael.cruz@cvsu.edu.ph | Electrical Engineering |
| Anna Marie Dela Cruz | anna.delacruz@cvsu.edu.ph | Mechanical Engineering |

### Coordinators (25 accounts - 5 per department)
Email format: `firstname.lastname.coord#.department@cvsu.edu.ph`

Examples:
- `carlos.santos.coord0.computerscience@cvsu.edu.ph`
- `elena.mendoza.coord1.informationtechnology@cvsu.edu.ph`

### Faculty Members (25 accounts - 5 per department)
Email format: `firstname.lastname.fac#.department@cvsu.edu.ph`

Examples:
- `jennifer.lopez.fac0.computerscience@cvsu.edu.ph`
- `antonio.gonzales.fac1.informationtechnology@cvsu.edu.ph`

## Total Accounts: 52
- 1 Admin
- 1 Dean
- 5 Chairpersons
- 25 Coordinators
- 25 Faculty Members

## Features

- All users are pre-validated and email verified
- Schedules are initialized for all users
- Seeder checks for existing users to prevent duplicates
- Only runs in local/development/testing environments (when called via DatabaseSeeder)
- Realistic organizational structure with proper hierarchy

## Testing Scenarios

1. **Admin Access**: Login as `admin@cvsu.edu.ph` to test full system features
2. **Dean Operations**: Login as `dean.rodriguez@cvsu.edu.ph` to create events without approval
3. **Approval Workflow**: Create event as chairperson, approve as dean
4. **Department Testing**: Test with different departments using their respective chairpersons
5. **Multi-user Testing**: Use coordinators and faculty to test event participation and viewing
