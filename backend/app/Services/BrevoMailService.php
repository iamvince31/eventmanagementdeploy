<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class BrevoMailService
{
    protected $fromEmail;
    protected $fromName;

    public function __construct()
    {
        $this->fromEmail = env('MAIL_FROM_ADDRESS', 'asibormarkvincent@gmail.com');
        $this->fromName = env('MAIL_FROM_NAME', 'EventManagement');
    }

    /**
     * Unified method to dispatch an email via HTTP API (preferred for Render) or SMTP fallback.
     */
    private function dispatchEmail(string $email, string $subject, string $htmlContent, string $logMessage): bool
    {
        try {
            dispatch(function () use ($email, $subject, $htmlContent, $logMessage) {
                // If BREVO_API_KEY is provided, use the HTTPS API (Bypasses Render SMTP Block)
                $apiKey = config('services.brevo.key');

                if (!empty($apiKey)) {
                    try {
                        $response = Http::withHeaders([
                            'api-key' => $apiKey,
                            'Content-Type' => 'application/json',
                            'accept' => 'application/json'
                        ])->timeout(10)->post('https://api.brevo.com/v3/smtp/email', [
                            'sender' => ['name' => $this->fromName, 'email' => $this->fromEmail],
                            'to' => [['email' => $email]],
                            'subject' => $subject,
                            'htmlContent' => $htmlContent
                        ]);

                        if ($response->successful()) {
                            Log::info($logMessage . ' (via API)', [
                                'email' => $email,
                                'timestamp' => now(),
                            ]);
                            return;
                        }
                        else {
                            throw new \Exception('Brevo API returned error: ' . $response->body());
                        }
                    }
                    catch (\Exception $e) {
                        Log::error('Failed to send email via Brevo API', [
                            'email' => $email,
                            'error' => $e->getMessage(),
                        ]);
                        return; // Stop execution if API fails
                    }
                }

                // Fallback to standard SMTP if no API key is provided
                $originalTimeout = ini_get('default_socket_timeout');
                ini_set('default_socket_timeout', 3);
                try {
                    Mail::html($htmlContent, function ($message) use ($email, $subject) {
                                $message->to($email)->subject($subject);
                            }
                            );
                            Log::info($logMessage . ' (via SMTP)', [
                                'email' => $email,
                                'timestamp' => now(),
                            ]);
                        }
                        catch (\Exception $e) {
                            Log::error('Failed to send email via SMTP', [
                                'email' => $email,
                                'error' => $e->getMessage(),
                            ]);
                        }
                        finally {
                            ini_set('default_socket_timeout', $originalTimeout);
                        }
                    })->afterResponse();

            return true;
        }
        catch (\Exception $e) {
            Log::error('Failed to dispatch email job', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send OTP email for password reset
     */
    public function sendPasswordResetOtp(string $email, string $otp, string $userName): bool
    {
        $subject = '🔐 Your Password Reset OTP Code';
        $htmlContent = $this->buildOtpEmailHtml($userName, $otp);
        return $this->dispatchEmail($email, $subject, $htmlContent, 'Password reset OTP email sent');
    }

    /**
     * Send password reset confirmation email
     */
    public function sendPasswordResetConfirmation(string $email, string $userName): bool
    {
        $subject = '✅ Password Reset Successful';
        $htmlContent = $this->buildConfirmationEmailHtml($userName);
        return $this->dispatchEmail($email, $subject, $htmlContent, 'Password reset confirmation email sent');
    }

    /**
     * Send registration verification email with OTP
     */
    public function sendRegistrationOtp(string $email, string $otp, string $userName): bool
    {
        $subject = '✉️ Verify Your Email — Event Management System';
        $htmlContent = $this->buildRegistrationOtpHtml($userName, $otp);
        return $this->dispatchEmail($email, $subject, $htmlContent, 'Registration verification email sent');
    }

    /**
     * Send email verification link
     */
    public function sendVerificationLink(string $email, string $verificationLink, string $userName): bool
    {
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

        return $this->dispatchEmail($email, $subject, $htmlContent, 'Verification link email sent');
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
            <p>Hello <strong>{\$userName}</strong>,</p>
            <p>You requested to reset your password for your Event Management System account.</p>
            <p>Use the OTP code below to proceed with your password reset:</p>
            
            <div class="otp-code">{\$otp}</div>
            
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
            <p>Hello <strong>{\$userName}</strong>,</p>
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
            <p>Hello <strong>{\$userName}</strong>,</p>
            <p>Welcome to the Event Management System! Please verify your email address by entering the code below:</p>
            
            <div class="otp-code">{\$otp}</div>
            
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
