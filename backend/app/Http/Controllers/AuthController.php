<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
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
                'regex:/^main\.[a-zA-Z]+\.[a-zA-Z]+@cvsu\.edu\.ph$/i'
            ],
            'password' => 'required|string|min:6',
            'department' => 'required|string',
        ], [
            'email.regex' => 'Email must be in format main.(firstname).(lastname)@cvsu.edu.ph'
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
                'regex:/^main\.[a-zA-Z]+\.[a-zA-Z]+@cvsu\.edu\.ph$/i'
            ],
            'password' => 'required',
        ], [
            'email.regex' => 'Email must be in format main.(firstname).(lastname)@cvsu.edu.ph'
        ]);

        $email = $request->email;
        $ip = $request->ip();
        $key = 'login_attempts:' . md5($email . $ip);
        $lockoutKey = 'login_lockout:' . md5($email . $ip);

        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            // Get current attempts and increment
            $attempts = Cache::get($key, 0) + 1;
            
            // Log failed attempt
            Log::warning('Failed login attempt', [
                'email' => $email,
                'ip' => $ip,
                'attempts' => $attempts,
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);
            
            // Check if this is the 3rd attempt - lock immediately
            if ($attempts >= 3) {
                // Lock out the user
                $lockoutUntil = now()->addMinutes(5)->timestamp;
                Cache::put($lockoutKey, $lockoutUntil, 300);
                Cache::forget($key); // Clear attempts counter
                
                Log::warning('Account locked due to failed attempts', [
                    'email' => $email,
                    'ip' => $ip,
                    'locked_until' => date('Y-m-d H:i:s', $lockoutUntil),
                ]);
                
                throw ValidationException::withMessages([
                    'email' => ['Too many failed attempts. Your account has been locked for 5 minutes.'],
                ]);
            }
            
            // Store the incremented attempts
            Cache::put($key, $attempts, 300); // Store for 5 minutes
            $remainingAttempts = 3 - $attempts;
            
            throw ValidationException::withMessages([
                'email' => ["Invalid email or password. {$remainingAttempts} attempt(s) remaining."],
            ]);
        }

        // Successful login - clear attempts
        Cache::forget($key);
        Cache::forget($lockoutKey);
        
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
                'regex:/^main\.[a-zA-Z]+\.[a-zA-Z]+@cvsu\.edu\.ph$/i'
            ],
        ], [
            'email.regex' => 'Email must be in format main.(firstname).(lastname)@cvsu.edu.ph'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'If an account exists with this email, a password reset link will be sent.',
            ]);
        }

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'Password reset link sent to your email.',
            ]);
        }

        return response()->json([
            'message' => 'Unable to send reset link. Please try again.',
        ], 400);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => [
                'required',
                'email',
                'regex:/^main\.[a-zA-Z]+\.[a-zA-Z]+@cvsu\.edu\.ph$/i'
            ],
            'token' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'email.regex' => 'Email must be in format main.(firstname).(lastname)@cvsu.edu.ph',
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
