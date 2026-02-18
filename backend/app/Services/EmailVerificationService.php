<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class EmailVerificationService
{
    /**
     * Verify if a CVSU email exists at Google
     * 
     * @param string $email
     * @return array ['valid' => bool, 'message' => string]
     */
    public function verifyCVSUEmail($email)
    {
        // Validate email format first
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'valid' => false,
                'message' => 'Invalid email format'
            ];
        }

        // Check if it's a CVSU email
        if (!$this->isCVSUEmail($email)) {
            return [
                'valid' => false,
                'message' => 'Email must be a CVSU email address (main.firstname.lastname@cvsu.edu.ph)'
            ];
        }

        // Verify email exists at Google
        try {
            $exists = $this->checkEmailExistsAtGoogle($email);
            
            if ($exists) {
                return [
                    'valid' => true,
                    'message' => 'Email verified successfully'
                ];
            } else {
                return [
                    'valid' => false,
                    'message' => 'This CVSU email address does not exist. Please check your email and try again.'
                ];
            }
        } catch (\Exception $e) {
            Log::error('Email verification error: ' . $e->getMessage());
            
            // If verification fails, allow registration but log the error
            // This prevents blocking legitimate users if the verification service is down
            return [
                'valid' => true,
                'message' => 'Email verification service unavailable, proceeding with registration',
                'warning' => true
            ];
        }
    }

    /**
     * Check if email is a CVSU email
     */
    private function isCVSUEmail($email)
    {
        return preg_match('/^main\.[A-Za-z]+\.[A-Za-z]+@cvsu\.edu\.ph$/', $email);
    }

    /**
     * Check if email exists at Google using SMTP verification
     */
    private function checkEmailExistsAtGoogle($email)
    {
        $domain = 'gmail-smtp-in.l.google.com';
        $port = 25;
        $timeout = 10;

        try {
            // Connect to Google's SMTP server
            $socket = @fsockopen($domain, $port, $errno, $errstr, $timeout);
            
            if (!$socket) {
                throw new \Exception("Cannot connect to SMTP server: $errstr ($errno)");
            }

            // Set timeout for socket operations
            stream_set_timeout($socket, $timeout);

            // Read initial response
            $response = fgets($socket);
            if (strpos($response, '220') === false) {
                fclose($socket);
                throw new \Exception("Invalid SMTP response: $response");
            }

            // Send HELO command
            fputs($socket, "HELO cvsu.edu.ph\r\n");
            $response = fgets($socket);

            // Send MAIL FROM command
            fputs($socket, "MAIL FROM: <noreply@cvsu.edu.ph>\r\n");
            $response = fgets($socket);

            // Send RCPT TO command (this checks if email exists)
            fputs($socket, "RCPT TO: <$email>\r\n");
            $response = fgets($socket);

            // Close connection
            fputs($socket, "QUIT\r\n");
            fclose($socket);

            // Check response
            // 250 = Email exists
            // 550 = Email doesn't exist
            if (strpos($response, '250') !== false) {
                return true;
            } elseif (strpos($response, '550') !== false) {
                return false;
            }

            // If we get here, response was unclear, assume email exists to avoid false negatives
            Log::warning("Unclear SMTP response for $email: $response");
            return true;

        } catch (\Exception $e) {
            Log::error("SMTP verification failed for $email: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Alternative method: Check using DNS MX records
     * This is faster but less accurate
     */
    public function quickEmailCheck($email)
    {
        // Validate format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        // Check if it's CVSU email
        if (!$this->isCVSUEmail($email)) {
            return false;
        }

        // Check if domain has MX records
        $domain = substr(strrchr($email, "@"), 1);
        return checkdnsrr($domain, 'MX');
    }
}
