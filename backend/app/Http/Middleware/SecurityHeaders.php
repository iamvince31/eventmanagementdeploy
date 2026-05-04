<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        
        // Skip security headers for file uploads and API responses that serve files
        $isFileUpload = $request->hasFile('images') || 
                       str_contains($request->header('Content-Type', ''), 'multipart/form-data') ||
                       $request->is('api/events/*/images/*') ||
                       str_contains($response->headers->get('Content-Type', ''), 'image/') ||
                       str_contains($response->headers->get('Content-Type', ''), 'application/pdf');
        
        if (!$isFileUpload) {
            // Prevent MIME type sniffing (but allow for file uploads)
            $response->headers->set('X-Content-Type-Options', 'nosniff');
        }
        
        // Prevent clickjacking
        $response->headers->set('X-Frame-Options', 'DENY');
        
        // Enable XSS protection
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        
        // Control referrer information
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Restrict browser features
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        
        // More permissive CSP for file uploads and Supabase storage
        $supabaseUrl = env('SUPABASE_PUBLIC_URL', '');
        $supabaseDomain = $supabaseUrl ? parse_url($supabaseUrl, PHP_URL_HOST) : '';
        
        $csp = "default-src 'self'; " .
               "script-src 'self' 'unsafe-inline'; " .
               "style-src 'self' 'unsafe-inline'; " .
               "img-src 'self' data: blob: " . ($supabaseDomain ? "https://{$supabaseDomain}" : '') . "; " .
               "media-src 'self' " . ($supabaseDomain ? "https://{$supabaseDomain}" : '') . "; " .
               "object-src 'none'; " .
               "connect-src 'self' " . ($supabaseDomain ? "https://{$supabaseDomain}" : '');
        
        $response->headers->set('Content-Security-Policy', $csp);
        
        return $response;
    }
}
