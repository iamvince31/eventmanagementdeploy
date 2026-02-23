<?php

namespace App\Http\Middleware;

use App\Services\AuthService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ThrottleLoginAttempts
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $email = strtolower(trim($request->input('email', '')));
        $ip = $request->ip();
        
        // Check if user is currently locked out
        $lockoutStatus = $this->authService->isLockedOut($email, $ip);
        
        if ($lockoutStatus) {
            $minutes = ceil($lockoutStatus['remaining_seconds'] / 60);
            
            return response()->json([
                'message' => "Too many login attempts. Please try again in {$minutes} minute(s).",
                'locked_until' => $lockoutStatus['locked_until'],
                'remaining_seconds' => $lockoutStatus['remaining_seconds'],
            ], 429);
        }
        
        return $next($request);
    }
}
