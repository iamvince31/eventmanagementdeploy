# Supabase Authentication Setup Guide
## Laravel + React Integration with 2FA and OTP

This guide provides a complete setup for integrating Supabase authentication with your Laravel backend, including Two-Factor Authentication (2FA) and OTP for password reset.

---

## Table of Contents
1. [Supabase Project Setup](#1-supabase-project-setup)
2. [Laravel Backend Configuration](#2-laravel-backend-configuration)
3. [Frontend React Configuration](#3-frontend-react-configuration)
4. [Two-Factor Authentication (2FA)](#4-two-factor-authentication-2fa)
5. [OTP Password Reset](#5-otp-password-reset)
6. [Testing & Verification](#6-testing--verification)

---

## 1. Supabase Project Setup

### Step 1.1: Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name**: `event-management-system`
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for development

### Step 1.2: Get API Keys
1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (for frontend)
   - **service_role key**: `eyJhbGc...` (for backend - keep secret!)

### Step 1.3: Configure Authentication Settings
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure settings:
   - ✅ Enable email confirmations
   - ✅ Enable email change confirmations
   - ✅ Secure email change
   - Set **Site URL**: `http://localhost:5173` (your React app URL)
   - Set **Redirect URLs**: 
     - `http://localhost:5173/auth/callback`
     - `http://localhost:5173/reset-password`

### Step 1.4: Configure Email Templates
1. Go to **Authentication** → **Email Templates**
2. Customize templates for:
   - **Confirm signup**: Welcome email with verification link
   - **Reset password**: OTP code email
   - **Magic Link**: (optional)
   - **Change Email Address**: Confirmation email

### Step 1.5: Enable Multi-Factor Authentication (MFA)
1. Go to **Authentication** → **Policies**
2. Enable **Phone Auth** (for SMS-based 2FA) or **TOTP** (for authenticator apps)
3. For SMS: Configure Twilio or another SMS provider
4. For TOTP: No additional setup needed

---

## 2. Laravel Backend Configuration

### Step 2.1: Install Supabase PHP Client
```bash
cd backend
composer require supabase/supabase-php
```

### Step 2.2: Add Environment Variables
Add to `backend/.env`:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# Email Configuration (for OTP)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"
```

### Step 2.3: Create Supabase Service
Create `backend/app/Services/SupabaseService.php`:
```php
<?php

namespace App\Services;

use Supabase\CreateClient;

class SupabaseService
{
    protected $client;

    public function __construct()
    {
        $this->client = CreateClient(
            config('services.supabase.url'),
            config('services.supabase.key')
        );
    }

    /**
     * Verify Supabase JWT token
     */
    public function verifyToken($token)
    {
        try {
            $response = $this->client->auth->getUser($token);
            return $response;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get user by email
     */
    public function getUserByEmail($email)
    {
        try {
            $response = $this->client->auth->admin->listUsers([
                'filter' => "email.eq.$email"
            ]);
            return $response->users[0] ?? null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Send password reset OTP
     */
    public function sendPasswordResetOTP($email)
    {
        try {
            $response = $this->client->auth->resetPasswordForEmail($email, [
                'redirectTo' => config('app.frontend_url') . '/reset-password'
            ]);
            return $response;
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Verify OTP code
     */
    public function verifyOTP($email, $token, $type = 'recovery')
    {
        try {
            $response = $this->client->auth->verifyOtp([
                'email' => $email,
                'token' => $token,
                'type' => $type
            ]);
            return $response;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Enable MFA for user
     */
    public function enrollMFA($userId)
    {
        try {
            $response = $this->client->auth->mfa->enroll([
                'factorType' => 'totp',
                'friendlyName' => 'Authenticator App'
            ]);
            return $response;
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Verify MFA challenge
     */
    public function verifyMFA($factorId, $code)
    {
        try {
            $response = $this->client->auth->mfa->challengeAndVerify([
                'factorId' => $factorId,
                'code' => $code
            ]);
            return $response;
        } catch (\Exception $e) {
            return null;
        }
    }
}
```

### Step 2.4: Update Config
Add to `backend/config/services.php`:
```php
'supabase' => [
    'url' => env('SUPABASE_URL'),
    'key' => env('SUPABASE_KEY'),
    'jwt_secret' => env('SUPABASE_JWT_SECRET'),
],
```

### Step 2.5: Create Enhanced Auth Controller
Create `backend/app/Http/Controllers/SupabaseAuthController.php`:
```php
<?php

namespace App\Http\Controllers;

use App\Services\SupabaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\User;

class SupabaseAuthController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    /**
     * Verify Supabase token and sync with local database
     */
    public function verifyToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $supabaseUser = $this->supabase->verifyToken($request->token);

        if (!$supabaseUser) {
            return response()->json(['message' => 'Invalid token'], 401);
        }

        // Sync with local database
        $user = User::updateOrCreate(
            ['email' => $supabaseUser->email],
            [
                'username' => $supabaseUser->user_metadata['username'] ?? explode('@', $supabaseUser->email)[0],
                'supabase_id' => $supabaseUser->id,
                'email_verified_at' => $supabaseUser->email_confirmed_at,
            ]
        );

        return response()->json([
            'user' => $user,
            'supabase_user' => $supabaseUser
        ]);
    }

    /**
     * Send password reset OTP
     */
    public function sendPasswordResetOTP(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $this->supabase->sendPasswordResetOTP($request->email);

            return response()->json([
                'message' => 'Password reset OTP sent to your email'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send OTP',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify password reset OTP
     */
    public function verifyPasswordResetOTP(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $result = $this->supabase->verifyOTP($request->email, $request->token, 'recovery');

        if (!$result) {
            return response()->json(['message' => 'Invalid or expired OTP'], 401);
        }

        return response()->json([
            'message' => 'OTP verified successfully',
            'access_token' => $result->access_token
        ]);
    }

    /**
     * Enroll in MFA
     */
    public function enrollMFA(Request $request)
    {
        try {
            $result = $this->supabase->enrollMFA($request->user()->supabase_id);

            return response()->json([
                'qr_code' => $result->totp->qr_code,
                'secret' => $result->totp->secret,
                'factor_id' => $result->id
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to enroll in MFA',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify MFA code
     */
    public function verifyMFA(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'factor_id' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $result = $this->supabase->verifyMFA($request->factor_id, $request->code);

        if (!$result) {
            return response()->json(['message' => 'Invalid MFA code'], 401);
        }

        return response()->json([
            'message' => 'MFA verified successfully',
            'access_token' => $result->access_token
        ]);
    }
}
```

### Step 2.6: Add Routes
Add to `backend/routes/api.php`:
```php
use App\Http\Controllers\SupabaseAuthController;

// Supabase Authentication Routes
Route::prefix('auth/supabase')->group(function () {
    Route::post('/verify-token', [SupabaseAuthController::class, 'verifyToken']);
    Route::post('/send-password-reset-otp', [SupabaseAuthController::class, 'sendPasswordResetOTP']);
    Route::post('/verify-password-reset-otp', [SupabaseAuthController::class, 'verifyPasswordResetOTP']);
    
    // MFA Routes (protected)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/mfa/enroll', [SupabaseAuthController::class, 'enrollMFA']);
        Route::post('/mfa/verify', [SupabaseAuthController::class, 'verifyMFA']);
    });
});
```

### Step 2.7: Update User Migration
Add to your users table migration:
```php
$table->string('supabase_id')->nullable()->unique();
$table->boolean('mfa_enabled')->default(false);
$table->string('mfa_factor_id')->nullable();
```

Run migration:
```bash
php artisan migrate
```

---

## 3. Frontend React Configuration

### Step 3.1: Install Supabase Client
```bash
cd frontend
npm install @supabase/supabase-js
```

### Step 3.2: Create Supabase Client
Create `frontend/src/services/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

### Step 3.3: Add Environment Variables
Create/update `frontend/.env`:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=http://localhost:8000/api
```

### Step 3.4: Create Enhanced Auth Context
Create `frontend/src/context/SupabaseAuthContext.jsx`:
```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import api from '../services/api';

const SupabaseAuthContext = createContext();

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        syncWithBackend(session.access_token);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        syncWithBackend(session.access_token);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncWithBackend = async (token) => {
    try {
      const response = await api.post('/auth/supabase/verify-token', { token });
      setUser(response.data.user);
      localStorage.setItem('token', token);
    } catch (error) {
      console.error('Failed to sync with backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Check if MFA is required
    if (data.user?.factors && data.user.factors.length > 0) {
      setMfaRequired(true);
      return { requiresMfa: true, factorId: data.user.factors[0].id };
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    localStorage.removeItem('token');
  };

  const sendPasswordResetOTP = async (email) => {
    const response = await api.post('/auth/supabase/send-password-reset-otp', { email });
    return response.data;
  };

  const verifyPasswordResetOTP = async (email, token) => {
    const response = await api.post('/auth/supabase/verify-password-reset-otp', {
      email,
      token,
    });
    return response.data;
  };

  const resetPassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  };

  const enrollMFA = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App',
    });

    if (error) throw error;
    return data;
  };

  const verifyMFA = async (factorId, code) => {
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code,
    });

    if (error) throw error;
    setMfaRequired(false);
    return data;
  };

  const value = {
    user,
    session,
    loading,
    mfaRequired,
    signUp,
    signIn,
    signOut,
    sendPasswordResetOTP,
    verifyPasswordResetOTP,
    resetPassword,
    enrollMFA,
    verifyMFA,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};
```

---

## 4. Two-Factor Authentication (2FA)

### Step 4.1: Create MFA Setup Page
Create `frontend/src/pages/MFASetup.jsx`:
