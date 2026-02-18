import { useState } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { QRCodeSVG } from 'qrcode.react';

export default function SupabaseTest() {
  const {
    user,
    session,
    loading,
    mfaRequired,
    signUp,
    signIn,
    signOut,
    sendPasswordResetEmail,
    updatePassword,
    enrollMFA,
    verifyMFA,
    unenrollMFA,
    listMFAFactors,
  } = useSupabaseAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [department, setDepartment] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  
  // MFA states
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [mfaFactors, setMfaFactors] = useState([]);
  
  // Message states
  const [message, setMessage] = useState({ type: '', text: '' });
  const [testLoading, setTestLoading] = useState(false);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setTestLoading(true);
    try {
      const result = await signUp(email, password, username, department);
      showMessage('success', result.message);
      setEmail('');
      setPassword('');
      setUsername('');
      setDepartment('');
    } catch (error) {
      showMessage('error', error.message || 'Sign up failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setTestLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.requiresMfa) {
        setFactorId(result.factorId);
        showMessage('info', result.message);
      } else {
        showMessage('success', 'Signed in successfully!');
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      showMessage('error', error.message || 'Sign in failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handleSignOut = async () => {
    setTestLoading(true);
    try {
      await signOut();
      showMessage('success', 'Signed out successfully!');
    } catch (error) {
      showMessage('error', error.message || 'Sign out failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setTestLoading(true);
    try {
      const result = await sendPasswordResetEmail(email);
      showMessage('success', result.message);
      setEmail('');
    } catch (error) {
      showMessage('error', error.message || 'Password reset failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setTestLoading(true);
    try {
      await updatePassword(newPassword);
      showMessage('success', 'Password updated successfully!');
      setNewPassword('');
    } catch (error) {
      showMessage('error', error.message || 'Password update failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handleEnrollMFA = async () => {
    setTestLoading(true);
    try {
      const result = await enrollMFA();
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setFactorId(result.factorId);
      showMessage('success', 'Scan the QR code with your authenticator app');
    } catch (error) {
      showMessage('error', error.message || 'MFA enrollment failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handleVerifyMFA = async (e) => {
    e.preventDefault();
    setTestLoading(true);
    try {
      await verifyMFA(factorId, mfaCode);
      showMessage('success', '2FA verified successfully!');
      setMfaCode('');
      setQrCode('');
      setSecret('');
      setFactorId('');
    } catch (error) {
      showMessage('error', error.message || 'MFA verification failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handleListMFAFactors = async () => {
    setTestLoading(true);
    try {
      const result = await listMFAFactors();
      setMfaFactors(result.factors);
      showMessage('success', `Found ${result.factors.length} MFA factor(s)`);
    } catch (error) {
      showMessage('error', error.message || 'Failed to list MFA factors');
    } finally {
      setTestLoading(false);
    }
  };

  const handleUnenrollMFA = async (id) => {
    setTestLoading(true);
    try {
      await unenrollMFA(id);
      showMessage('success', '2FA disabled successfully!');
      await handleListMFAFactors();
    } catch (error) {
      showMessage('error', error.message || 'Failed to disable 2FA');
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-300 border-t-green-700 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supabase Test Page</h1>
          <p className="text-gray-600 mb-6">Test all Supabase authentication features</p>

          {/* Message Display */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Session Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Current Session:</h3>
            {session ? (
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Email:</span> {session.user.email}</p>
                <p><span className="font-medium">User ID:</span> {session.user.id}</p>
                <p><span className="font-medium">Verified:</span> {session.user.email_confirmed_at ? 'Yes' : 'No'}</p>
                {user && (
                  <>
                    <p><span className="font-medium">Username:</span> {user.username}</p>
                    <p><span className="font-medium">Department:</span> {user.department || 'Not set'}</p>
                  </>
                )}
              </div>
            ) : (
              <p className="text-gray-600">Not signed in</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sign Up */}
          {!session && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">1. Sign Up</h2>
              <form onSubmit={handleSignUp} className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                  minLength={6}
                />
                <input
                  type="text"
                  placeholder="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="submit"
                  disabled={testLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {testLoading ? 'Signing up...' : 'Sign Up'}
                </button>
              </form>
            </div>
          )}

          {/* Sign In */}
          {!session && !mfaRequired && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">2. Sign In</h2>
              <form onSubmit={handleSignIn} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
                <button
                  type="submit"
                  disabled={testLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {testLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>
          )}

          {/* MFA Verification */}
          {mfaRequired && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Enter 2FA Code</h2>
              <form onSubmit={handleVerifyMFA} className="space-y-4">
                <input
                  type="text"
                  placeholder="6-digit code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-center text-2xl tracking-widest"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                />
                <button
                  type="submit"
                  disabled={testLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {testLoading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
            </div>
          )}

          {/* Password Reset */}
          {!session && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">3. Password Reset</h2>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
                <button
                  type="submit"
                  disabled={testLoading}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {testLoading ? 'Sending...' : 'Send Reset Email'}
                </button>
              </form>
            </div>
          )}

          {/* Update Password */}
          {session && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">4. Update Password</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                  minLength={6}
                />
                <button
                  type="submit"
                  disabled={testLoading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {testLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {/* Enroll MFA */}
          {session && !qrCode && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">5. Enable 2FA</h2>
              <button
                onClick={handleEnrollMFA}
                disabled={testLoading}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {testLoading ? 'Setting up...' : 'Setup 2FA'}
              </button>
              <button
                onClick={handleListMFAFactors}
                disabled={testLoading}
                className="w-full mt-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                List MFA Factors
              </button>
            </div>
          )}

          {/* QR Code Display */}
          {qrCode && (
            <div className="bg-white rounded-xl shadow-lg p-6 md:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Scan QR Code</h2>
              <div className="flex flex-col items-center space-y-4">
                <QRCodeSVG value={qrCode} size={200} />
                <p className="text-sm text-gray-600">Or enter this code manually:</p>
                <code className="px-4 py-2 bg-gray-100 rounded text-sm">{secret}</code>
                <form onSubmit={handleVerifyMFA} className="w-full max-w-md space-y-4">
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-center text-2xl tracking-widest"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                  />
                  <button
                    type="submit"
                    disabled={testLoading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {testLoading ? 'Verifying...' : 'Verify & Enable 2FA'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* MFA Factors List */}
          {mfaFactors.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 md:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Active 2FA Methods</h2>
              <div className="space-y-2">
                {mfaFactors.map((factor) => (
                  <div key={factor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{factor.friendly_name}</p>
                      <p className="text-sm text-gray-600">Status: {factor.status}</p>
                    </div>
                    <button
                      onClick={() => handleUnenrollMFA(factor.id)}
                      disabled={testLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Disable
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sign Out */}
          {session && (
            <div className="bg-white rounded-xl shadow-lg p-6 md:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">6. Sign Out</h2>
              <button
                onClick={handleSignOut}
                disabled={testLoading}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {testLoading ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
