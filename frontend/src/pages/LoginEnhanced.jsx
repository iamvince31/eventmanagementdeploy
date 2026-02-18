import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import AuthBackground from '../components/AuthBackground';

export default function LoginEnhanced() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [lockoutInfo, setLockoutInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState('laravel'); // 'laravel' or 'supabase'
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [pendingFactorId, setPendingFactorId] = useState(null);
  
  const { login: laravelLogin } = useAuth();
  const { signIn: supabaseSignIn, verifyMFA, mfaRequired } = useSupabaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (mfaRequired) {
      setShowMfaInput(true);
    }
  }, [mfaRequired]);

  const handleLaravelLogin = async () => {
    try {
      await laravelLogin(email, password);
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      navigate('/dashboard');
    } catch (err) {
      const response = err.response?.data;
      
      if (err.response?.status === 429 && response?.remaining_seconds) {
        setLockoutInfo({
          message: response.message,
          remainingSeconds: response.remaining_seconds,
        });
        
        const interval = setInterval(() => {
          setLockoutInfo(prev => {
            if (!prev || prev.remainingSeconds <= 1) {
              clearInterval(interval);
              return null;
            }
            return {
              ...prev,
              remainingSeconds: prev.remainingSeconds - 1,
            };
          });
        }, 1000);
      } else {
        const errorMessage = response?.errors?.email?.[0] || response?.message || 'Invalid credentials';
        setError(errorMessage);
      }
    }
  };

  const handleSupabaseLogin = async () => {
    try {
      const result = await supabaseSignIn(email, password);
      
      if (result.requiresMfa) {
        setShowMfaInput(true);
        setPendingFactorId(result.factorId);
        setError('');
      } else if (result.success) {
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    }
  };

  const handleMfaVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await verifyMFA(pendingFactorId, mfaCode);
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid 2FA code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLockoutInfo(null);
    setLoading(true);

    try {
      if (authMethod === 'laravel') {
        await handleLaravelLogin();
      } else {
        await handleSupabaseLogin();
      }
    } finally {
      setLoading(false);
    }
  };

  if (showMfaInput) {
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
              <h2 className="text-3xl font-extrabold text-gray-900">
                Two-Factor Authentication
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleMfaVerification}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="ml-3 text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="appearance-none relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-center text-3xl tracking-widest font-mono"
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
                  onClick={() => {
                    setShowMfaInput(false);
                    setMfaCode('');
                    setError('');
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || mfaCode.length !== 6}
                  className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
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
              Event Management System
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to your account
            </p>
          </div>

          {/* Auth Method Selector */}
          <div className="mt-6">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setAuthMethod('laravel')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                  authMethod === 'laravel'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Standard Login
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('supabase')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                  authMethod === 'supabase'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center justify-center gap-1">
                  Secure Login
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
              </button>
            </div>
            {authMethod === 'supabase' && (
              <p className="mt-2 text-xs text-center text-gray-500">
                Enhanced security with 2FA support
              </p>
            )}
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {lockoutInfo && (
              <div className="rounded-md bg-red-50 border-2 border-red-400 p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-bold text-red-800">Account Locked</h3>
                    <p className="text-sm text-red-700 mt-1">{lockoutInfo.message}</p>
                    <div className="mt-2 bg-red-100 rounded px-3 py-2">
                      <p className="text-sm font-mono text-red-900">
                        Time remaining: {Math.floor(lockoutInfo.remainingSeconds / 60)}:{String(lockoutInfo.remainingSeconds % 60).padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {error && !lockoutInfo && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="ml-3 text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  pattern={authMethod === 'laravel' ? "^main\\.[A-Za-z]+\\.[A-Za-z]+@cvsu\\.edu\\.ph$" : undefined}
                  title={authMethod === 'laravel' ? "Use this format: main.firstname.lastname@cvsu.edu.ph" : "Enter your email address"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-600 focus:border-green-600 focus:z-10 sm:text-sm"
                  placeholder={authMethod === 'laravel' ? "main.firstname.lastname@cvsu.edu.ph" : "Email address"}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-600 focus:border-green-600 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-green-700 focus:ring-green-600 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" className="text-sm font-medium text-green-700 hover:text-green-600">
                Forgot password?
              </Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || lockoutInfo}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lockoutInfo ? (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Account Locked
                  </span>
                ) : loading ? (
                  'Signing in...'
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link to="/register" className="font-medium text-green-700 hover:text-green-600">
                Don't have an account? Register
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
