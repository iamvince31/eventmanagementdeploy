<?php

namespace App\Http\Controllers;

use App\Services\EmailVerificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmailVerificationController extends Controller
{
    protected $emailVerification;

    public function __construct(EmailVerificationService $emailVerification)
    {
        $this->emailVerification = $emailVerification;
    }

    /**
     * Verify if a CVSU email exists
     */
    public function verifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid email format',
                'errors' => $validator->errors()
            ], 422);
        }

        $email = $request->email;
        $result = $this->emailVerification->verifyCVSUEmail($email);

        return response()->json($result);
    }

    /**
     * Quick email check (DNS only)
     */
    public function quickCheck(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid email format'
            ], 422);
        }

        $valid = $this->emailVerification->quickEmailCheck($request->email);

        return response()->json([
            'valid' => $valid,
            'message' => $valid ? 'Email format is valid' : 'Invalid CVSU email'
        ]);
    }
}
