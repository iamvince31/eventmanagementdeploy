<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\SupabaseAuthController;
use App\Http\Controllers\EmailVerificationController;
use Illuminate\Support\Facades\Route;

// Public routes with login attempt throttling
Route::middleware('throttle.login')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/request-otp', [AuthController::class, 'requestOtp']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/reset-password-otp', [AuthController::class, 'resetPasswordWithOtp']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Supabase Authentication Routes
Route::prefix('auth/supabase')->group(function () {
    Route::get('/status', [SupabaseAuthController::class, 'status']);
    Route::post('/verify-token', [SupabaseAuthController::class, 'verifyToken']);
    Route::post('/send-password-reset', [SupabaseAuthController::class, 'sendPasswordResetEmail']);
    Route::post('/verify-otp', [SupabaseAuthController::class, 'verifyOTP']);
    Route::post('/get-user-by-email', [SupabaseAuthController::class, 'getUserByEmail']);
});

// Email Verification Routes
Route::prefix('email')->group(function () {
    Route::post('/verify', [EmailVerificationController::class, 'verifyEmail']);
    Route::post('/quick-check', [EmailVerificationController::class, 'quickCheck']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Events
    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{event}', [EventController::class, 'update']);
    Route::delete('/events/{event}', [EventController::class, 'destroy']);
    Route::post('/events/{event}/respond', [EventController::class, 'respondToInvitation']);
    
    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::put('/user/profile', [UserController::class, 'update']);
    
    // Schedules
    Route::get('/schedules', [ScheduleController::class, 'index']);
    Route::post('/schedules', [ScheduleController::class, 'store']);
    Route::delete('/schedules/{id}', [ScheduleController::class, 'destroy']);
    Route::post('/schedules/check-conflicts', [ScheduleController::class, 'checkConflicts']);

    // Reschedule Requests
    Route::get('/events/{event}/reschedule-requests', [App\Http\Controllers\EventRescheduleRequestController::class, 'index']);
    Route::post('/events/{event}/reschedule', [App\Http\Controllers\EventRescheduleRequestController::class, 'store']);
    Route::post('/reschedule-requests/{id}/respond', [App\Http\Controllers\EventRescheduleRequestController::class, 'respond']);
});
