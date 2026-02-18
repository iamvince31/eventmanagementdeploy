import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import EventForm from '../components/EventForm';
import NotificationBell from '../components/NotificationBell';
import logo from '../assets/CEIT-LOGO.png';

export default function AddEvent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSchedule, setUserSchedule] = useState({});
  const [hasSchedule, setHasSchedule] = useState(user?.schedule_initialized ?? false);
  const editingEvent = location.state?.event || null;
  const selectedDate = location.state?.selectedDate || null;

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchMembers(), fetchUserSchedule(), fetchEvents()]);
    };
    loadData();

    // Listen for schedule updates
    const handleScheduleUpdate = () => {
      fetchUserSchedule();
    };

    window.addEventListener('scheduleUpdated', handleScheduleUpdate);
    window.addEventListener('scheduleChanged', handleScheduleUpdate);

    return () => {
      window.removeEventListener('scheduleUpdated', handleScheduleUpdate);
      window.removeEventListener('scheduleChanged', handleScheduleUpdate);
    };
  }, []);

  // Redirect to dashboard if schedule not initialized
  useEffect(() => {
    if (!loading && !hasSchedule && !editingEvent) {
      // User hasn't initialized schedule, redirect to dashboard
      navigate('/dashboard');
    }
  }, [loading, hasSchedule, editingEvent, navigate]);

  const fetchUserSchedule = async () => {
    try {
      const response = await api.get('/schedules');
      if (response.data.schedule) {
        setUserSchedule(response.data.schedule);
      }
      // Check the initialized flag from backend
      const scheduleInitialized = response.data.initialized || false;
      setHasSchedule(scheduleInitialized);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setHasSchedule(false);
    }
  };

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

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleEventCreated = () => {
    navigate('/dashboard');
  };

  const handleCancelEdit = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50 flex flex-col">
        {/* Navbar */}
        <nav className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 shadow-lg sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 gap-4">
              <div className="flex items-center space-x-3 flex-1">
                <img src={logo} alt="CEIT Logo" className="h-10 w-auto" />
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Event Management</h1>
                  <p className="text-xs text-green-200 font-medium">{editingEvent ? 'Edit Event' : 'Add Event'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-300 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Header Skeleton */}
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <div className="flex justify-between items-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-64"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
          </div>
        </div>

        {/* Form Skeleton */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 animate-pulse">
              <div className="space-y-6">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-10 bg-gray-100 rounded"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-24 bg-gray-100 rounded"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-10 bg-gray-100 rounded"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-32 bg-gray-100 rounded"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
                  <div className="h-48 bg-gray-100 rounded"></div>
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <div className="h-10 bg-gray-200 rounded w-24"></div>
                  <div className="h-10 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 shadow-lg sticky top-0 z-20" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            <div className="flex items-center space-x-3 flex-1">
              {/* CEIT Logo */}
              <img 
                src={logo} 
                alt="CEIT Logo" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Event Management</h1>
                <p className="text-xs text-green-200 font-medium">{editingEvent ? 'Edit Event' : 'Add Event'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications Bell */}
              <NotificationBell 
                events={events} 
                user={user}
              />

              <button 
                onClick={() => navigate('/account')}
                className="hidden sm:flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-700" 
                aria-label={`Go to account page for ${user?.username}`}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-green-300 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm" aria-hidden="true">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white">{user?.username}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {editingEvent ? 'Update the event details below' : 'Fill in the details to create a new event'}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-700 hover:bg-green-800 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            aria-label="Go back to dashboard"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
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
            hasSchedule={hasSchedule}
            currentUser={user}
          />
        </div>
      </main>
    </div>
  );
}
