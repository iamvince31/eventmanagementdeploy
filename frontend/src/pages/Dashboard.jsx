import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getCache, setCache, invalidateCache } from '../services/cache';
import Calendar from '../components/Calendar';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import PersonalEventModal from '../components/PersonalEventModal';
import EventDetailModal from '../components/EventDetailModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [defaultEvents, setDefaultEvents] = useState([]);
  const [userSchedules, setUserSchedules] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [highlightedDate, setHighlightedDate] = useState(null);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  // Modal States
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [navRefreshTrigger, setNavRefreshTrigger] = useState(0);

  const [isPersonalEventModalOpen, setIsPersonalEventModalOpen] = useState(false);
  const [editingPersonalEvent, setEditingPersonalEvent] = useState(null);
  const [personalEventSelectedDate, setPersonalEventSelectedDate] = useState('');
  const [isScheduleRequiredModalOpen, setIsScheduleRequiredModalOpen] = useState(false);
  const [hasSchedule, setHasSchedule] = useState(true);

  // Helper — works whether server returns 'role' or 'designation'
  const isAdmin = user?.role === 'Admin' || user?.designation === 'Admin';

  useEffect(() => {
    // Check if user is validated
    if (user && !user.is_validated) {
      navigate('/account');
      return;
    }

    fetchData();

    // Auto-select today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setSelectedDate(todayStr);
  }, []);

  // Listen for refresh from navigation state (e.g., after creating event)
  useEffect(() => {
    if (location.state?.refresh) {
      fetchData();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  // Listen for schedule changes from AccountDashboard
  useEffect(() => {
    const handleScheduleChanged = () => {
      invalidateCache(`dashboard:${user?.id}`);
      fetchData();
    };
    window.addEventListener('scheduleChanged', handleScheduleChanged);
    window.addEventListener('scheduleUpdated', handleScheduleChanged);
    return () => {
      window.removeEventListener('scheduleChanged', handleScheduleChanged);
      window.removeEventListener('scheduleUpdated', handleScheduleChanged);
    };
  }, [user?.id]);

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

  const applyDashboardData = (data, isBackground = false) => {
    const { events: fetchedEvents, defaultEvents: fetchedDefaultEvents, members: fetchedMembers, userSchedules: fetchedSchedules } = data;
    const regularEventsOnly = fetchedEvents.filter(event => !event.is_default_event);

    // Ensure all default events have is_default_event: true (guards against stale cache)
    const normalizedDefaultEvents = (fetchedDefaultEvents || []).map(e => ({
      ...e,
      is_default_event: true,
    }));

    setEvents(regularEventsOnly);
    setMembers(fetchedMembers);
    setDefaultEvents(normalizedDefaultEvents);
    if (fetchedSchedules) setUserSchedules(fetchedSchedules);

    // Only auto-select today on initial load (not background refresh)
    if (!isBackground) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRegularEvents = regularEventsOnly.filter(event => event.date === todayStr);
      const todayDefaultEvents = fetchedDefaultEvents.filter(defEvent => {
        if (!defEvent.date) return false;
        const eventStartDate = new Date(defEvent.date);
        const checkDate = new Date(todayStr);
        if (!defEvent.end_date) return eventStartDate.toDateString() === checkDate.toDateString();
        return checkDate >= new Date(defEvent.date) && checkDate <= new Date(defEvent.end_date);
      }).map(defEvent => ({
        ...defEvent, is_default_event: true, title: defEvent.name, time: 'All Day',
        host: { id: 0, username: 'Academic Calendar', email: '' }, members: [], images: []
      }));
      setSelectedDateEvents([...todayRegularEvents, ...todayDefaultEvents]);
    }
  };

  const fetchData = async () => {
    const cacheKey = `dashboard:${user?.id}`;
    const cached = getCache(cacheKey);

    if (cached) {
      applyDashboardData(cached, false);
      setLoading(false);
      try {
        const response = await api.get('/dashboard');
        setCache(cacheKey, response.data);
        applyDashboardData(response.data, true);
        setNavRefreshTrigger(t => t + 1);
        // Update selectedEvent if modal is open with fresh member statuses
        if (selectedEvent?.id) {
          const fresh = response.data.events?.find(e => e.id === selectedEvent.id);
          if (fresh) setSelectedEvent(fresh);
        }
      } catch { /* silently fail */ }
      return;
    }

    try {
      const response = await api.get('/dashboard');
      setCache(cacheKey, response.data);
      applyDashboardData(response.data, false);
      setNavRefreshTrigger(t => t + 1);
      if (selectedEvent?.id) {
        const fresh = response.data.events?.find(e => e.id === selectedEvent.id);
        if (fresh) setSelectedEvent(fresh);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event) => {
    if (!event) {
      console.error('No event provided to handleEdit');
      return;
    }
    if (event.is_personal) {
      setEditingPersonalEvent(event);
      setPersonalEventSelectedDate(event.date || '');
      setIsPersonalEventModalOpen(true);
    } else {
      navigate('/add-event', { state: { event } });
    }
  };

  const handleDelete = async (event) => {
    try {
      await api.delete(`/events/${event.id}`);
      await fetchData();
      if (selectedDate === event.date) {
        const updatedEvents = selectedDateEvents.filter(e => e.id !== event.id);
        setSelectedDateEvents(updatedEvents);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCloseModal = () => {
    setIsEventDetailOpen(false);
    setSelectedEvent(null);
  };

  const handleDateSelect = (date, events) => {
    setSelectedDate(date);

    // Get default events that fall within their date ranges for this date
    const defaultEventsForDate = defaultEvents.filter(defEvent => {
      if (!defEvent.date) return false;

      const eventStartDate = new Date(defEvent.date);
      const checkDate = new Date(date);

      // If no end_date, check if it's the same day
      if (!defEvent.end_date) {
        return eventStartDate.toDateString() === checkDate.toDateString();
      }

      // If end_date exists, check if date is within range
      const eventEndDate = new Date(defEvent.end_date);
      return checkDate >= eventStartDate && checkDate <= eventEndDate;
    }).map(defEvent => ({
      ...defEvent,
      is_default_event: true,
      title: defEvent.name,
      time: 'All Day',
      host: { id: 0, username: 'Academic Calendar', email: '' },
      members: [],
      images: []
    }));

    // Get schedule events for this date
    const checkDate = new Date(date);
    const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];

    // Get current semester (based on today's date)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    let currentSemester;

    if (currentMonth >= 9 || currentMonth <= 1) {
      currentSemester = 'first';
    } else if (currentMonth >= 2 && currentMonth <= 6) {
      currentSemester = 'second';
    } else if (currentMonth >= 7 && currentMonth <= 8) {
      currentSemester = 'midyear';
    }

    // Check if the specific date falls within the current semester
    const dateMonth = checkDate.getMonth() + 1;
    let dateInCurrentSemester = false;

    if (currentSemester === 'first' && (dateMonth >= 9 || dateMonth <= 1)) {
      dateInCurrentSemester = true;
    } else if (currentSemester === 'second' && (dateMonth >= 2 && dateMonth <= 6)) {
      dateInCurrentSemester = true;
    } else if (currentSemester === 'midyear' && (dateMonth >= 7 && dateMonth <= 8)) {
      dateInCurrentSemester = true;
    }

    const scheduleEventsForDate = userSchedules.filter(schedule => {
      if (schedule.day !== dayName) {
        return false;
      }

      // Only show schedules during the current semester period
      // This ensures Tuesday classes only show on Tuesdays within the current semester
      return dateInCurrentSemester;
    }).map(schedule => ({
      ...schedule,
      is_schedule: true,
      host: { id: user?.id || 0, username: user?.name || 'You', email: user?.email || '' },
      members: [],
      images: []
    }));

    // Combine regular events with default events and schedule events
    const allEvents = [...events, ...defaultEventsForDate, ...scheduleEventsForDate];
    setSelectedDateEvents(allEvents);
  };


  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50 flex flex-col overflow-hidden">
      <Navbar
        isLoading={loading}
        refreshTrigger={navRefreshTrigger}
        events={events}
        onNotificationClick={(event) => {
          setSelectedEvent(event);
          setIsEventDetailOpen(true);
        }}
      />

      {/* Main Content */}
      <main className="flex-1 w-full py-2 sm:py-4 px-2 sm:px-4 lg:px-8 overflow-hidden flex flex-col gap-4">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 flex-shrink-0">
          {loading ? (
            <>
              <div className="animate-pulse">
                <div className="h-7 bg-gray-200 rounded w-40 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-56"></div>
              </div>
              <div className="flex gap-1.5 sm:gap-2 animate-pulse">
                <div className="h-9 bg-gray-200 rounded w-24"></div>
                <div className="h-9 bg-gray-200 rounded w-24"></div>
                <div className="h-9 bg-gray-200 rounded w-28"></div>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Calendar View</h2>
                <p className="text-xs text-gray-600 mt-0.5 sm:mt-1 font-medium">Click a date to view or manage your events</p>
              </div>
              <div className="flex gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
                {/* Academic Calendar - Admin Only */}
                {isAdmin && (
                  <button
                    onClick={() => navigate('/default-events')}
                    className="inline-flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg shadow hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 group bg-white text-green-700 border-2 border-green-700 hover:bg-green-50 focus:ring-green-600"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Academic
                  </button>
                )}
                {/* Personal + Add Event — all users */}
                {user && (
                  <>
                    <button
                      onClick={() => {
                        setEditingPersonalEvent(null);
                        setPersonalEventSelectedDate(selectedDate);
                        setIsPersonalEventModalOpen(true);
                      }}
                      className="inline-flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg shadow hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 group bg-white text-green-700 border-2 border-green-700 hover:bg-green-50 focus:ring-green-600"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Personal
                    </button>
                    <button
                      onClick={() => navigate('/add-event', { state: { selectedDate } })}
                      className="inline-flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg shadow hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 group bg-gradient-to-r from-green-700 to-green-800 text-white hover:from-green-800 hover:to-green-900 focus:ring-green-600"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="hidden sm:inline">Add Event</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Calendar */}
        <div className="flex-1 min-h-0 flex-shrink-0">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-100 p-2 sm:p-3 lg:p-4 hover:shadow-xl transition-shadow duration-200 h-full flex flex-col">
            {loading ? (
              <div className="animate-pulse h-full flex flex-col">
                <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
                  <div className="h-6 sm:h-7 bg-gray-200 rounded w-32 sm:w-40"></div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2 sm:mb-3 flex-shrink-0">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div key={i} className="text-center">
                      <div className="h-4 sm:h-5 bg-gray-200 rounded mx-auto w-8 sm:w-10"></div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 flex-1">
                  {[...Array(42)].map((_, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded p-1 sm:p-2 flex flex-col">
                      <div className="h-4 sm:h-5 bg-gray-200 rounded w-6 sm:w-7 mb-1"></div>
                      {i % 3 === 0 && (
                        <div className="space-y-0.5">
                          <div className="h-1.5 bg-gray-100 rounded"></div>
                          {i % 6 === 0 && <div className="h-1.5 bg-gray-100 rounded"></div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 flex-shrink-0">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-16 sm:w-20"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Calendar
                events={events}
                defaultEvents={defaultEvents}
                userSchedules={userSchedules}
                onDateSelect={handleDateSelect}
                highlightedDate={highlightedDate}
                currentUser={user}
                onEditEvent={handleEdit}
                onDeleteEvent={handleDelete}
                onEventClick={(event) => {
                  setSelectedEvent(event);
                  setIsEventDetailOpen(true);
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Event Details Modal */}
      <EventDetailModal
        isOpen={isEventDetailOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
        currentUser={user}
        userSchedules={userSchedules}
        allEvents={events}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRespond={() => {
          invalidateCache(`dashboard:${user?.id}`);
          fetchData();
        }}
      />

      {/* Personal Event Modal */}
      <PersonalEventModal
        isOpen={isPersonalEventModalOpen}
        onClose={() => {
          setIsPersonalEventModalOpen(false);
          setEditingPersonalEvent(null);
        }}
        onSuccess={() => { fetchData(); }}
        editingEvent={editingPersonalEvent}
        selectedDate={personalEventSelectedDate}
        userSchedules={userSchedules}
        allEvents={events}
      />

      {/* Schedule Required Modal */}
      <Modal
        isOpen={isScheduleRequiredModalOpen}
        onClose={() => {
          if (hasSchedule) {
            setIsScheduleRequiredModalOpen(false);
          }
        }}
        title="Class Schedule Required"
        showCloseButton={false}
        closeOnBackdrop={false}
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Set Up Your Class Schedule First</h3>
            <p className="text-gray-600 leading-relaxed">
              Before using the dashboard, you need to set up your class schedule. This helps prevent scheduling conflicts and ensures better event planning.
            </p>
          </div>

          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <h4 className="text-sm font-semibold text-green-900 mb-3">Why set up your schedule?</h4>
            <ul className="space-y-2">
              <li className="flex items-start text-sm text-green-800">
                <svg className="w-5 h-5 mr-2 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Automatically detect scheduling conflicts</span>
              </li>
              <li className="flex items-start text-sm text-green-800">
                <svg className="w-5 h-5 mr-2 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Better event planning and coordination</span>
              </li>
              <li className="flex items-start text-sm text-green-800">
                <svg className="w-5 h-5 mr-2 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Avoid double-booking yourself</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/account')}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Set Up Schedule Now
            </button>
          </div>

          {!hasSchedule && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-800 text-center">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                You must set up your schedule to access the dashboard
              </p>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
}



