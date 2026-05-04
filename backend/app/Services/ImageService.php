<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageService
{
    /**
     * Upload an image and return the path and URL
     */
    public static function uploadImage(UploadedFile $file): array
    {
        // Validate file
        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            throw new \Exception('Invalid file type. Only JPG, PNG, GIF, WebP, and PDF files are allowed.');
        }

        // Check file size (25MB)
        if ($file->getSize() > 25 * 1024 * 1024) {
            throw new \Exception('File size must not exceed 25MB.');
        }

        $originalName = $file->getClientOriginalName();
        $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);
        $filename = 'events/' . Str::uuid() . '_' . $safeName;

        // Environment-based storage decision
        if (self::isProduction()) {
            // PRODUCTION: Use Supabase
            return self::uploadToSupabase($file, $filename, $originalName);
        } else {
            // LOCALHOST: Use Laravel local storage
            return self::uploadToLocal($file, $filename, $originalName);
        }
    }

    /**
     * Delete an image from storage
     */
    public static function deleteImage(string $path, ?string $url = null): bool
    {
        try {
            if (self::isProduction()) {
                // PRODUCTION: Delete from Supabase
                Storage::disk('supabase')->delete($path);
            } else {
                // LOCALHOST: Delete from local storage
                Storage::disk('public')->delete($path);
            }
            return true;
        } catch (\Exception $e) {
            \Log::warning('Failed to delete image', [
                'path' => $path,
                'url' => $url,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Upload to Supabase (Production)
     */
    private static function uploadToSupabase(UploadedFile $file, string $filename, string $originalName): array
    {
        try {
            Storage::disk('supabase')->put($filename, $file->get(), 'public');
            
            $publicUrl = rtrim(env('SUPABASE_PUBLIC_URL'), '/') . 
                        '/' . env('SUPABASE_S3_BUCKET', 'event-files') . 
                        '/' . $filename;
            
            return [
                'path' => $filename,
                'url' => $publicUrl,
                'original_name' => $originalName,
                'storage' => 'supabase'
            ];
        } catch (\Exception $e) {
            throw new \Exception('Supabase upload failed: ' . $e->getMessage());
        }
    }

    /**
     * Upload to Local Storage (Localhost)
     */
    private static function uploadToLocal(UploadedFile $file, string $filename, string $originalName): array
    {
        try {
            // Store in public disk so it's accessible via URL
            $path = $file->storeAs('events', basename($filename), 'public');
            
            // Generate full URL for local storage
            $url = config('app.url') . '/storage/' . $path;
            
            return [
                'path' => $path,
                'url' => $url,
                'original_name' => $originalName,
                'storage' => 'local'
            ];
        } catch (\Exception $e) {
            throw new \Exception('Local storage upload failed: ' . $e->getMessage());
        }
    }

    /**
     * Check if we're in production environment
     * STRICT: Only use Supabase in production, always use local storage in development
     */
    private static function isProduction(): bool
    {
        // Strict environment check - only production uses Supabase
        return config('app.env') === 'production';
    }

    /**
     * Get the correct URL for an image based on environment
     */
    public static function getImageUrl(string $path, ?string $storedUrl = null): string
    {
        if (self::isProduction()) {
            // PRODUCTION: Use stored Supabase URL or construct it
            if ($storedUrl && str_contains($storedUrl, 'supabase.co')) {
                return $storedUrl;
            }
            
            // Construct Supabase URL if stored URL is missing
            return rtrim(env('SUPABASE_PUBLIC_URL'), '/') . 
                   '/' . env('SUPABASE_S3_BUCKET', 'event-files') . 
                   '/' . $path;
        } else {
            // LOCALHOST: Use local storage URL
            if ($storedUrl && str_contains($storedUrl, config('app.url'))) {
                return $storedUrl;
            }
            
            // Construct local URL if stored URL is missing
            return config('app.url') . '/storage/' . $path;
        }
    }
}