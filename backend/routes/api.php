<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DefaultEventController;
use App\Http\Controllers\DefaultEventControllerV2;
use App\Http\Controllers\EventController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\ArchiveController;
use Illuminate\Support\Facades\Route;

// Public routes with login attempt throttling
Route::middleware('throttle.login')->group(function () {
    Route::post('/login', [AuthController::class , 'login']);
});

Route::post('/register', [AuthController::class , 'register']);
Route::post('/verify-email', [AuthController::class , 'verifyEmail']);
Route::post('/resend-verification', [AuthController::class , 'resendVerificationOtp']);
Route::post('/forgot-password', [AuthController::class , 'forgotPassword']);
Route::post('/request-otp', [AuthController::class , 'requestOtp']);
Route::post('/verify-otp', [AuthController::class , 'verifyOtp']);
Route::post('/reset-password-otp', [AuthController::class , 'resetPasswordWithOtp']);
Route::post('/reset-password', [AuthController::class , 'resetPassword']);
Route::post('/verify-email-link', [AuthController::class , 'verifyEmailLink']);

Route::get('/seed-admin', function () {
    if (!\App\Models\User::where('email', 'admin@cvsu.edu.ph')->exists()) {
        \App\Models\User::create([
            'name' => 'Setup Admin',
            'email' => 'admin@cvsu.edu.ph',
            'password' => \Illuminate\Support\Facades\Hash::make('11111111'),
            'role' => 'Admin',
            'department' => 'System Administration',
            'is_bootstrap' => true,
            'is_validated' => true,
            'email_verified_at' => now(),
            'schedule_initialized' => true,
        ]);
        return 'Admin user forcibly created!';
    }
    return 'Admin user already exists!';
});
// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class , 'logout']);
    Route::get('/user', [AuthController::class , 'user']);

    // Events
    Route::get('/dashboard', [App\Http\Controllers\DashboardController::class , 'index']);
    Route::get('/events', [EventController::class , 'index']);
    Route::post('/events', [EventController::class , 'store']);

    Route::put('/events/{event}', [EventController::class , 'update']);
    Route::delete('/events/{event}', [EventController::class , 'destroy']);
    Route::post('/events/{event}/respond', [EventController::class , 'respondToInvitation']);

    // Personal Events
    Route::post('/personal-events', [App\Http\Controllers\PersonalEventController::class , 'store']);
    Route::put('/personal-events/{event}', [App\Http\Controllers\PersonalEventController::class , 'update']);
    Route::delete('/personal-events/{event}', [App\Http\Controllers\PersonalEventController::class , 'destroy']);

    // Default Events (Academic Calendar) - View access for all authenticated users
    Route::get('/default-events', [DefaultEventController::class , 'index']);

    // Default Events V2 (New Architecture with separate date tracking)
    Route::get('/default-events/v2', [DefaultEventControllerV2::class , 'index']);
    Route::get('/default-events/v2/scheduled', [DefaultEventControllerV2::class , 'getScheduledEvents']);
    Route::get('/default-events/v2/statistics', [DefaultEventControllerV2::class , 'getStatistics']);

    Route::get('/default-events', [DefaultEventController::class , 'index']);

    // Default Events (Academic Calendar) - Admin Only for modifications
    Route::middleware('admin')->group(function () {
            Route::put('/default-events/{id}/date', [DefaultEventController::class , 'updateDate']);
            Route::post('/default-events/create-empty', [DefaultEventController::class , 'createEmptyEvent']);
            Route::post('/default-events/create-with-details', [DefaultEventController::class , 'createEventWithDetails']);

            // Archive
            Route::get('/archive', [ArchiveController::class , 'index']);
            Route::post('/archive/past-events', [ArchiveController::class , 'archivePastEvents']);
        }
        );

        // Users
        Route::get('/users', [UserController::class , 'index']);
        Route::get('/users/all', [UserController::class , 'all']);
        Route::get('/users/pending-validation', [UserController::class , 'pendingValidation']);
        Route::post('/users', [UserController::class , 'store']);
        Route::post('/users/dean', [UserController::class , 'createDean']);
        Route::put('/users/{id}/role', [UserController::class , 'updateRole']);
        Route::post('/user/profile', [UserController::class , 'update']);
        Route::post('/users/{id}/validate', [UserController::class , 'validateUser']);
        Route::post('/users/{id}/revoke-validation', [UserController::class , 'revokeValidation']);

        // Schedules
        Route::get('/schedules', [ScheduleController::class , 'index']);
        Route::post('/schedules', [ScheduleController::class , 'store']);
        Route::delete('/schedules/{id}', [ScheduleController::class , 'destroy']);
        Route::post('/schedules/check-conflicts', [ScheduleController::class , 'checkConflicts']);

        // Messages
        Route::get('/messages', [App\Http\Controllers\MessageController::class , 'index']);
        Route::post('/messages', [App\Http\Controllers\MessageController::class , 'store']);
        Route::post('/messages/{id}/read', [App\Http\Controllers\MessageController::class , 'markAsRead']);
        Route::get('/messages/unread-count', [App\Http\Controllers\MessageController::class , 'unreadCount']);
        Route::delete('/messages/{id}', [App\Http\Controllers\MessageController::class , 'destroy']);

        // Activity History
        Route::get('/activities', [App\Http\Controllers\ActivityController::class , 'index']);
    });
