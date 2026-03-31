import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import AuthBackground from '../components/AuthBackground';

export default function EmailVerification() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState('register'); // 'register' | 'forgot-password'

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const emailFromState = location.state?.email;
    const modeFromState = location.state?.mode || 'register';
    if (emailFromState) {
      setEmail(emailFromState);
      setMode(modeFromState);
    } else {
      navigate('/register');
    }
  }, [location.state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'forgot-password') {
        // Forgot password flow — verify OTP then go to reset-password
        const response = await api.post('/verify-otp', {
          email: email.trim(),
          otp: otp.trim()
        });
        setSuccess('OTP verified! Redirecting...');
        setTimeout(() => {
          navigate('/reset-password', {
            state: { email, reset_token: response.data.reset_token }
          });
        }, 1000);
      } else {
        // Registration flow — verify email OTP then go to login
        await api.post('/verify-email', {
          email: email.trim(),
          otp: otp.trim()
        });
        setSuccess('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login', { state: { verified: true } });
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    setResending(true);

    try {
      if (mode === 'forgot-password') {
        await api.post('/request-otp', { email: email.trim() });
      } else {
        await api.post('/resend-verification', { email: email.trim() });
      }
      setSuccess('Verification code sent! Please check your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      <AuthBackground />

      {/* Verification Form */}
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              {mode === 'forgot-password' ? 'Verify OTP' : 'Verify Your Email'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {mode === 'forgot-password' ? 'We sent a reset code to' : 'We sent a verification code to'}
            </p>
            <p className="text-sm font-semibold text-green-600">
              {email}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-center text-2xl font-mono tracking-widest sm:text-sm"
                placeholder="000000"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Verify Email'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="font-medium text-green-600 hover:text-green-500 disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
              </p>
              <div className="flex justify-center gap-4 text-sm">
                {mode === 'forgot-password' ? (
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="font-medium text-gray-500 hover:text-gray-700"
                  >
                    Back to Forgot Password
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate('/register')}
                      className="font-medium text-gray-500 hover:text-gray-700"
                    >
                      Back to Register
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="font-medium text-gray-500 hover:text-gray-700"
                    >
                      Back to Login
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
