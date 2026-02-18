<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class ThrottleLoginAttempts
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $email = $request->input('email');
        $ip = $request->ip();
        
        // Create unique key for this email/IP combination
        $key = 'login_attempts:' . md5($email . $ip);
        $lockoutKey = 'login_lockout:' . md5($email . $ip);
        $lockoutCountKey = 'login_lockout_count:' . md5($email . $ip);
        
        // Check if user is currently locked out
        if (Cache::has($lockoutKey)) {
            $remainingTime = Cache::get($lockoutKey) - now()->timestamp;
            $minutes = ceil($remainingTime / 60);
            
            return response()->json([
                'message' => "Too many login attempts. Please try again in {$minutes} minute(s).",
                'locked_until' => Cache::get($lockoutKey),
                'remaining_seconds' => $remainingTime,
            ], 429);
        }
        
        // Check current attempts
        $attempts = Cache::get($key, 0);
        
        if ($attempts >= 3) {
            // Get lockout count to determine duration (progressive lockout)
            $lockoutCount = Cache::get($lockoutCountKey, 0);
            
            // Progressive lockout: 1st = 3 mins, 2nd+ = 5 mins
            $lockoutMinutes = $lockoutCount === 0 ? 3 : 5;
            $lockoutSeconds = $lockoutMinutes * 60;
            
            // Lock out the user
            $lockoutUntil = now()->addMinutes($lockoutMinutes)->timestamp;
            Cache::put($lockoutKey, $lockoutUntil, $lockoutSeconds);
            Cache::forget($key); // Reset attempts counter
            
            // Increment lockout count (persists for 1 hour)
            Cache::put($lockoutCountKey, $lockoutCount + 1, 3600);
            
            return response()->json([
                'message' => "Too many login attempts. Your account has been locked for {$lockoutMinutes} minutes.",
                'locked_until' => $lockoutUntil,
                'remaining_seconds' => $lockoutSeconds,
            ], 429);
        }
        
        return $next($request);
    }
}
