<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Ensure CORS runs first — before auth, throttle, etc.
        $middleware->prepend(\Illuminate\Http\Middleware\HandleCors::class);

        // Register custom middleware aliases
        $middleware->alias([
            'throttle.login' => \App\Http\Middleware\ThrottleLoginAttempts::class,
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
        ]);
        
        // Disable CSRF for API routes (using token-based auth)
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Ensure CORS headers are present even on unhandled exceptions
        // so the browser doesn't show a misleading CORS error instead of the real one
        $exceptions->respond(function (\Illuminate\Http\Response|\Symfony\Component\HttpFoundation\Response $response) {
            $origin = request()->header('Origin', '');
            if ($origin) {
                $response->headers->set('Access-Control-Allow-Origin', $origin);
                $response->headers->set('Access-Control-Allow-Credentials', 'true');
            }
            return $response;
        });
    })->create();
