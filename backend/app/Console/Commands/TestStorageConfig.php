<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ImageService;

class TestStorageConfig extends Command
{
    protected $signature = 'storage:test';
    protected $description = 'Test storage configuration and environment detection';

    public function handle()
    {
        $this->info('Testing Storage Configuration...');
        $this->newLine();

        // Environment detection
        $isProduction = config('app.env') === 'production';
        $hasSupabaseConfig = !empty(env('SUPABASE_S3_ACCESS_KEY_ID')) && 
                           !empty(env('SUPABASE_S3_SECRET_ACCESS_KEY')) && 
                           !empty(env('SUPABASE_S3_ENDPOINT'));

        $this->info('Environment Detection:');
        $this->line("  APP_ENV: " . config('app.env'));
        $this->line("  APP_URL: " . config('app.url'));
        $this->line("  Is Production: " . ($isProduction ? 'Yes' : 'No'));
        $this->line("  Has Supabase Config: " . ($hasSupabaseConfig ? 'Yes' : 'No'));
        $this->newLine();

        // Storage decision
        $willUseSupabase = $isProduction;
        $this->info('Storage Decision:');
        $this->line("  Will use: " . ($willUseSupabase ? 'Supabase' : 'Local Laravel Storage'));
        $this->newLine();

        // Supabase configuration (if applicable)
        if ($hasSupabaseConfig) {
            $this->info('Supabase Configuration:');
            $this->line("  Endpoint: " . env('SUPABASE_S3_ENDPOINT'));
            $this->line("  Bucket: " . env('SUPABASE_S3_BUCKET', 'event-files'));
            $this->line("  Region: " . env('SUPABASE_S3_REGION', 'ap-southeast-1'));
            $this->line("  Public URL: " . env('SUPABASE_PUBLIC_URL'));
            $this->line("  Access Key: " . (env('SUPABASE_S3_ACCESS_KEY_ID') ? 'Set' : 'Not Set'));
            $this->line("  Secret Key: " . (env('SUPABASE_S3_SECRET_ACCESS_KEY') ? 'Set' : 'Not Set'));
        } else {
            $this->warn('Supabase not configured - will use local storage');
        }
        $this->newLine();

        // Local storage configuration
        $this->info('Local Storage Configuration:');
        $this->line("  Public Path: " . storage_path('app/public'));
        $this->line("  Public URL: " . config('app.url') . '/storage');
        $this->line("  Storage Link Exists: " . (file_exists(public_path('storage')) ? 'Yes' : 'No'));
        $this->newLine();

        // Test URL generation
        $testPath = 'events/test-image.jpg';
        $testUrl = \App\Services\ImageService::getImageUrl($testPath, null);
        $this->info('URL Generation Test:');
        $this->line("  Test Path: {$testPath}");
        $this->line("  Generated URL: {$testUrl}");
        $this->newLine();

        $this->info('✅ Storage configuration test complete!');
        
        if (!$willUseSupabase && !file_exists(public_path('storage'))) {
            $this->warn('⚠️  Storage link missing! Run: php artisan storage:link');
        }
        
        if ($willUseSupabase && !$hasSupabaseConfig) {
            $this->error('❌ Production environment but Supabase not configured!');
        }
    }
}