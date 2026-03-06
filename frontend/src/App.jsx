import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import EmailVerification from './pages/EmailVerification';
import Dashboard from './pages/Dashboard';
import AccountDashboard from './pages/AccountDashboard';
import AddEvent from './pages/AddEvent';
import PersonalEvent from './pages/PersonalEvent';
import RequestEvent from './pages/RequestEvent';
import EventRequests from './pages/EventRequests';
import Admin from './pages/Admin';
import DefaultEvents from './pages/DefaultEvents';
import History from './pages/History';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-pulse">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-green-200 rounded-full"></div>
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // If user hasn't initialized their schedule, redirect to account page
  if (!user.schedule_initialized) {
    return <Navigate to="/account" />;
  }
  
  return children;
};

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-pulse">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-green-200 rounded-full"></div>
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // If user hasn't initialized their schedule, redirect to account page
  if (!user.schedule_initialized) {
    return <Navigate to="/account" />;
  }
  
  // Check if user's role is allowed
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

const AccountRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-pulse">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-green-200 rounded-full"></div>
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-pulse">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-green-200 rounded-full"></div>
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // If user is logged in, check if they need to set up schedule
  if (user) {
    if (!user.schedule_initialized) {
      return <Navigate to="/account" />;
    }
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />
          <Route path="/verify-email" element={<EmailVerification />} />
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
            <AccountRoute>
              <AccountDashboard />
            </AccountRoute>
          } />
          <Route path="/add-event" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'Dean', 'Chairperson', 'Coordinator', 'CEIT Official']}>
              <AddEvent />
            </RoleProtectedRoute>
          } />
          <Route path="/personal-event" element={
            <ProtectedRoute>
              <PersonalEvent />
            </ProtectedRoute>
          } />
          <Route path="/request-event" element={
            <RoleProtectedRoute allowedRoles={['Faculty Member', 'Staff']}>
              <RequestEvent />
            </RoleProtectedRoute>
          } />
          <Route path="/event-requests" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'Dean', 'Chairperson']}>
              <EventRequests />
            </RoleProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } />
          <Route path="/default-events" element={
            <RoleProtectedRoute allowedRoles={['Admin']}>
              <DefaultEvents />
            </RoleProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/account" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;