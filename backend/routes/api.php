<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DefaultEventController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\EventRequestController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\SetupAdminController;
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

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class , 'logout']);
    Route::get('/user', [AuthController::class , 'user']);

    // Bootstrap Admin Setup
    Route::get('/setup/check-bootstrap', [SetupAdminController::class , 'checkBootstrapStatus']);
    Route::post('/setup/create-admin', [SetupAdminController::class , 'createPermanentAdmin']);

    // Events
    Route::get('/dashboard', [App\Http\Controllers\DashboardController::class , 'index']);
    Route::get('/events', [EventController::class , 'index']);
    Route::post('/events', [EventController::class , 'store']);
    Route::post('/events/validate-hierarchy', [EventController::class , 'validateHierarchy']);
    Route::put('/events/{event}', [EventController::class , 'update']);
    Route::delete('/events/{event}', [EventController::class , 'destroy']);
    Route::post('/events/{event}/respond', [EventController::class , 'respondToInvitation']);

    // Personal Events
    Route::post('/personal-events', [App\Http\Controllers\PersonalEventController::class , 'store']);
    Route::put('/personal-events/{event}', [App\Http\Controllers\PersonalEventController::class , 'update']);
    Route::delete('/personal-events/{event}', [App\Http\Controllers\PersonalEventController::class , 'destroy']);

    // Event Requests
    Route::get('/event-requests', [EventRequestController::class , 'index']);
    Route::post('/event-requests', [EventRequestController::class , 'store']);
    Route::get('/event-requests/my-requests', [EventRequestController::class , 'myRequests']);
    Route::get('/event-requests/has-approved', [EventRequestController::class , 'hasApprovedRequests']);
    Route::post('/event-requests/{eventRequest}/review', [EventRequestController::class , 'review']);
    Route::post('/event-requests/{eventRequest}/approve', [EventRequestController::class , 'approve']);
    Route::post('/event-requests/{eventRequest}/decline', [EventRequestController::class , 'decline']);
    Route::post('/event-requests/{eventRequest}/revert', [EventRequestController::class , 'revert']);
    Route::delete('/event-requests/{eventRequest}', [EventRequestController::class , 'destroy']);


    // Hierarchy Approvals
    Route::post('/hierarchy-approvals/{approval}/review', [EventRequestController::class , 'reviewHierarchyApproval']);
    Route::get('/hierarchy-approvals/{approval}/details', [EventRequestController::class , 'getApprovalDetails']);

    // Default Events (Academic Calendar) - View access for all authenticated users
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
        Route::put('/users/{id}/role', [UserController::class , 'updateRole']);
        Route::put('/user/profile', [UserController::class , 'update']);
        Route::post('/users/{id}/validate', [UserController::class , 'validateUser']);
        Route::post('/users/{id}/revoke-validation', [UserController::class , 'revokeValidation']);

        // Schedules
        Route::get('/schedules', [ScheduleController::class , 'index']);
        Route::post('/schedules', [ScheduleController::class , 'store']);
        Route::delete('/schedules/{id}', [ScheduleController::class , 'destroy']);
        Route::post('/schedules/check-conflicts', [ScheduleController::class , 'checkConflicts']);

        // Reschedule Requests
        Route::get('/events/{event}/reschedule-requests', [App\Http\Controllers\EventRescheduleRequestController::class , 'index']);
        Route::post('/events/{event}/reschedule', [App\Http\Controllers\EventRescheduleRequestController::class , 'store']);
        Route::post('/reschedule-requests/{id}/respond', [App\Http\Controllers\EventRescheduleRequestController::class , 'respond']);

        // Messages
        Route::get('/messages', [App\Http\Controllers\MessageController::class , 'index']);
        Route::post('/messages', [App\Http\Controllers\MessageController::class , 'store']);
        Route::post('/messages/{id}/read', [App\Http\Controllers\MessageController::class , 'markAsRead']);
        Route::get('/messages/unread-count', [App\Http\Controllers\MessageController::class , 'unreadCount']);
        Route::delete('/messages/{id}', [App\Http\Controllers\MessageController::class , 'destroy']);

        // Activity History
        Route::get('/activities', [App\Http\Controllers\ActivityController::class , 'index']);    });
