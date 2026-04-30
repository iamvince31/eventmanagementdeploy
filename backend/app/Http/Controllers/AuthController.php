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
use App\Services\EmailVerificationService;
use App\Services\BrevoMailService;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_initial' => 'nullable|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'regex:/^[a-zA-Z0-9._%+-]+@cvsu\.edu\.ph$/i'
            ],
            'password' => 'required|string|min:6',
            'department' => 'required|string|max:255',
            'role' => 'required|in:Dean,CEIT Official,Chairperson,Department Research Coordinator,Department Extension Coordinator,Faculty Member',
        ], [
            'email.regex' => 'Only @cvsu.edu.ph email addresses are allowed.',
            'department.required' => 'Please select your department.',
            'role.required' => 'Please select your position/role.',
            'role.in' => 'Invalid role selected.',
        ]);

        $email = strtolower(trim($request->email));

        // Block duplicate registrations
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            return response()->json([
                'message' => 'This email is already registered. Please log in instead.',
            ], 422);
        }

        // Capitalize first letter of each word in names
        $firstName = $this->capitalizeWords(trim($request->first_name));
        $lastName = $this->capitalizeWords(trim($request->last_name));
        $middleInitial = $request->middle_initial ? $this->capitalizeWords(trim($request->middle_initial)) : null;

        // Verify CVSU email exists
        $emailVerificationService = new EmailVerificationService();
        $verification = $emailVerificationService->verifyCVSUEmail($email);

        if (!$verification['valid']) {
            return response()->json([
                'message' => $verification['message']
            ], 400);
        }

        // Construct full name from parts
        $middleInitialFormatted = '';
        if ($middleInitial) {
            // Extract first letter of each word in middle name and format as initials
            $middleWords = explode(' ', $middleInitial);
            $initials = array_map(function ($word) {
                return strtoupper(substr(trim($word), 0, 1)) . '.';
            }, array_filter($middleWords));
            $middleInitialFormatted = ' ' . implode(' ', $initials);
        }
        $fullName = trim($firstName . $middleInitialFormatted . ' ' . $lastName);

        // Create user without verifying email yet
        $user = User::create([
            'name' => $fullName,
            'first_name' => $firstName,
            'middle_name' => $middleInitial,
            'last_name' => $lastName,
            'email' => $email,
            'password' => Hash::make($request->password),
            'department' => $request->department,
            'designation' => $request->role,
            'is_validated' => false,
            'email_verified_at' => null,
        ]);

        // Generate 6-digit OTP and store it
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        DB::table('email_verification_otps')->where('email', $email)->delete();

        DB::table('email_verification_otps')->insert([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Send OTP email (dispatched after response so it's non-blocking)
        $brevoService = new BrevoMailService();
        $brevoService->sendRegistrationOtp($email, $otp, $user->name);

        Log::info('User registered, OTP sent', [
            'email' => $email,
            'user_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'Registration successful! Please check your email for a verification code.',
            'email' => $email,
            'requires_verification' => true,
            'message_note' => 'Enter the 6-digit code sent to your email to activate your account.',
        ], 201);
    }


    public function login(Request $request)
    {
        $request->validate([
            'email' => [
                'required',
                'email',
                'regex:/^[a-zA-Z0-9._%+-]+@cvsu\.edu\.ph$/i'
            ],
            'password' => 'required',
        ], [
            'email.regex' => 'Only @cvsu.edu.ph email addresses are allowed.'
        ]);

        $email = strtolower(trim($request->email));
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

        // Block login if email is not verified — redirect to OTP verification
        if (!$user->email_verified_at) {
            // Resend a fresh OTP so they can complete verification
            $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            \Illuminate\Support\Facades\DB::table('email_verification_otps')->where('email', $email)->delete();
            \Illuminate\Support\Facades\DB::table('email_verification_otps')->insert([
                'email' => $email,
                'otp' => $otp,
                'expires_at' => now()->addMinutes(10),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $brevoService = new \App\Services\BrevoMailService();
            $brevoService->sendRegistrationOtp($email, $otp, $user->name);

            return response()->json([
                'message' => 'Please verify your email before logging in. A new verification code has been sent.',
                'requires_verification' => true,
                'email' => $email,
            ], 403);
        }

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
                'profile_picture' => $user->profile_picture ?? null,
                'designation' => $user->designation,
                'ceit_officer_type' => $user->ceit_officer_type,
                'is_validated' => $user->is_validated ?? false,
                'schedule_initialized' => $user->schedule_initialized ?? false,
                'has_changed_credentials' => $user->has_changed_credentials ?? false,
                'has_changed_email' => $user->has_changed_email ?? false,
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
                'designation' => $request->user()->designation,
                'is_validated' => $request->user()->is_validated ?? false,
                'schedule_initialized' => $request->user()->schedule_initialized ?? false,
                'has_changed_credentials' => $request->user()->has_changed_credentials ?? false,
                'has_changed_email' => $request->user()->has_changed_email ?? false,
            ],
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => [
                'required',
                'email',
                'regex:/^[a-zA-Z0-9._%+-]+@cvsu\.edu\.ph$/i'
            ],
        ], [
            'email.regex' => 'Only @cvsu.edu.ph email addresses are allowed.'
        ]);

        $email = strtolower(trim($request->email));
        $user = User::where('email', $email)->first();

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
                'reset_url' => $frontendUrl . '/reset-password?' . http_build_query([
                    'token' => $token,
                    'email' => $email,
                ]),
            ]);
        }

        $status = Password::sendResetLink(['email' => $email]);

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
                'regex:/^[a-zA-Z0-9._%+-]+@cvsu\.edu\.ph$/i'
            ],
        ], [
            'email.regex' => 'Only @cvsu.edu.ph email addresses are allowed.'
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

            // Send OTP email via Brevo
            $brevoService = new BrevoMailService();
            $emailSent = $brevoService->sendPasswordResetOtp($email, $otp, $user->name);

            if (!$emailSent) {
                throw new \Exception('Failed to send OTP email');
            }

            Log::info('OTP sent successfully', [
                'email' => $email,
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => 'OTP sent to your email. Please check your inbox.',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send OTP', [
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
                'regex:/^[a-zA-Z0-9._%+-]+@cvsu\.edu\.ph$/i'
            ],
            'otp' => 'required|string|size:6|regex:/^\d{6}$/',
        ], [
            'email.regex' => 'Only @cvsu.edu.ph email addresses are allowed.',
            'otp.regex' => 'OTP must be a 6-digit number.',
        ]);

        $email = strtolower(trim($request->email));
        $otp = trim($request->otp);

        $otpRecord = DB::table('password_reset_otps')
            ->where('email', $email)
            ->where('otp', $otp)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$otpRecord) {
            Log::warning('Invalid OTP attempt', [
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

            Log::info('OTP verified successfully', [
                'email' => $email,
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => 'OTP verified successfully.',
                'reset_token' => $resetToken,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to verify OTP', [
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
                'regex:/^[a-zA-Z0-9._%+-]+@cvsu\.edu\.ph$/i'
            ],
            'reset_token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'email.regex' => 'Only @cvsu.edu.ph email addresses are allowed.',
            'password.confirmed' => 'Passwords do not match.',
            'password.min' => 'Password must be at least 8 characters.',
        ]);

        $email = strtolower(trim($request->email));

        $otpRecord = DB::table('password_reset_otps')
            ->where('email', $email)
            ->where('reset_token', $request->reset_token)
            ->where('used', true)
            ->first();

        if (!$otpRecord) {
            Log::warning('Invalid reset token attempt', [
                'email' => $email,
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => 'Invalid or expired reset token. Please request a new OTP.',
            ], 400);
        }

        // Check if reset token has expired (30 minutes)
        if ($otpRecord->reset_token_expires_at && now()->isAfter($otpRecord->reset_token_expires_at)) {
            Log::warning('Reset token expired', [
                'email' => $email,
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => 'Reset token has expired. Please request a new OTP.',
            ], 400);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            Log::error('User not found during password reset', [
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

            Log::info('Password reset successfully', [
                'email' => $email,
                'timestamp' => now(),
            ]);

            return response()->json([
                'message' => 'Password reset successfully. You can now log in with your new password.',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to reset password', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'An error occurred while resetting your password. Please try again.',
            ], 500);
        }
    }

    public function verifyEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6|regex:/^\d{6}$/',
        ], [
            'otp.regex' => 'OTP must be a 6-digit number.',
        ]);

        $email = strtolower(trim($request->email));
        $otp = trim($request->otp);

        $record = DB::table('email_verification_otps')
            ->where('email', $email)
            ->where('otp', $otp)
            ->where('expires_at', '>', now())
            ->first();

        if (!$record) {
            return response()->json([
                'message' => 'Invalid or expired verification code. Please request a new one.',
            ], 400);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Mark email as verified
        $user->email_verified_at = now();
        $user->save();

        // Delete the used OTP record
        DB::table('email_verification_otps')->where('email', $email)->delete();

        Log::info('Email verified via OTP', ['email' => $email, 'timestamp' => now()]);

        return response()->json([
            'message' => 'Email verified successfully! You can now log in.',
        ]);
    }

    public function resendVerificationOtp(Request $request)
    {
        $request->validate([
            'email' => [
                'required',
                'email',
                'regex:/^[a-zA-Z0-9._%+-]+@cvsu\.edu\.ph$/i'
            ],
        ], [
            'email.regex' => 'Only @cvsu.edu.ph email addresses are allowed.',
        ]);

        $email = strtolower(trim($request->email));
        $user = User::where('email', $email)->whereNull('email_verified_at')->first();

        if (!$user) {
            // Be vague for security
            return response()->json([
                'message' => 'If an unverified account exists for this email, a new code will be sent.',
            ]);
        }

        // Generate and store new OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        DB::table('email_verification_otps')->where('email', $email)->delete();

        DB::table('email_verification_otps')->insert([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $brevoService = new BrevoMailService();
        $brevoService->sendRegistrationOtp($email, $otp, $user->name);

        Log::info('Resent verification OTP', ['email' => $email, 'timestamp' => now()]);

        return response()->json([
            'message' => 'A new verification code has been sent to your email.',
        ]);
    }

    public function verifyEmailLink(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
        ]);

        $email = strtolower(trim($request->email));
        $token = trim($request->token);

        $record = DB::table('email_verification_otps')
            ->where('email', $email)
            ->where('otp', $token)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->first();

        if (!$record) {
            return response()->json([
                'message' => 'Invalid or expired verification link.',
            ], 400);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        // Mark email as verified if not already
        if (!$user->email_verified_at) {
            $user->email_verified_at = now();
            $user->save();
        }

        // Delete the used verification record
        DB::table('email_verification_otps')->where('email', $email)->delete();

        Log::info('Email verified via link', ['email' => $email, 'timestamp' => now()]);

        return response()->json([
            'message' => 'Email verified successfully! You can now log in.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => [
                'required',
                'email',
                'regex:/^[a-zA-Z0-9._%+-]+@cvsu\.edu\.ph$/i'
            ],
            'token' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'email.regex' => 'Only @cvsu.edu.ph email addresses are allowed.',
            'password.confirmed' => 'Passwords do not match.',
        ]);

        $email = strtolower(trim($request->email));
        $status = Password::reset(
            [
                'email' => $email,
                'password' => $request->password,
                'password_confirmation' => $request->password_confirmation,
                'token' => $request->token
            ],
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

    /**
     * Capitalize the first letter of each word in a string
     * 
     * @param string $text
     * @return string
     */
    private function capitalizeWords($text)
    {
        // Split by spaces and capitalize each word
        $words = explode(' ', $text);
        $capitalizedWords = array_map(function ($word) {
            return ucfirst(strtolower(trim($word)));
        }, $words);

        return implode(' ', array_filter($capitalizedWords));
    }
}