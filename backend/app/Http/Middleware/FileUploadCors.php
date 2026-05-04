<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FileUploadCors
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        
        // Add specific headers for file upload responses
        if ($request->hasFile('images') || $request->hasFile('files')) {
            $response->headers->set('Content-Type', 'application/json; charset=utf-8');
            $response->headers->set('Access-Control-Allow-Origin', $request->header('Origin', '*'));
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Access-Control-Expose-Headers', 'Content-Type, Content-Length');
        }
        
        return $response;
    }
}