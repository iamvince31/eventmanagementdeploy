import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import api from '../services/api';

const SupabaseAuthContext = createContext();

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [pendingFactorId, setPendingFactorId] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      setSession(session);
      if (session) {
        syncWithBackend(session.access_token);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      setSession(session);
      
      if (session) {
        await syncWithBackend(session.access_token);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncWithBackend = async (token) => {
    try {
      const response = await api.post('/auth/supabase/verify-token', { token });
      console.log('Backend sync response:', response.data);
      setUser(response.data.user);
      localStorage.setItem('token', token);
      localStorage.setItem('supabase_user', JSON.stringify(response.data.user));
    } catch (error) {
      console.error('Failed to sync with backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, username, department) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            department: department,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      
      return { 
        success: true, 
        data,
        message: 'Registration successful! You can now sign in.' 
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if MFA is required
      if (data.user?.factors && data.user.factors.length > 0) {
        const enabledFactor = data.user.factors.find(f => f.status === 'verified');
        if (enabledFactor) {
          setMfaRequired(true);
          setPendingFactorId(enabledFactor.id);
          return { 
            success: false,
            requiresMfa: true, 
            factorId: enabledFactor.id,
            message: 'Please enter your 2FA code'
          };
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setMfaRequired(false);
      setPendingFactorId(null);
      localStorage.removeItem('token');
      localStorage.removeItem('supabase_user');
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const sendPasswordResetEmail = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      return { 
        success: true, 
        message: 'Password reset email sent! Check your inbox.' 
      };
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  };

  const enrollMFA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;
      
      return { 
        success: true, 
        data,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        factorId: data.id
      };
    } catch (error) {
      console.error('MFA enrollment error:', error);
      throw error;
    }
  };

  const verifyMFA = async (factorId, code) => {
    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      // Verify the code
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (error) throw error;

      setMfaRequired(false);
      setPendingFactorId(null);
      
      return { success: true, data };
    } catch (error) {
      console.error('MFA verification error:', error);
      throw error;
    }
  };

  const unenrollMFA = async (factorId) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      
      if (error) throw error;
      
      return { success: true, message: '2FA disabled successfully' };
    } catch (error) {
      console.error('MFA unenroll error:', error);
      throw error;
    }
  };

  const listMFAFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) throw error;
      
      return { success: true, factors: data.totp || [] };
    } catch (error) {
      console.error('List MFA factors error:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    mfaRequired,
    pendingFactorId,
    signUp,
    signIn,
    signOut,
    sendPasswordResetEmail,
    updatePassword,
    enrollMFA,
    verifyMFA,
    unenrollMFA,
    listMFAFactors,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};
