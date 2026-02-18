import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { QRCodeSVG } from 'qrcode.react';
import AuthBackground from '../components/AuthBackground';

export default function RegisterUnified() {
  const [step, setStep] = useState(1); // 1: Register, 2: Email Sent, 3: Optional 2FA
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  
  // 2FA states
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  
  const { signUp, enrollMFA, verifyMFA } = useSupabaseAuth();
  const navigate = useNavigate();

  const departments = [
    'Department of Information Technology',
    'Department of Agriculture and Food Engineering',
    'Department of Civil Engineering',
    'Department of Computer, Electronics, and Electrical Engineering',
    'Department of Industrial Engineering and Technology'
  ];

  const handleEmailVerification = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Check format first
    const cvsuEmailPattern = /^main\.[A-Za-z]+\.[A-Za-z]+@cvsu\.edu\.ph$/;
    if (!cvsuEmailPattern.test(email)) {
      setError('Please use the correct CVSU email format: main.firstname.lastname@cvsu.edu.ph');
      return;
    }

    setVerifyingEmail(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/email/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.valid) {
        setEmailVerified(true);
        setError('');
      } else {
        setEmailVerified(false);
        setError(data.message || 'This CVSU email address does not exist. Please check and try again.');
      }
    } catch (err) {
      console.error('Email verification error:', err);
      setError('Unable to verify email. Please try again.');
      setEmailVerified(false);
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Check if email is verified
    if (!emailVerified) {
      setError('Please verify your CVSU email address first');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!department) {
      setError('Please select a department');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password, username, department);
      
      if (result.success) {
        // Skip email verification step, go directly to 2FA setup option
        setStep(2);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await enrollMFA();
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setFactorId(result.factorId);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await verifyMFA(factorId, mfaCode);
      navigate('/login', { 
        state: { message: 'Registration complete! 2FA is now enabled. Please sign in.' }
      });
    } catch (err) {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip2FA = () => {
    navigate('/login', { 
      state: { message: 'Registration complete! You can now sign in.' }
    });
  };

  // Step 1: Registration Form
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        <AuthBackground />
        
        <div className="max-w-md w-full space-y-8 relative z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Create your account
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Join the Event Management System
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleRegister}>
              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-4">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="ml-3 text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-600 focus:border-green-600 sm:text-sm"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    CVSU Email Address
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      id="email"
                      type="email"
                      required
                      pattern="^main\.[A-Za-z]+\.[A-Za-z]+@cvsu\.edu\.ph$"
                      title="Use this format: main.firstname.lastname@cvsu.edu.ph"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailVerified(false); // Reset verification when email changes
                      }}
                      className={`flex-1 block px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-600 focus:border-green-600 sm:text-sm ${
                        emailVerified 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300'
                      }`}
                      placeholder="main.firstname.lastname@cvsu.edu.ph"
                      disabled={emailVerified}
                    />
                    <button
                      type="button"
                      onClick={handleEmailVerification}
                      disabled={verifyingEmail || emailVerified || !email}
                      className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed ${
                        emailVerified
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {verifyingEmail ? (
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : emailVerified ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        'Verify'
                      )}
                    </button>
                  </div>
                  {emailVerified && (
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Email verified successfully
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <select
                    id="department"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-600 focus:border-green-600 sm:text-sm"
                  >
                    <option value="">Select a department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-600 focus:border-green-600 sm:text-sm"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-600 focus:border-green-600 sm:text-sm"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <div className="text-center">
                <Link to="/login" className="font-medium text-green-700 hover:text-green-600">
                  Already have an account? Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Registration Success - Optional 2FA
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        <AuthBackground />
        
        <div className="max-w-md w-full space-y-8 relative z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                Account Created Successfully!
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Your account has been created for<br />
                <span className="font-medium text-gray-900">{email}</span>
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  You can now login to your account. For extra security, you can optionally set up two-factor authentication.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleSetup2FA}
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {loading ? 'Setting up...' : 'Setup 2FA (Recommended)'}
                </button>

                <button
                  onClick={handleSkip2FA}
                  className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                >
                  Continue to Login
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: 2FA Setup
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        <AuthBackground />
        
        <div className="max-w-md w-full space-y-8 relative z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                Setup Two-Factor Authentication
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Scan this QR code with your authenticator app
              </p>

              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4 inline-block">
                <QRCodeSVG value={qrCode} size={200} />
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <p className="text-xs text-gray-600 mb-1">Or enter this code manually:</p>
                <code className="text-sm font-mono text-gray-900 break-all">{secret}</code>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="mfaCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter 6-digit code from your app
                  </label>
                  <input
                    id="mfaCode"
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="block w-full px-3 py-4 border border-gray-300 rounded-lg text-center text-3xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
                    placeholder="000000"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSkip2FA}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={loading || mfaCode.length !== 6}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                </div>
              </form>

              <p className="mt-4 text-xs text-gray-500">
                Recommended apps: Google Authenticator, Authy, Microsoft Authenticator
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
