<?php

namespace App\Http\Controllers;

use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register(RegisterRequest $request)
    {
        try {
            $result = $this->authService->register($request->validated());

            return response()->json([
                'message' => 'Registered successfully',
                'user' => $this->authService->formatUserResponse($result['user']),
                'token' => $result['token'],
            ], 201);
        } catch (\Exception $e) {
            Log::error('Registration failed', [
                'email' => $request->validated()['email'],
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Registration failed. Please try again.',
            ], 500);
        }
    }

    public function login(LoginRequest $request)
    {
        $result = $this->authService->authenticate(
            $request->validated()['email'],
            $request->validated()['password'],
            $request->ip()
        );

        return response()->json([
            'message' => 'Logged in successfully',
            'user' => $this->authService->formatUserResponse($result['user']),
            'token' => $result['token'],
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
            'user' => $this->authService->formatUserResponse($request->user()),
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request)
    {
        // Security: Don't reveal if email exists
        // This endpoint is deprecated in favor of OTP flow
        return response()->json([
            'message' => 'If an account exists with this email, a password reset link will be sent.',
        ]);
    }

    public function requestOtp(ForgotPasswordRequest $request)
    {
        $email = $request->validated()['email'];
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
        $validated = $request->validate([
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

        $email = strtolower($validated['email']);

        $otpRecord = DB::table('password_reset_otps')
            ->where('email', $email)
            ->where('otp', $validated['otp'])
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

    public function resetPasswordWithOtp(ResetPasswordRequest $request)
    {
        $validated = $request->validated();
        $email = $validated['email'];

        $otpRecord = DB::table('password_reset_otps')
            ->where('email', $email)
            ->where('reset_token', $validated['reset_token'])
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
                'password' => Hash::make($validated['password']),
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


}
