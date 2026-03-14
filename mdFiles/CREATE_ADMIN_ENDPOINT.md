# Create Admin Endpoint

## Overview
A new endpoint has been added to allow bootstrap admins to create new admin users directly, rather than promoting existing users to admin role.

## Endpoint Details

**URL:** `POST /api/users/create-admin`

**Authentication:** Required (Bearer token)

**Authorization:** Only bootstrap admins (`is_bootstrap = true`)

## Request Body

```json
{
  "name": "Admin Name",
  "email": "admin@cvsu.edu.ph",
  "password": "secure11111111",
  "password_confirmation": "secure11111111",
  "department": "IT Department"
}
```

## Validation Rules

- `name`: Required, string, max 255 characters
- `email`: Required, valid email, unique, must be @cvsu.edu.ph domain
- `password`: Required, min 8 characters, must match confirmation
- `password_confirmation`: Required, must match password
- `department`: Required, string, max 255 characters

## Response

### Success (201 Created)
```json
{
  "message": "Admin account created successfully! Verification email sent.",
  "user": {
    "id": 5,
    "username": "Admin Name",
    "email": "admin@cvsu.edu.ph",
    "department": "IT Department",
    "role": "admin"
  },
  "requires_verification": true
}
```

### Error Responses

**403 Forbidden** - Not a bootstrap admin
```json
{
  "message": "Unauthorized. Only bootstrap admin can create new admins."
}
```

**400 Bad Request** - Invalid CVSU email
```json
{
  "message": "Email verification failed message"
}
```

**422 Unprocessable Entity** - Validation errors
```json
{
  "message": "The email has already been taken.",
  "errors": {
    "email": ["The email has already been taken."]
  }
}
```

## Features

1. **Email Verification**: New admin receives a verification OTP via email
2. **CVSU Email Validation**: Verifies the email exists in CVSU system
3. **Secure Password**: Password is hashed before storage
4. **Logging**: All admin creation attempts are logged
5. **Bootstrap Flag**: New admin is created with `is_bootstrap = false` (permanent admin)

## Difference from `updateRole` Endpoint

- **`POST /users/create-admin`**: Creates a NEW admin user from scratch
- **`PUT /users/{id}/role`**: Changes the role of an EXISTING user

## Usage Example

```javascript
// Frontend example
const createAdmin = async (adminData) => {
  const response = await fetch('/api/users/create-admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: adminData.name,
      email: adminData.email,
      password: adminData.password,
      password_confirmation: adminData.passwordConfirmation,
      department: adminData.department
    })
  });
  
  return await response.json();
};
```
