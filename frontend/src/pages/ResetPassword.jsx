import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import api from '../services/api';
import AuthBackground from '../components/AuthBackground';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Password strength checks
  const passwordChecks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passedChecks = Object.values(passwordChecks).filter(Boolean).length;
  const isStrongEnough = passedChecks >= 4;

  const getStrength = () => {
    if (password.length === 0) return null;
    if (passedChecks <= 2) return { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-600', width: 'w-1/4' };
    if (passedChecks === 3) return { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600', width: 'w-2/4' };
    if (passedChecks === 4) return { label: 'Strong', color: 'bg-blue-500', textColor: 'text-blue-600', width: 'w-3/4' };
    return { label: 'Very Strong', color: 'bg-green-500', textColor: 'text-green-600', width: 'w-full' };
  };
  const strength = getStrength();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Link-based flow (from email link)
  const linkToken = searchParams.get('token');
  const linkEmail = searchParams.get('email');

  // OTP-based flow (from verify-email page after forgot-password)
  const otpEmail = location.state?.email;
  const resetToken = location.state?.reset_token;

  const isOtpFlow = !!(otpEmail && resetToken);
  const isLinkFlow = !!(linkToken && linkEmail);
  const isValidLink = isOtpFlow || isLinkFlow;

  const email = isOtpFlow ? otpEmail : linkEmail;
  const token = isOtpFlow ? resetToken : linkToken;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isStrongEnough) {
      setError('Password must be at least Strong. Add more character types.');
      return;
    }

    setLoading(true);

    try {
      if (isOtpFlow) {
        // OTP-based reset
        await api.post('/reset-password-otp', {
          email,
          reset_token: token,
          password,
          password_confirmation: confirmPassword,
        });
      } else {
        // Link-based reset (Laravel password broker)
        await api.post('/reset-password', {
          email,
          token,
          password,
          password_confirmation: confirmPassword,
        });
      }

      setSuccess('Password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successfully! Please sign in with your new password.' } });
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reset password. The link may have expired.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isValidLink) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        <AuthBackground />
        <div className="max-w-md w-full space-y-8 relative z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-4">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="ml-3 text-sm text-red-800">
                  Invalid or expired reset link. Please request a new password reset.
                </p>
              </div>
            </div>
            <div className="text-center">
              <Link to="/forgot-password" className="font-medium text-green-700 hover:text-green-600">
                Request New Reset Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      <AuthBackground />

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create New Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your new password below
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
            {success && (
              <div className="rounded-md bg-green-50 border border-green-200 p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="ml-3 text-sm text-green-800">{success}</p>
                </div>
              </div>
            )}
            <div className="space-y-4">
              {/* New Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password</label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-600 focus:border-green-600 sm:text-sm"
                    placeholder="Enter new password"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Password strength</span>
                      {strength && <span className={`text-xs font-semibold ${strength.textColor}`}>{strength.label}</span>}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${strength?.color} ${strength?.width}`}></div>
                    </div>
                  </div>
                )}

                {/* Requirements checklist */}
                {(passwordFocused || password.length > 0) && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                    <p className="text-xs font-medium text-gray-600 mb-1.5">Password requirements:</p>
                    {[
                      { key: 'minLength', label: 'At least 8 characters' },
                      { key: 'uppercase', label: 'One uppercase letter (A–Z)' },
                      { key: 'lowercase', label: 'One lowercase letter (a–z)' },
                      { key: 'number', label: 'One number (0–9)' },
                      { key: 'special', label: 'One special character (!@#$...)' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-1.5">
                        {passwordChecks[key] ? (
                          <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-7V7a1 1 0 112 0v4a1 1 0 11-2 0zm1 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className={`text-xs ${passwordChecks[key] ? 'text-green-600' : 'text-gray-500'}`}>{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="relative mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-600 focus:border-green-600 sm:text-sm"
                    placeholder="Confirm new password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p className={`mt-1 text-xs ${password === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                    {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>

            <div className="text-center">
              <Link to="/login" className="font-medium text-green-700 hover:text-green-600">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
