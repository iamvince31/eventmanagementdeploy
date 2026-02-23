<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DefaultEventController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ScheduleController;
use Illuminate\Support\Facades\Route;

// Public routes with login attempt throttling
Route::middleware('throttle.login')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-verification', [AuthController::class, 'resendVerificationOtp']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/request-otp', [AuthController::class, 'requestOtp']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/reset-password-otp', [AuthController::class, 'resetPasswordWithOtp']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/verify-email-link', [AuthController::class, 'verifyEmailLink']);

// Public routes - Default Events (academic calendar)
Route::get('/default-events', [DefaultEventController::class, 'index']);

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
    Route::get('/users/all', [UserController::class, 'all']);
    Route::put('/users/{id}/role', [UserController::class, 'updateRole']);
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
