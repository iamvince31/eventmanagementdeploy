<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class BrevoMailService
{
    protected $fromEmail;
    protected $fromName;

    public function __construct()
    {
        $this->fromEmail = config('mail.from.address');
        $this->fromName = config('mail.from.name');
    }

    /**
     * Send OTP email for password reset
     */
    public function sendPasswordResetOtp(string $email, string $otp, string $userName): bool
    {
        try {
            $subject = '🔐 Your Password Reset OTP Code';
            $htmlContent = $this->buildOtpEmailHtml($userName, $otp);

            dispatch(function () use ($email, $subject, $htmlContent) {
                try {
                    Mail::html($htmlContent, function ($message) use ($email, $subject) {
                                $message->to($email)
                                    ->subject($subject);
                            }
                            );
                            Log::info('Password reset OTP email sent', [
                                'email' => $email,
                                'timestamp' => now(),
                            ]);
                        }
                        catch (\Exception $e) {
                            Log::error('Failed to send OTP email', [
                                'email' => $email,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    })->afterResponse();

            return true;
        }
        catch (\Exception $e) {
            Log::error('Failed to send OTP email', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send password reset confirmation email
     */
    public function sendPasswordResetConfirmation(string $email, string $userName): bool
    {
        try {
            $subject = '✅ Password Reset Successful';
            $htmlContent = $this->buildConfirmationEmailHtml($userName);

            dispatch(function () use ($email, $subject, $htmlContent) {
                try {
                    Mail::html($htmlContent, function ($message) use ($email, $subject) {
                                $message->to($email)
                                    ->subject($subject);
                            }
                            );
                            Log::info('Password reset confirmation email sent', [
                                'email' => $email,
                                'timestamp' => now(),
                            ]);
                        }
                        catch (\Exception $e) {
                            Log::error('Failed to send confirmation email', [
                                'email' => $email,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    })->afterResponse();

            return true;
        }
        catch (\Exception $e) {
            Log::error('Failed to send confirmation email', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send registration verification email with OTP
     */
    public function sendRegistrationOtp(string $email, string $otp, string $userName): bool
    {
        try {
            $subject = '✉️ Verify Your Email — Event Management System';
            $htmlContent = $this->buildRegistrationOtpHtml($userName, $otp);

            dispatch(function () use ($email, $subject, $htmlContent) {
                try {
                    Mail::html($htmlContent, function ($message) use ($email, $subject) {
                                $message->to($email)
                                    ->subject($subject);
                            }
                            );
                            Log::info('Registration verification email sent', [
                                'email' => $email,
                                'timestamp' => now(),
                            ]);
                        }
                        catch (\Exception $e) {
                            Log::error('Failed to send registration verification email', [
                                'email' => $email,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    })->afterResponse();

            return true;
        }
        catch (\Exception $e) {
            Log::error('Failed to send registration verification email', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send email verification link
     */
    public function sendVerificationLink(string $email, string $verificationLink, string $userName): bool
    {
        try {
            $subject = '✉️ Verify Your Email — Event Management System';
            $htmlContent = '
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; padding: 20px 0;">
                    <h1 style="color: #15803d; margin: 0;">Event Management System</h1>
                    <p style="color: #6b7280; font-size: 14px;">CvSU - CEIT OJT</p>
                </div>
                <div style="background: #f9fafb; border-radius: 12px; padding: 32px; text-align: center;">
                    <h2 style="color: #111827; margin-bottom: 8px;">Verify Your Email Address</h2>
                    <p style="color: #6b7280; margin-bottom: 24px;">
                        Hi ' . htmlspecialchars($userName) . ', click the button below to verify your email address and activate your account.
                    </p>
                    <a href="' . $verificationLink . '" 
                       style="display: inline-block; background: #15803d; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Verify My Email
                    </a>
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
                        If the button doesn\'t work, copy and paste this link into your browser:<br>
                        <a href="' . $verificationLink . '" style="color: #15803d; word-break: break-all;">' . $verificationLink . '</a>
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">
                        This link will expire in 24 hours.
                    </p>
                </div>
                <div style="text-align: center; padding: 20px 0; color: #9ca3af; font-size: 12px;">
                    <p>If you didn\'t create an account, you can safely ignore this email.</p>
                </div>
            </div>';

            dispatch(function () use ($email, $subject, $htmlContent) {
                try {
                    Mail::html($htmlContent, function ($message) use ($email, $subject) {
                                $message->to($email)
                                    ->subject($subject);
                            }
                            );
                            Log::info('Verification link email sent', [
                                'email' => $email,
                                'timestamp' => now(),
                            ]);
                        }
                        catch (\Exception $e) {
                            Log::error('Failed to send verification link email', [
                                'email' => $email,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    })->afterResponse();

            return true;
        }
        catch (\Exception $e) {
            Log::error('Failed to send verification link email', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Build HTML email template for password reset OTP
     */
    protected function buildOtpEmailHtml(string $userName, string $otp): string
    {
        return <<<HTML

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-code { background-color: #fff; border: 2px dashed #4F46E5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; }
        .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{$userName}</strong>,</p>
            <p>You requested to reset your password for your Event Management System account.</p>
            <p>Use the OTP code below to proceed with your password reset:</p>
            
            <div class="otp-code">{$otp}</div>
            
            <div class="warning">
                <p style="margin: 0;"><strong>⏱️ This code will expire in 10 minutes.</strong></p>
                <p style="margin: 8px 0 0 0;">🔒 Never share this code with anyone.</p>
            </div>
            
            <p>If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
            
            <div class="footer">
                <p>Best regards,<br><strong>Event Management System Team</strong></p>
            </div>
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Build HTML email template for confirmation
     */
    protected function buildConfirmationEmailHtml(string $userName): string
    {
        return <<<HTML

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Password Reset Successful</h1>
        </div>
        <div class="content">
            <div class="success-icon">🎉</div>
            <p>Hello <strong>{$userName}</strong>,</p>
            <p>Your password has been successfully reset.</p>
            <p>You can now log in to your Event Management System account using your new password.</p>
            <p>If you did not make this change, please contact support immediately.</p>
            
            <div class="footer">
                <p>Best regards,<br><strong>Event Management System Team</strong></p>
            </div>
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Build HTML email for registration OTP
     */
    protected function buildRegistrationOtpHtml(string $userName, string $otp): string
    {
        return <<<HTML

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #15803d; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-code { background-color: #fff; border: 2px dashed #15803d; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; }
        .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✉️ Verify Your Email</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{$userName}</strong>,</p>
            <p>Welcome to the Event Management System! Please verify your email address by entering the code below:</p>
            
            <div class="otp-code">{$otp}</div>
            
            <div class="warning">
                <p style="margin: 0;"><strong>⏱️ This code will expire in 10 minutes.</strong></p>
                <p style="margin: 8px 0 0 0;">🔒 Never share this code with anyone.</p>
            </div>
            
            <p>If you did not create an account, please ignore this email.</p>
            
            <div class="footer">
                <p>Best regards,<br><strong>Event Management System Team</strong></p>
            </div>
        </div>
    </div>
</body>
</html>
HTML;
    }
}
