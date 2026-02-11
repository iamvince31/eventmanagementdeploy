import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import EventForm from '../components/EventForm';

export default function AddEvent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const editingEvent = location.state?.event || null;
  const selectedDate = location.state?.selectedDate || null;

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/users');
      setMembers(response.data.members);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventCreated = () => {
    navigate('/dashboard');
  };

  const handleCancelEdit = () => {
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar - matching Dashboard */}
      <nav className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-lg p-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">Event Management</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-white/15 border border-white/30 rounded-lg hover:bg-white/25 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Dashboard
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden sm:inline text-sm font-medium text-white">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm font-medium text-white bg-white/15 border border-white/30 rounded-lg hover:bg-white/25 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <h2 className="text-2xl font-bold text-gray-900">
          {editingEvent ? 'Edit Event' : 'Create New Event'}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {editingEvent ? 'Update the event details below' : 'Fill in the details to create a new event'}
        </p>
      </div>

      {/* Form */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <EventForm
            members={members}
            onEventCreated={handleEventCreated}
            editingEvent={editingEvent}
            onCancelEdit={handleCancelEdit}
            defaultDate={selectedDate}
          />
        </div>
      </main>
    </div>
  );
}
