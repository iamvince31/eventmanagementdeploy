<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthService
{
    protected const MAX_LOGIN_ATTEMPTS = 3;
    protected const LOCKOUT_DURATION_FIRST = 3; // minutes
    protected const LOCKOUT_DURATION_SUBSEQUENT = 5; // minutes
    protected const ATTEMPTS_WINDOW = 300; // 5 minutes in seconds
    protected const LOCKOUT_COUNT_WINDOW = 3600; // 1 hour in seconds

    /**
     * Generate cache keys for rate limiting
     */
    protected function getCacheKeys(string $email, string $ip): array
    {
        $identifier = md5($email . $ip);
        
        return [
            'attempts' => "login_attempts:{$identifier}",
            'lockout' => "login_lockout:{$identifier}",
            'lockout_count' => "login_lockout_count:{$identifier}",
        ];
    }

    /**
     * Check if user is currently locked out
     */
    public function isLockedOut(string $email, string $ip): ?array
    {
        $keys = $this->getCacheKeys($email, $ip);
        
        if (Cache::has($keys['lockout'])) {
            $lockoutUntil = Cache::get($keys['lockout']);
            $remainingTime = $lockoutUntil - now()->timestamp;
            
            return [
                'locked' => true,
                'remaining_seconds' => max(0, $remainingTime),
                'locked_until' => $lockoutUntil,
            ];
        }
        
        return null;
    }

    /**
     * Record failed login attempt
     */
    public function recordFailedAttempt(string $email, string $ip, ?User $user = null): array
    {
        $keys = $this->getCacheKeys($email, $ip);
        $attempts = Cache::get($keys['attempts'], 0) + 1;
        
        Log::warning('Failed login attempt', [
            'email' => $email,
            'user_id' => $user?->id,
            'ip' => $ip,
            'attempts' => $attempts,
            'timestamp' => now(),
        ]);
        
        if ($attempts >= self::MAX_LOGIN_ATTEMPTS) {
            return $this->lockoutUser($email, $ip, $user);
        }
        
        Cache::put($keys['attempts'], $attempts, self::ATTEMPTS_WINDOW);
        
        return [
            'locked' => false,
            'attempts' => $attempts,
            'remaining_attempts' => self::MAX_LOGIN_ATTEMPTS - $attempts,
        ];
    }

    /**
     * Lockout user after max attempts
     */
    protected function lockoutUser(string $email, string $ip, ?User $user = null): array
    {
        $keys = $this->getCacheKeys($email, $ip);
        $lockoutCount = Cache::get($keys['lockout_count'], 0);
        
        $lockoutMinutes = $lockoutCount === 0 
            ? self::LOCKOUT_DURATION_FIRST 
            : self::LOCKOUT_DURATION_SUBSEQUENT;
        
        $lockoutSeconds = $lockoutMinutes * 60;
        $lockoutUntil = now()->addMinutes($lockoutMinutes)->timestamp;
        
        Cache::put($keys['lockout'], $lockoutUntil, $lockoutSeconds);
        Cache::forget($keys['attempts']);
        Cache::put($keys['lockout_count'], $lockoutCount + 1, self::LOCKOUT_COUNT_WINDOW);
        
        Log::warning('Account locked due to failed attempts', [
            'email' => $email,
            'user_id' => $user?->id,
            'ip' => $ip,
            'lockout_count' => $lockoutCount + 1,
            'lockout_minutes' => $lockoutMinutes,
            'locked_until' => date('Y-m-d H:i:s', $lockoutUntil),
        ]);
        
        return [
            'locked' => true,
            'lockout_minutes' => $lockoutMinutes,
            'locked_until' => $lockoutUntil,
            'remaining_seconds' => $lockoutSeconds,
        ];
    }

    /**
     * Clear all rate limiting data for successful login
     */
    public function clearRateLimiting(string $email, string $ip): void
    {
        $keys = $this->getCacheKeys($email, $ip);
        
        Cache::forget($keys['attempts']);
        Cache::forget($keys['lockout']);
        Cache::forget($keys['lockout_count']);
    }

    /**
     * Authenticate user credentials
     */
    public function authenticate(string $email, string $password, string $ip): array
    {
        // Check lockout status
        $lockoutStatus = $this->isLockedOut($email, $ip);
        if ($lockoutStatus) {
            $minutes = ceil($lockoutStatus['remaining_seconds'] / 60);
            throw ValidationException::withMessages([
                'email' => ["Too many failed attempts. Please try again in {$minutes} minute(s)."],
            ]);
        }

        // Find user
        $user = User::where('email', $email)->first();

        if (!$user) {
            Log::warning('Login attempt for non-existent account', [
                'email' => $email,
                'ip' => $ip,
                'timestamp' => now(),
            ]);
            
            throw ValidationException::withMessages([
                'email' => ['This account does not exist. Please check your email or register.'],
            ]);
        }

        // Verify password
        if (!Hash::check($password, $user->password)) {
            $result = $this->recordFailedAttempt($email, $ip, $user);
            
            if ($result['locked']) {
                throw ValidationException::withMessages([
                    'email' => ["Too many failed attempts. Your account has been locked for {$result['lockout_minutes']} minutes."],
                ]);
            }
            
            throw ValidationException::withMessages([
                'email' => ["Invalid password. {$result['remaining_attempts']} attempt(s) remaining before lockout."],
            ]);
        }

        // Successful authentication
        $this->clearRateLimiting($email, $ip);
        
        Log::info('Successful login', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip' => $ip,
            'timestamp' => now(),
        ]);

        return [
            'user' => $user,
            'token' => $user->createToken('auth-token')->plainTextToken,
        ];
    }

    /**
     * Register new user
     */
    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['username'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'department' => $data['department'],
        ]);

        Log::info('New user registered', [
            'user_id' => $user->id,
            'email' => $user->email,
            'timestamp' => now(),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Format user response
     */
    public function formatUserResponse(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->name,
            'email' => $user->email,
            'department' => $user->department,
            'schedule_initialized' => $user->schedule_initialized ?? false,
            'email_verified' => !is_null($user->email_verified_at),
        ];
    }
}
