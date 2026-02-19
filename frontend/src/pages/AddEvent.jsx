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
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
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

  // Close account dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAccountDropdownOpen && !event.target.closest('.account-dropdown-container')) {
        setIsAccountDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAccountDropdownOpen]);

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
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg transition-all hover:opacity-80"
                  aria-label="Go to dashboard"
                >
                  <img src={logo} alt="CEIT Logo" className="h-10 w-auto cursor-pointer" />
                </button>
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
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-6 pb-2">
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
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
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
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left corner - Logo and Title */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate('/dashboard')}
                className="focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg transition-all hover:opacity-80 flex-shrink-0"
                aria-label="Go to dashboard"
              >
                <img 
                  src={logo} 
                  alt="CEIT Logo" 
                  className="h-10 w-auto cursor-pointer"
                />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Event Management</h1>
                <p className="text-xs text-green-200 font-medium">{editingEvent ? 'Edit Event' : 'Add Event'}</p>
              </div>
            </div>

            {/* Right corner - Notifications and Account */}
            <div className="flex items-center space-x-4">
              {/* Notifications Bell */}
              <div className="relative">
                <NotificationBell 
                  events={events} 
                  user={user}
                />
              </div>

              {/* Account Dropdown */}
              <div className="relative account-dropdown-container">
                <button
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                  aria-label="Account menu"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-green-300 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white hidden sm:block">{user?.username}</span>
                  <svg 
                    className={`w-4 h-4 text-white transition-transform duration-200 ${isAccountDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isAccountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          navigate('/account');
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Settings</span>
                      </button>
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={async () => {
                          setIsAccountDropdownOpen(false);
                          await logout();
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6 pb-2">
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
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
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
