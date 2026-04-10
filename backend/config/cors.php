<?php

return [

    /*
     |--------------------------------------------------------------------------
     | Cross-Origin Resource Sharing (CORS) Configuration
     |--------------------------------------------------------------------------
     |
     | Here you may configure your settings for cross-origin resource sharing
     | or "CORS". This determines what cross-origin operations may execute
     | in web browsers. You are free to adjust these settings as needed.
     |
     | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
     |
     */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(array_unique(array_merge(
    // Local development origins
    [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:3000',
    ],
    // Production origins from env — supports multiple comma-separated URLs
    // e.g. FRONTEND_URL=https://myapp.vercel.app,https://myapp.netlify.app
    array_filter(array_map('trim', explode(',', env('FRONTEND_URL', '')))),
    // Explicit Vercel deployment URL (set VERCEL_URL on Render if FRONTEND_URL isn't set)
    env('VERCEL_URL') ? [env('VERCEL_URL')] : []
))),

    // Regex patterns as fallback — works in non-cached environments
    'allowed_origins_patterns' => [
        '#^https://[a-zA-Z0-9\-]+\.vercel\.app$#',
        '#^https://[a-zA-Z0-9\-]+\.netlify\.app$#',
        '#^https://[a-zA-Z0-9\-]+\.onrender\.com$#',
        '#^https://[a-zA-Z0-9\-]+\.railway\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
