<?php

namespace App\Http\Controllers;

use App\Services\SupabaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\User;

class SupabaseAuthController extends Controller
{
    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    /**
     * Verify Supabase token and sync with local database
     */
    public function verifyToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $supabaseUser = $this->supabase->verifyToken($request->token);

        if (!$supabaseUser) {
            return response()->json(['message' => 'Invalid token'], 401);
        }

        // Sync with local database
        $user = User::updateOrCreate(
            ['email' => $supabaseUser['email']],
            [
                'username' => $supabaseUser['user_metadata']['username'] ?? explode('@', $supabaseUser['email'])[0],
                'supabase_id' => $supabaseUser['id'],
                'email_verified_at' => $supabaseUser['email_confirmed_at'] ?? null,
                'department' => $supabaseUser['user_metadata']['department'] ?? null,
            ]
        );

        return response()->json([
            'user' => $user,
            'supabase_user' => $supabaseUser
        ]);
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $success = $this->supabase->sendPasswordResetEmail($request->email);

        if ($success) {
            return response()->json([
                'message' => 'Password reset email sent successfully'
            ]);
        }

        return response()->json([
            'message' => 'Failed to send password reset email'
        ], 500);
    }

    /**
     * Verify OTP code
     */
    public function verifyOTP(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'token' => 'required|string',
            'type' => 'string|in:recovery,signup,email_change'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $result = $this->supabase->verifyOTP(
            $request->email,
            $request->token,
            $request->type ?? 'recovery'
        );

        if ($result) {
            return response()->json([
                'message' => 'OTP verified successfully',
                'data' => $result
            ]);
        }

        return response()->json([
            'message' => 'Invalid or expired OTP'
        ], 401);
    }

    /**
     * Get user by email
     */
    public function getUserByEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $this->supabase->getUserByEmail($request->email);

        if ($user) {
            return response()->json(['user' => $user]);
        }

        return response()->json(['message' => 'User not found'], 404);
    }

    /**
     * Check if Supabase is configured
     */
    public function status()
    {
        return response()->json([
            'configured' => $this->supabase->isConfigured(),
            'message' => $this->supabase->isConfigured() 
                ? 'Supabase is configured and ready' 
                : 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env'
        ]);
    }
}
