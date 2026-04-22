<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/reset-password/{token}', function (Request $request, string $token) {
    $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/');

    $query = http_build_query(array_filter([
        'token' => $token,
        'email' => $request->query('email'),
    ]));

    return redirect()->away("{$frontendUrl}/reset-password?{$query}");
})->name('password.reset');

// Temporary debug route — remove after fixing
Route::get('/debug-storage', function () {
    $output = [];

    // 1. Check env vars
    $output['env'] = [
        'SUPABASE_S3_ENDPOINT'      => env('SUPABASE_S3_ENDPOINT') ?: '❌ NOT SET',
        'SUPABASE_S3_REGION'        => env('SUPABASE_S3_REGION') ?: '❌ NOT SET',
        'SUPABASE_S3_BUCKET'        => env('SUPABASE_S3_BUCKET') ?: '❌ NOT SET',
        'SUPABASE_S3_ACCESS_KEY_ID' => env('SUPABASE_S3_ACCESS_KEY_ID') ? '✅ SET (' . substr(env('SUPABASE_S3_ACCESS_KEY_ID'), 0, 6) . '...)' : '❌ NOT SET',
        'SUPABASE_S3_SECRET'        => env('SUPABASE_S3_SECRET_ACCESS_KEY') ? '✅ SET' : '❌ NOT SET',
        'SUPABASE_PUBLIC_URL'       => env('SUPABASE_PUBLIC_URL') ?: '❌ NOT SET',
    ];

    // 2. Try uploading a test file to Supabase
    try {
        $disk = \Illuminate\Support\Facades\Storage::disk('supabase');
        $testPath = 'test/debug-' . time() . '.txt';
        $result = $disk->put($testPath, 'hello-supabase', 'public');
        $publicUrl = rtrim(config('filesystems.disks.supabase.public_url'), '/') . '/' . config('filesystems.disks.supabase.bucket') . '/' . $testPath;
        $disk->delete($testPath);
        $output['upload_test'] = $result ? '✅ SUCCESS — URL would be: ' . $publicUrl : '❌ put() returned false';
    } catch (\Exception $e) {
        $output['upload_test'] = '❌ EXCEPTION: ' . $e->getMessage();
    }

    // 3. Last 3 event_images from DB
    $output['last_images'] = \Illuminate\Support\Facades\DB::table('event_images')
        ->latest()
        ->take(3)
        ->get(['id', 'cloudinary_url', 'image_path', 'original_filename'])
        ->toArray();

    return response()->json($output, 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
});
