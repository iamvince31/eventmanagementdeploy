import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { invalidateCache } from '../services/cache';
import EventForm from '../components/EventForm';
import Navbar from '../components/Navbar';
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
    // Check if user is validated
    if (user && !user.is_validated) {
      navigate('/account');
      return;
    }
    
    // Faculty Members CAN access /add-event
    // They can create meetings or events directly
    
    // Redirect personal events to personal event page
    if (editingEvent && editingEvent.is_personal) {
      navigate('/personal-event', { state: { event: editingEvent } });
      return;
    }
    
    const loadData = async () => {
      await Promise.all([fetchMembers(), fetchUserSchedule()]);
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



  // Redirect to dashboard if schedule not initialized (unless editing)
  useEffect(() => {
    if (!loading && !hasSchedule && !editingEvent) {
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

  const handleEventCreated = () => {
    // Bust the dashboard cache so fresh data is fetched on return
    invalidateCache(`dashboard:${user?.id}`);
    navigate('/dashboard', { state: { refresh: Date.now() } });
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
      <Navbar isLoading={loading} />

      {/* Page Header */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {editingEvent ? 'Update the event details below' : 'Fill in the details to create a new event'}
          </p>
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
