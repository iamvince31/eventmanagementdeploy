import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';
import LoginUnified from './pages/LoginUnified';
import RegisterUnified from './pages/RegisterUnified';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';
import ResetPasswordOtp from './pages/ResetPasswordOtp';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import AccountDashboard from './pages/AccountDashboard';
import AddEvent from './pages/AddEvent';
import SupabaseTest from './pages/SupabaseTest';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  
  return user ? <Navigate to="/dashboard" /> : children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SupabaseAuthProvider>
          <Routes>
            {/* Supabase Test Route - Public for testing */}
            <Route path="/supabase-test" element={<SupabaseTest />} />
            
            <Route path="/login" element={
              <PublicRoute>
                <LoginUnified />
              </PublicRoute>
            } />
          <Route path="/register" element={
            <PublicRoute>
              <RegisterUnified />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />
          <Route path="/verify-otp" element={
            <PublicRoute>
              <VerifyOtp />
            </PublicRoute>
          } />
          <Route path="/reset-password-otp" element={
            <PublicRoute>
              <ResetPasswordOtp />
            </PublicRoute>
          } />
          <Route path="/reset-password" element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/account" element={
            <ProtectedRoute>
              <AccountDashboard />
            </ProtectedRoute>
          } />
          <Route path="/add-event" element={
            <ProtectedRoute>
              <AddEvent />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </SupabaseAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
