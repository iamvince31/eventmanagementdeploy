<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsValidated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || !$request->user()->is_validated) {
            return response()->json([
                'error' => 'Account not validated',
                'message' => 'Your account needs to be validated by an admin before you can access this feature.'
            ], 403);
        }

        return $next($request);
    }
}