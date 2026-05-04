<?php

return [

    /*
     |--------------------------------------------------------------------------
     | Cross-Origin Resource Sharing (CORS) Configuration
     |--------------------------------------------------------------------------
     */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],

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
            // Known production frontend — hardcoded as fallback
            'https://eventmanagementdeploy-orcin.vercel.app',
        ],
        // Production origins from env — supports multiple comma-separated URLs
        // e.g. FRONTEND_URL=https://myapp.vercel.app,https://myapp.netlify.app
        array_filter(array_map('trim', explode(',', env('FRONTEND_URL', '')))),
        // Explicit Vercel deployment URL (set VERCEL_URL on Render if FRONTEND_URL isn't set)
        env('VERCEL_URL') ? [env('VERCEL_URL')] : []
    ))),

    // Regex patterns — works in non-cached environments
    'allowed_origins_patterns' => [
        '#^https://[a-zA-Z0-9\-]+\.vercel\.app$#',
        '#^https://[a-zA-Z0-9\-]+\.netlify\.app$#',
        '#^https://[a-zA-Z0-9\-]+\.onrender\.com$#',
        '#^https://[a-zA-Z0-9\-]+\.railway\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Content-Type', 'Content-Length', 'Content-Disposition'],

    'max_age' => 0,

    'supports_credentials' => true,

];
