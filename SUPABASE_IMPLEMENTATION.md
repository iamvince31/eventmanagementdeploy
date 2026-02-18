# Supabase Implementation - Part 2
## Frontend Components & Testing

---

## 4. Two-Factor Authentication (2FA) Implementation

### Step 4.1: Create MFA Setup Page
Create `frontend/src/pages/MFASetup.jsx`:
```jsx
import { useState } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

export default function MFASetup() {
  const { enrollMFA, verifyMFA } = useSupabaseAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await enrollMFA();
      setQrCode(result.totp.qr_code);
      setSecret(result.totp.secret);
      setFactorId(result.id);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await verifyMFA(factorId, verificationCode);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Two-Factor Authentication
        </h2>
        <p className="text-gray-600 mb-6">
          Add an extra layer of security to your account
        </p>

        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What you'll need:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• An authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>• Your smartphone</li>
              </ul>
            </div>

            <button
              