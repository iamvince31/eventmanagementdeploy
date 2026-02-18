<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SupabaseService
{
    protected $url;
    protected $serviceKey;
    protected $anonKey;

    public function __construct()
    {
        $this->url = config('services.supabase.url');
        $this->serviceKey = config('services.supabase.service_role_key');
        $this->anonKey = config('services.supabase.key');
    }

    /**
     * Verify Supabase JWT token and get user
     */
    public function verifyToken($token)
    {
        try {
            $response = Http::withHeaders([
                'apikey' => $this->anonKey,
                'Authorization' => "Bearer {$token}",
            ])->get("{$this->url}/auth/v1/user");

            if ($response->successful()) {
                return $response->json();
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Supabase token verification failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get user by ID using service role key
     */
    public function getUserById($userId)
    {
        try {
            $response = Http::withHeaders([
                'apikey' => $this->serviceKey,
                'Authorization' => "Bearer {$this->serviceKey}",
            ])->get("{$this->url}/auth/v1/admin/users/{$userId}");

            if ($response->successful()) {
                return $response->json();
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Supabase get user failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get user by email
     */
    public function getUserByEmail($email)
    {
        try {
            $response = Http::withHeaders([
                'apikey' => $this->serviceKey,
                'Authorization' => "Bearer {$this->serviceKey}",
            ])->get("{$this->url}/auth/v1/admin/users", [
                'email' => $email
            ]);

            if ($response->successful()) {
                $users = $response->json()['users'] ?? [];
                return !empty($users) ? $users[0] : null;
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Supabase get user by email failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail($email)
    {
        try {
            $response = Http::withHeaders([
                'apikey' => $this->anonKey,
                'Content-Type' => 'application/json',
            ])->post("{$this->url}/auth/v1/recover", [
                'email' => $email,
                'options' => [
                    'redirectTo' => config('app.frontend_url', 'http://localhost:5173') . '/reset-password'
                ]
            ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Supabase password reset failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Update user metadata
     */
    public function updateUserMetadata($userId, $metadata)
    {
        try {
            $response = Http::withHeaders([
                'apikey' => $this->serviceKey,
                'Authorization' => "Bearer {$this->serviceKey}",
                'Content-Type' => 'application/json',
            ])->put("{$this->url}/auth/v1/admin/users/{$userId}", [
                'user_metadata' => $metadata
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Supabase update user metadata failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete user
     */
    public function deleteUser($userId)
    {
        try {
            $response = Http::withHeaders([
                'apikey' => $this->serviceKey,
                'Authorization' => "Bearer {$this->serviceKey}",
            ])->delete("{$this->url}/auth/v1/admin/users/{$userId}");

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Supabase delete user failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * List all users (admin only)
     */
    public function listUsers($page = 1, $perPage = 50)
    {
        try {
            $response = Http::withHeaders([
                'apikey' => $this->serviceKey,
                'Authorization' => "Bearer {$this->serviceKey}",
            ])->get("{$this->url}/auth/v1/admin/users", [
                'page' => $page,
                'per_page' => $perPage
            ]);

            if ($response->successful()) {
                return $response->json()['users'] ?? [];
            }

            return [];
        } catch (\Exception $e) {
            Log::error('Supabase list users failed: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Verify OTP code
     */
    public function verifyOTP($email, $token, $type = 'recovery')
    {
        try {
            $response = Http::withHeaders([
                'apikey' => $this->anonKey,
                'Content-Type' => 'application/json',
            ])->post("{$this->url}/auth/v1/verify", [
                'type' => $type,
                'email' => $email,
                'token' => $token
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Supabase OTP verification failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Check if Supabase is configured
     */
    public function isConfigured()
    {
        return !empty($this->url) && !empty($this->anonKey);
    }
}
