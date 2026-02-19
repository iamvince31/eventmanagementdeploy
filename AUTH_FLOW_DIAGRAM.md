# Authentication Flow Diagram

## Complete Authentication System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     REGISTRATION FLOW                            │
└─────────────────────────────────────────────────────────────────┘

User visits /register
        │
        ▼
┌───────────────────────┐
│   Step 1: Form        │
│   ─────────────       │
│   • Username          │
│   • Email (CVSU)      │
│   • Department        │
│   • Password          │
│   • Confirm Password  │
└───────────────────────┘
        │
        ▼
Click "Verify" Email
        │
        ▼
┌───────────────────────┐
│  Email Validation     │
│  ────────────────     │
│  Format Check:        │
│  main.first.last      │
│  @cvsu.edu.ph         │
└───────────────────────┘
        │
        ├─── ✅ Valid Format
        │         │
        │         ▼
        │    Green Checkmark
        │    "Email verified"
        │         │
        │         ▼
        │    Click "Create Account"
        │         │
        │         ▼
        │    ┌─────────────────┐
        │    │ Supabase API    │
        │    │ Create User     │
        │    └─────────────────┘
        │         │
        │         ▼
        │    ┌───────────────────────┐
        │    │   Step 2: Success     │
        │    │   ───────────────     │
        │    │   Account Created!    │
        │    │                       │
        │    │   [Setup 2FA]         │
        │    │   [Continue to Login] │
        │    └───────────────────────┘
        │         │
        │         ├─── Setup 2FA
        │         │         │
        │         │         ▼
        │         │    ┌───────────────────┐
        │         │    │  Step 3: 2FA      │
        │         │    │  ────────────     │
        │         │    │  • QR Code        │
        │         │    │  • Secret Key     │
        │         │    │  • Verify Code    │
        │         │    └───────────────────┘
        │         │         │
        │         │         ▼
        │         │    Scan with App
        │         │    (Google Auth, etc.)
        │         │         │
        │         │         ▼
        │         │    Enter 6-digit code
        │         │         │
        │         │         ▼
        │         │    ┌─────────────────┐
        │         │    │ Supabase MFA    │
        │         │    │ Verify & Enable │
        │         │    └─────────────────┘
        │         │         │
        │         │         ▼
        │         │    2FA Enabled ✅
        │         │         │
        │         └─── Continue to Login
        │                   │
        └─── ❌ Invalid Format
                  │
                  ▼
            Error Message
            "Use correct format"


┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                │
└─────────────────────────────────────────────────────────────────┘

User visits /login
        │
        ▼
┌───────────────────────┐
│   Login Form          │
│   ──────────          │
│   • Email (CVSU)      │
│   • Password          │
│   • Remember Me       │
└───────────────────────┘
        │
        ▼
Click "Sign in"
        │
        ▼
┌─────────────────┐
│ Supabase Auth   │
│ signInWithPass  │
└─────────────────┘
        │
        ├─── ✅ Valid Credentials
        │         │
        │         ▼
        │    Check 2FA Status
        │         │
        │         ├─── 2FA Enabled
        │         │         │
        │         │         ▼
        │         │    ┌───────────────────┐
        │         │    │  2FA Code Screen  │
        │         │    │  ───────────────  │
        │         │    │  Enter 6-digit    │
        │         │    │  code from app    │
        │         │    └───────────────────┘
        │         │         │
        │         │         ▼
        │         │    ┌─────────────────┐
        │         │    │ Supabase MFA    │
        │         │    │ Verify Code     │
        │         │    └─────────────────┘
        │         │         │
        │         │         ├─── ✅ Valid Code
        │         │         │         │
        │         │         │         ▼
        │         │         │    Redirect to Dashboard
        │         │         │
        │         │         └─── ❌ Invalid Code
        │         │                   │
        │         │                   ▼
        │         │              Error Message
        │         │              "Invalid code"
        │         │
        │         └─── 2FA Not Enabled
        │                   │
        │                   ▼
        │              Redirect to Dashboard
        │
        └─── ❌ Invalid Credentials
                  │
                  ▼
            Error Message
            "Invalid email or password"


┌─────────────────────────────────────────────────────────────────┐
│                      DASHBOARD ACCESS                            │
└─────────────────────────────────────────────────────────────────┘

User authenticated
        │
        ▼
┌─────────────────┐
│ Supabase        │
│ Session Active  │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Backend Sync    │
│ Verify Token    │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Laravel User    │
│ Load Profile    │
└─────────────────┘
        │
        ▼
Dashboard Loaded ✅
        │
        ├─── View Events
        ├─── Create Events
        ├─── Manage Schedule
        ├─── Account Settings
        └─── Logout


┌─────────────────────────────────────────────────────────────────┐
│                      SYSTEM COMPONENTS                           │
└─────────────────────────────────────────────────────────────────┘

Frontend (React)
├── RegisterUnified.jsx
│   ├── Step 1: Form
│   ├── Step 2: Success
│   └── Step 3: 2FA Setup
│
├── LoginUnified.jsx
│   ├── Login Form
│   └── 2FA Code Input
│
├── SupabaseAuthContext.jsx
│   ├── signUp()
│   ├── signIn()
│   ├── enrollMFA()
│   ├── verifyMFA()
│   └── signOut()
│
└── supabase.js
    └── Supabase Client

Backend (Laravel)
├── EmailVerificationService.php
│   └── verifyCVSUEmail()
│       └── Format Validation
│
├── SupabaseService.php
│   ├── verifyToken()
│   ├── getUserById()
│   └── updateUserMetadata()
│
├── EmailVerificationController.php
│   └── POST /api/email/verify
│
└── SupabaseAuthController.php
    ├── POST /api/auth/supabase/verify-token
    └── POST /api/auth/supabase/send-password-reset

Supabase (Cloud)
├── Authentication
│   ├── Users Table
│   ├── Sessions
│   └── MFA Factors
│
└── API
    ├── signUp
    ├── signInWithPassword
    ├── mfa.enroll
    └── mfa.verify


┌─────────────────────────────────────────────────────────────────┐
│                      DATA FLOW                                   │
└─────────────────────────────────────────────────────────────────┘

Registration:
Frontend → Backend (verify email) → Frontend (create user) → Supabase

Login:
Frontend → Supabase (authenticate) → Backend (sync user) → Frontend

2FA Setup:
Frontend → Supabase (enroll MFA) → Frontend (show QR) → User (scan) → 
Frontend → Supabase (verify code) → Frontend (enabled)

2FA Login:
Frontend → Supabase (sign in) → Frontend (show 2FA input) → User (enter code) →
Frontend → Supabase (verify MFA) → Backend (sync) → Frontend (dashboard)


┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Email Validation
├── Format: main.firstname.lastname@cvsu.edu.ph
├── Pattern matching
└── Instant validation

Layer 2: Password Security
├── Minimum 6 characters
├── Confirmation required
└── Supabase encryption

Layer 3: Supabase Authentication
├── JWT tokens
├── Session management
└── Secure API calls

Layer 4: Optional 2FA
├── TOTP (Time-based OTP)
├── 6-digit codes
├── 30-second rotation
└── Authenticator app required

Layer 5: Backend Verification
├── Token validation
├── User sync
└── Session verification


┌─────────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING                              │
└─────────────────────────────────────────────────────────────────┘

Email Validation Errors:
├── Invalid format → "Use correct CVSU email format"
├── Not CVSU domain → "Must be CVSU email"
└── Empty field → "Please enter email"

Registration Errors:
├── Password mismatch → "Passwords do not match"
├── Short password → "At least 6 characters"
├── Missing department → "Please select department"
├── Email exists → "Email already registered"
└── Network error → "Registration failed, try again"

Login Errors:
├── Invalid credentials → "Invalid email or password"
├── Invalid 2FA code → "Invalid code, try again"
├── Network error → "Login failed, try again"
└── Session expired → Redirect to login

2FA Errors:
├── Invalid code → "Invalid code, try again"
├── Enrollment failed → "Failed to setup 2FA"
└── Verification timeout → "Code expired, try again"


┌─────────────────────────────────────────────────────────────────┐
│                      USER EXPERIENCE                             │
└─────────────────────────────────────────────────────────────────┘

Registration: ~2-3 minutes
├── Fill form: 1 min
├── Email verify: Instant
├── Create account: 5 sec
└── Setup 2FA (optional): 1-2 min

Login (no 2FA): ~10 seconds
├── Enter credentials: 5 sec
└── Authenticate: 5 sec

Login (with 2FA): ~20 seconds
├── Enter credentials: 5 sec
├── Authenticate: 5 sec
├── Get code from app: 5 sec
└── Verify 2FA: 5 sec

Dashboard Load: ~2 seconds
├── Verify session: 1 sec
└── Load data: 1 sec
```

## Key Features

### ✅ Implemented
- CVSU email validation (format check)
- Supabase user creation
- Optional 2FA with QR code
- Automatic 2FA detection on login
- Session management
- Password reset flow
- User profile sync

### 🔒 Security Features
- Email format validation
- Password confirmation
- JWT token authentication
- Optional TOTP 2FA
- Session expiration
- Secure API calls

### 🎨 User Experience
- 3-step registration
- Instant email validation
- Optional 2FA (not forced)
- Smooth 2FA input
- Clear error messages
- Loading states

## Testing Paths

### Path 1: Registration without 2FA
```
/register → Fill form → Verify email → Create account → 
Continue to login → /login → Enter credentials → /dashboard
```

### Path 2: Registration with 2FA
```
/register → Fill form → Verify email → Create account → 
Setup 2FA → Scan QR → Verify code → /login → 
Enter credentials → Enter 2FA code → /dashboard
```

### Path 3: Login without 2FA
```
/login → Enter credentials → /dashboard
```

### Path 4: Login with 2FA
```
/login → Enter credentials → Enter 2FA code → /dashboard
```

---

**Use this diagram to understand the complete authentication flow!**
