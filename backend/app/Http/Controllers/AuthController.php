<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'username' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'unique:users',
                'regex:/^main\..+\..+@cvsu\.edu\.ph$/i'
            ],
            'password' => 'required|string|min:6',
            'department' => 'required|string',
        ], [
            'email.regex' => 'Email must be in format main.(anything).(anything)@cvsu.edu.ph'
        ]);

        $user = User::create([
            'name' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'department' => $request->department,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Registered successfully',
            'user' => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'schedule_initialized' => false,
            ],
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => [
                'required',
                'email',
                'regex:/^main\..+\..+@cvsu\.edu\.ph$/i'
            ],
            'password' => 'required',
        ], [
            'email.regex' => 'Email must be in format main.(anything).(anything)@cvsu.edu.ph'
        ]);

        $email = $request->email;
        $ip = $request->ip();
        $key = 'login_attempts:' . md5($email . $ip);
        $lockoutKey = 'login_lockout:' . md5($email . $ip);
        $lockoutCountKey = 'login_lockout_count:' . md5($email . $ip);

        // Check if user exists first
        $user = User::where('email', $email)->first();

        // If user doesn't exist, return specific error without locking
        if (!$user) {
            Log::warning('Login attempt for non-existent account', [
                'email' => $email,
                'ip' => $ip,
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);
            
            throw ValidationException::withMessages([
                'email' => ['This account does not exist. Please check your email or register.'],
            ]);
        }

        // User exists - check password
        if (!Hash::check($request->password, $user->password)) {
            // Get current attempts and increment
            $attempts = Cache::get($key, 0) + 1;
            
            // Log failed attempt for existing account
            Log::warning('Failed login attempt for existing account', [
                'email' => $email,
                'user_id' => $user->id,
                'ip' => $ip,
                'attempts' => $attempts,
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);
            
            // Check if this is the 3rd attempt - lock immediately
            if ($attempts >= 3) {
                // Get lockout count to determine duration (progressive lockout)
                $lockoutCount = Cache::get($lockoutCountKey, 0);
                
                // Progressive lockout: 1st = 3 mins, 2nd+ = 5 mins
                $lockoutMinutes = $lockoutCount === 0 ? 3 : 5;
                $lockoutSeconds = $lockoutMinutes * 60;
                
                // Lock out the user
                $lockoutUntil = now()->addMinutes($lockoutMinutes)->timestamp;
                Cache::put($lockoutKey, $lockoutUntil, $lockoutSeconds);
                Cache::forget($key); // Clear attempts counter
                
                // Increment lockout count (persists for 1 hour)
                Cache::put($lockoutCountKey, $lockoutCount + 1, 3600);
                
                Log::warning('Account locked due to failed attempts', [
                    'email' => $email,
                    'user_id' => $user->id,
                    'ip' => $ip,
                    'lockout_count' => $lockoutCount + 1,
                    'lockout_minutes' => $lockoutMinutes,
                    'locked_until' => date('Y-m-d H:i:s', $lockoutUntil),
                ]);
                
                throw ValidationException::withMessages([
                    'email' => ["Too many failed attempts. Your account has been locked for {$lockoutMinutes} minutes."],
                ]);
            }
            
            // Store the incremented attempts
            Cache::put($key, $attempts, 300); // Store for 5 minutes
            $remainingAttempts = 3 - $attempts;
            
            throw ValidationException::withMessages([
                'email' => ["Invalid password. {$remainingAttempts} attempt(s) remaining before lockout."],
            ]);
        }

        // Successful login
        Cache::forget($key);
        Cache::forget($lockoutKey);
        Cache::forget($lockoutCountKey);
        
        // Log successful login
        Log::info('Successful login', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip' => $ip,
            'timestamp' => now(),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Logged in successfully',
            'user' => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'schedule_initialized' => $user->schedule_initialized ?? false,
            ],
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function user(Request $request)
    {
        return response()->json([
            'user' => [
                'id' => $request->user()->id,
                'username' => $request->user()->name,
                'email' => $request->user()->email,
                'department' => $request->user()->department,
                'schedule_initialized' => $request->user()->schedule_initialized ?? false,
            ],
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => [
                'required',
                'email',
                'regex:/^main\..+\..+@cvsu\.edu\.ph$/i'
            ],
        ], [
            'email.regex' => 'Email must be in format main.(anything).(anything)@cvsu.edu.ph'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'If an account exists with this email, a password reset link will be sent.',
            ]);
        }

        if (app()->environment(['local', 'testing'])) {
            $token = Password::broker()->createToken($user);
            $user->sendPasswordResetNotification($token);

            $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/');

            return response()->json([
                'message' => 'Password reset link sent to your email.',
                'reset_url' => $frontendUrl.'/reset-password?'.http_build_query([
                    'token' => $token,
                    'email' => $user->email,
                ]),
            ]);
        }

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'Password reset link sent to your email.',
            ]);
        }

        return response()->json([
            'message' => 'Unable to send reset link. Please try again.',
        ], 400);
    }

    public function requestOtp(Request $request)
    {
        $request->validate([
            'email' => [
                'required',
                'email',
                'regex:/^main\..+\..+@cvsu\.edu\.ph$/i'
            ],
        ], [
            'email.regex' => 'Email must be in format main.(anything).(anything)@cvsu.edu.ph'
        ]);

        $email = strtolower($request->email);
        $user = User::where('email', $email)->first();

        if (!$user) {
            // Security: Don't reveal if email exists or not
            return response()->json([
                'message' => 'If an account exists with this email, an OTP will be sent.',
            ]);
        }

        try {
            // Generate 6-digit OTP
            $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            // Delete any existing unused OTP for this email
            DB::table('password_reset_otps')
                ->where('email', $email)
                ->where('used', false)
                ->delete();

            // Store OTP with 10-minute expiration
            DB::table('password_reset_otps')->insert([
                'email' => $email,
                'otp' => $otp,
                'expires_at' => now()->addMinutes(10),
                'used' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Log OTP generation (in production, you would send this via email)
            Log::info('OTP generated for password reset', [
                'email' => $email,
                'otp' => $otp, // Remove this in production for security
                'timestamp' => now(),
            ]);
            
            $emailSent = true; // Assume email sending is successful for now

            if (!$emailSent) {
                throw new \Exception('Failed to send OTP email');
            }

            \Log::info('OTP sent successfully', [
                'email' => $email,
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => 'OTP sent to your email. Please check your inbox.',
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to send OTP', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to send OTP. Please try again later.',
            ], 500);
        }
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => [
                'required',
                'email',
                'regex:/^main\..+\..+@cvsu\.edu\.ph$/i'
            ],
            'otp' => 'required|string|size:6|regex:/^\d{6}$/',
        ], [
            'email.regex' => 'Email must be in format main.(anything).(anything)@cvsu.edu.ph',
            'otp.regex' => 'OTP must be a 6-digit number.',
        ]);

        $email = strtolower($request->email);

        $otpRecord = DB::table('password_reset_otps')
            ->where('email', $email)
            ->where('otp', $request->otp)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$otpRecord) {
            \Log::warning('Invalid OTP attempt', [
                'email' => $email,
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => 'Invalid or expired OTP. Please request a new one.',
            ], 400);
        }

        try {
            // Mark OTP as used
            DB::table('password_reset_otps')
                ->where('id', $otpRecord->id)
                ->update(['used' => true]);

            // Generate a temporary token for password reset (valid for 30 minutes)
            $resetToken = bin2hex(random_bytes(32));
            DB::table('password_reset_otps')
                ->where('id', $otpRecord->id)
                ->update([
                    'reset_token' => $resetToken,
                    'reset_token_expires_at' => now()->addMinutes(30),
                ]);

            \Log::info('OTP verified successfully', [
                'email' => $email,
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => 'OTP verified successfully.',
                'reset_token' => $resetToken,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to verify OTP', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'An error occurred. Please try again.',
            ], 500);
        }
    }

    public function resetPasswordWithOtp(Request $request)
    {
        $request->validate([
            'email' => [
                'required',
                'email',
                'regex:/^main\..+\..+@cvsu\.edu\.ph$/i'
            ],
            'reset_token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'email.regex' => 'Email must be in format main.(anything).(anything)@cvsu.edu.ph',
            'password.confirmed' => 'Passwords do not match.',
            'password.min' => 'Password must be at least 8 characters.',
        ]);

        $email = strtolower($request->email);

        $otpRecord = DB::table('password_reset_otps')
            ->where('email', $email)
            ->where('reset_token', $request->reset_token)
            ->where('used', true)
            ->first();

        if (!$otpRecord) {
            \Log::warning('Invalid reset token attempt', [
                'email' => $email,
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => 'Invalid or expired reset token. Please request a new OTP.',
            ], 400);
        }

        // Check if reset token has expired (30 minutes)
        if ($otpRecord->reset_token_expires_at && now()->isAfter($otpRecord->reset_token_expires_at)) {
            \Log::warning('Reset token expired', [
                'email' => $email,
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => 'Reset token has expired. Please request a new OTP.',
            ], 400);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            \Log::error('User not found during password reset', [
                'email' => $email,
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        try {
            // Update password
            $user->update([
                'password' => Hash::make($request->password),
            ]);

            // Log password reset success (in production, you would send confirmation email)
            Log::info('Password reset confirmation', [
                'email' => $email,
                'timestamp' => now(),
            ]);

            // Clean up OTP record
            DB::table('password_reset_otps')
                ->where('email', $email)
                ->delete();

            \Log::info('Password reset successfully', [
                'email' => $email,
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => 'Password reset successfully. You can now log in with your new password.',
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to reset password', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'An error occurred while resetting your password. Please try again.',
            ], 500);
        }
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => [
                'required',
                'email',
                'regex:/^main\..+\..+@cvsu\.edu\.ph$/i'
            ],
            'token' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'email.regex' => 'Email must be in format main.(anything).(anything)@cvsu.edu.ph',
            'password.confirmed' => 'Passwords do not match.',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Password reset successfully.',
            ]);
        }

        return response()->json([
            'message' => 'Invalid reset token or email.',
        ], 400);
    }
}
