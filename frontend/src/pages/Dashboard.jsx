import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getCache, setCache } from '../services/cache';
import Calendar from '../components/Calendar';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import PersonalEventModal from '../components/PersonalEventModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [defaultEvents, setDefaultEvents] = useState([]);
  const [userSchedules, setUserSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Personal Event Modal States
  const [isPersonalEventModalOpen, setIsPersonalEventModalOpen] = useState(false);
  const [editingPersonalEvent, setEditingPersonalEvent] = useState(null);
  const [personalEventSelectedDate, setPersonalEventSelectedDate] = useState('');

  // Event to open directly in Calendar popup (from notification click)
  const [calendarEventToOpen, setCalendarEventToOpen] = useState(null);
  // Trigger Navbar to re-fetch events (e.g. after responding to invitation)
  const [navbarRefreshTrigger, setNavbarRefreshTrigger] = useState(0);


  useEffect(() => {
    // Check if user is validated - redirect if not
    if (user && !user.is_validated) {
      navigate('/account');
      return;
    }
    
    // Only fetch data if user is loaded and validated
    if (!user) return;
    
    // Reset loading state and fetch data
    setLoading(true);
    fetchData();
    
    // Auto-select today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setSelectedDate(todayStr);
  }, [user]);

  // Listen for refresh from navigation state (e.g., after creating event)
  useEffect(() => {
    if (location.state?.refresh) {
      setLoading(true);
      fetchData();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.refresh]);

  // Open event from notification click (viewEvent state)
  useEffect(() => {
    if (location.state?.viewEvent && events.length > 0) {
      const targetEvent = events.find(e => e.id === location.state.viewEvent.id) || location.state.viewEvent;
      setCalendarEventToOpen(targetEvent);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.viewEvent, events]);

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
    const { events: fetchedEvents, defaultEvents: fetchedDefaultEvents, userSchedules: fetchedSchedules } = data;
    const regularEventsOnly = fetchedEvents.filter(event => !event.is_default_event);

    setEvents(regularEventsOnly);
    setDefaultEvents(fetchedDefaultEvents);
    if (fetchedSchedules) setUserSchedules(fetchedSchedules);

    // Only auto-select today on initial load (not background refresh)
    if (!isBackground) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRegularEvents = regularEventsOnly.filter(event => event.date === todayStr);
        const todayDefaultEvents = fetchedDefaultEvents.filter(defEvent => {
          if (!defEvent.date) return false;
          try {
            const eventStartDate = new Date(defEvent.date);
            const checkDate = new Date(todayStr);
            if (isNaN(eventStartDate.getTime()) || isNaN(checkDate.getTime())) return false;
            if (!defEvent.end_date) return eventStartDate.toDateString() === checkDate.toDateString();
            const eventEndDate = new Date(defEvent.end_date);
            if (isNaN(eventEndDate.getTime())) return false;
            return checkDate >= eventStartDate && checkDate <= eventEndDate;
          } catch (error) {
            console.error('Error processing default event:', error);
            return false;
          }
        }).map(defEvent => ({
          ...defEvent, is_default_event: true, title: defEvent.name, time: 'All Day',
          host: { id: 0, username: 'Academic Calendar', email: '' }, members: [], images: []
        }));
        setSelectedDateEvents([...todayRegularEvents, ...todayDefaultEvents]);
      } catch (error) {
        console.error('Error auto-selecting today:', error);
        setSelectedDateEvents([]);
      }
    }
  };

  const fetchData = async () => {
    try {
      const cacheKey = `dashboard:${user?.id}`;
      const cached = getCache(cacheKey);

      if (cached) {
        applyDashboardData(cached, false);
        setLoading(false);

        // Silently refresh in background
        try {
          const response = await api.get('/dashboard');
          setCache(cacheKey, response.data);
          applyDashboardData(response.data, true);
        } catch (error) {
          console.error('Background refresh failed:', error);
        }
        return;
      }

      // No cache — fetch fresh data
      const response = await api.get('/dashboard');
      setCache(cacheKey, response.data);
      applyDashboardData(response.data, false);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);

      if (error.response?.status === 401) {
        navigate('/login');
      }
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
    if (!event || !event.id) {
      console.error('Invalid event provided to handleDelete');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) {
      return;
    }

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
    setIsModalOpen(false);
    setSelectedEvent(null);
    setCurrentImageIndex(0);
  };

  const handleDateSelect = (date, events) => {
    setSelectedDate(date);
    
    // Get default events that fall within their date ranges for this date
    const defaultEventsForDate = defaultEvents.filter(defEvent => {
      if (!defEvent.date) return false;
      
      try {
        const eventStartDate = new Date(defEvent.date);
        const checkDate = new Date(date);
        
        // Validate dates
        if (isNaN(eventStartDate.getTime()) || isNaN(checkDate.getTime())) {
          return false;
        }
        
        // If no end_date, check if it's the same day
        if (!defEvent.end_date) {
          return eventStartDate.toDateString() === checkDate.toDateString();
        }
        
        // If end_date exists, check if date is within range
        const eventEndDate = new Date(defEvent.end_date);
        if (isNaN(eventEndDate.getTime())) {
          return false;
        }
        return checkDate >= eventStartDate && checkDate <= eventEndDate;
      } catch (error) {
        console.error('Error processing default event date:', error);
        return false;
      }
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
    try {
      const checkDate = new Date(date);
      if (isNaN(checkDate.getTime())) {
        console.error('Invalid date provided to handleDateSelect:', date);
        setSelectedDateEvents([...events, ...defaultEventsForDate]);
        return;
      }

      const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[dayOfWeek];

      // Determine the semester for the SELECTED date (not today's date)
      const dateMonth = checkDate.getMonth() + 1;
      let selectedDateSemester;
      
      if (dateMonth >= 9 || dateMonth <= 1) {
        selectedDateSemester = 'first';
      } else if (dateMonth >= 2 && dateMonth <= 6) {
        selectedDateSemester = 'second';
      } else if (dateMonth >= 7 && dateMonth <= 8) {
        selectedDateSemester = 'midyear';
      }

      const scheduleEventsForDate = userSchedules.filter(schedule => {
        if (schedule.day !== dayName) {
          return false;
        }
        
        // Only show schedules that match the selected date's semester
        // This ensures Tuesday classes show on Tuesdays within their semester
        return schedule.semester === selectedDateSemester;
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
    } catch (error) {
      console.error('Error in handleDateSelect:', error);
      setSelectedDateEvents([...events, ...defaultEventsForDate]);
    }
  };

  const getFixedImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${url.startsWith('/') ? url : '/' + url}`;
  };
  const getImageUrl = (image) => getFixedImageUrl(typeof image === 'string' ? image : image?.url);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50 flex flex-col overflow-hidden">
      <Navbar
        isLoading={loading}
        refreshTrigger={navbarRefreshTrigger}
        onNotificationClick={(event) => {
          const fresh = events.find(e => e.id === event.id) || event;
          setCalendarEventToOpen(fresh);
        }}
      />

      {/* Main Content */}
      <main className="flex-1 w-full py-2 sm:py-4 px-2 sm:px-4 lg:px-8 overflow-hidden flex flex-col">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-4 flex-shrink-0">
          {loading ? (
            // Skeleton for header
            <>
              <div className="animate-pulse">
                <div className="h-7 sm:h-8 bg-gray-200 rounded w-32 sm:w-40 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-48 sm:w-64"></div>
              </div>
              <div className="flex gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto animate-pulse">
                <div className="h-8 sm:h-10 bg-gray-200 rounded-lg w-20 sm:w-24"></div>
                <div className="h-8 sm:h-10 bg-gray-200 rounded-lg w-20 sm:w-24"></div>
                <div className="h-8 sm:h-10 bg-gray-200 rounded-lg w-20 sm:w-24"></div>
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
                {user?.role === 'Admin' && (
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
            
            {/* Role-based Event Creation Buttons */}
            {user?.role === 'Faculty Member' ? (
              // Faculty Members can use Add Event
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
            ) : user?.role === 'Coordinator' || user?.role === 'Chairperson' || user?.role === 'Dean' || user?.role === 'Admin' || user?.role === 'CEIT Official' ? (
              // Coordinators, Chairpersons, Deans, CEIT Officials, and Admins can create events directly
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
            ) : null}
              </div>
            </>
          )}
        </div>

        {/* Calendar */}
        <div className="flex-1 overflow-hidden">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-100 p-2 sm:p-3 lg:p-4 hover:shadow-xl transition-shadow duration-200 h-full flex flex-col">
            {loading ? (
              // Skeleton for calendar
              <div className="animate-pulse h-full flex flex-col">
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-20 sm:w-24 mb-2 sm:mb-3 flex-shrink-0"></div>
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2 flex-shrink-0">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="h-5 sm:h-6 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <div className="grid grid-cols-7 grid-rows-6 gap-0.5 sm:gap-1 flex-1">
                  {[...Array(42)].map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <Calendar
                events={events}
                defaultEvents={defaultEvents}
                userSchedules={userSchedules}
                onDateSelect={handleDateSelect}
                currentUser={user}
                onEditEvent={handleEdit}
                onDeleteEvent={handleDelete}
                onRespondToEvent={async (eventId, status) => {
                  await api.post(`/events/${eventId}/respond`, { status });
                  // Refresh in background — UI already updates optimistically via Calendar local state
                  fetchData();
                  setNavbarRefreshTrigger(t => t + 1);
                }}
                externalEventToOpen={calendarEventToOpen}
                onExternalEventOpened={() => setCalendarEventToOpen(null)}
              />
            )}
          </div>
        </div>
      </main>

      {/* Event Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Event Details"
        maxWidth="max-w-2xl"
      >
        {selectedEvent && (
          <div className="flex flex-col lg:grid lg:grid-cols-[1.05fr,1fr] lg:gap-6 space-y-4 sm:space-y-6 lg:space-y-0">
            {/* Left Column: details, participants, actions */}
            <div className="space-y-4 sm:space-y-6">
            {/* Event Details */}
            <div className="text-center">
              <div className="flex items-start justify-center gap-2 mb-2 flex-wrap">
                {/* Color Bullet Point */}
                <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 sm:mt-1 ${
                  selectedEvent.is_default_event || !selectedEvent.time 
                    ? 'bg-blue-500' 
                    : selectedEvent.is_personal
                      ? 'bg-purple-500'
                      : selectedEvent.event_type === 'meeting'
                        ? (user && selectedEvent.host && selectedEvent.host.id === user.id ? 'bg-amber-800' : 'bg-yellow-500')
                        : (user && selectedEvent.host && selectedEvent.host.id === user.id ? 'bg-red-500' : 'bg-green-500')
                }`}></div>
                
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words flex-1 min-w-0">{selectedEvent.title}</h3>
                
                {/* Inline Edit/Delete Buttons for Dashboard Modal */}
                {(user?.id === selectedEvent.host.id) && !selectedEvent.is_default_event && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        handleCloseModal();
                        handleEdit(selectedEvent);
                      }}
                      className="p-1.5 sm:p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Edit Event"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        handleCloseModal();
                        handleDelete(selectedEvent);
                      }}
                      className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Event"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <p className="text-gray-500 flex items-center justify-center text-sm sm:text-base break-words">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="break-words">
                  {selectedEvent.end_date ? (
                    // Multi-day event: show date range without time
                    <>
                      {new Date(selectedEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' - '}
                      {new Date(selectedEvent.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </>
                  ) : (
                    // Single-day event: show date and time
                    `${selectedEvent.date} at ${selectedEvent.time}`
                  )}
                </span>
              </p>
            </div>

            {selectedEvent.location && (
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <div className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Location</p>
                    <p className="text-gray-600 text-sm sm:text-base break-words">{selectedEvent.location}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedEvent.description && (
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <p className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Description</p>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base break-words">
                  {selectedEvent.description}
                </p>
              </div>
            )}

            <div className="bg-green-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm sm:text-lg flex-shrink-0">
                    {selectedEvent.host.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">Hosted by {selectedEvent.host.username}</p>
                    <p className="text-gray-500 text-xs sm:text-sm break-all">{selectedEvent.host.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-4 sm:pt-6 border-t border-gray-200 gap-3 sm:gap-0">
              {/* Accept/Decline for invited members */}
              {selectedEvent.members && selectedEvent.members.some(member => member.id === user?.id) && user?.id !== selectedEvent.host.id && (() => {
                const myMembership = selectedEvent.members.find(m => m.id === user?.id);
                const myStatus = myMembership?.status;

                if (myStatus === 'pending') {
                  return (
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                      <button
                        onClick={async () => {
                          try {
                            await api.post(`/events/${selectedEvent.id}/respond`, { status: 'accepted' });
                            await fetchData();
                            const updatedRes = await api.get('/events');
                            const updatedEvent = updatedRes.data.events.find(e => e.id === selectedEvent.id);
                            if (updatedEvent) setSelectedEvent(updatedEvent);
                          } catch (error) {
                            console.error('Error accepting invitation:', error);
                            alert('Failed to accept invitation: ' + (error.response?.data?.error || error.message));
                          }
                        }}
                        className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors touch-manipulation"
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await api.post(`/events/${selectedEvent.id}/respond`, { status: 'declined' });
                            await fetchData();
                            const updatedRes = await api.get('/events');
                            const updatedEvent = updatedRes.data.events.find(e => e.id === selectedEvent.id);
                            if (updatedEvent) setSelectedEvent(updatedEvent);
                          } catch (error) {
                            console.error('Error declining invitation:', error);
                            alert('Failed to decline invitation: ' + (error.response?.data?.error || error.message));
                          }
                        }}
                        className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors touch-manipulation"
                      >
                        ✗ Decline
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <span className={`inline-flex items-center justify-center px-3 py-2 sm:py-1.5 rounded-xl text-sm font-semibold w-full sm:w-auto ${myStatus === 'accepted'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {myStatus === 'accepted' ? '✓ You accepted' : '✗ You declined'}
                    </span>
                  );
                }
              })()}
            </div>
          </div>

          {/* Right Column: Event files */}
          <div className="space-y-3 sm:space-y-4">
            {selectedEvent.images && selectedEvent.images.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Event Files ({selectedEvent.images.length})</h4>
                <div className="relative flex flex-row rounded-2xl bg-gray-50 shadow-sm border border-gray-100 p-2 sm:p-3 laptop:min-h-[32rem] gap-2 sm:gap-3">
                  {/* Main File Display */}
                  <div className="relative flex-1 h-64 sm:h-72 lg:h-[26rem] xl:h-[30rem] laptop:h-[34rem] bg-white rounded-xl overflow-hidden">
                    {getImageUrl(selectedEvent.images[currentImageIndex]).toLowerCase().endsWith('.pdf') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 p-3 sm:p-4">
                        <svg className="w-16 h-16 sm:w-20 sm:h-20 text-red-600 mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-700 font-medium mb-1 text-sm sm:text-base">PDF Document</p>
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 text-center break-all px-2 sm:px-4">
                          {typeof selectedEvent.images[currentImageIndex] === 'object' && selectedEvent.images[currentImageIndex].original_filename
                            ? selectedEvent.images[currentImageIndex].original_filename
                            : decodeURIComponent(getImageUrl(selectedEvent.images[currentImageIndex]).split('/').pop())}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <a
                            href={getImageUrl(selectedEvent.images[currentImageIndex])}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open PDF
                          </a>
                          <a
                            href={getImageUrl(selectedEvent.images[currentImageIndex])}
                            download={typeof selectedEvent.images[currentImageIndex] === 'object' && selectedEvent.images[currentImageIndex].original_filename
                              ? selectedEvent.images[currentImageIndex].original_filename
                              : undefined}
                            className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </a>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={getImageUrl(selectedEvent.images[currentImageIndex])}
                        alt={`${selectedEvent.title} ${currentImageIndex + 1}`}
                        className="w-full h-full object-contain bg-white"
                      />
                    )}
                    
                    {/* Navigation Arrows */}
                    {selectedEvent.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(prev => 
                            prev === 0 ? selectedEvent.images.length - 1 : prev - 1
                          )}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 sm:p-2.5 transition-colors touch-manipulation"
                          aria-label="Previous file"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(prev => 
                            prev === selectedEvent.images.length - 1 ? 0 : prev + 1
                          )}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 sm:p-2.5 transition-colors touch-manipulation"
                          aria-label="Next file"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                    
                    {/* File Counter */}
                    {selectedEvent.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {currentImageIndex + 1} / {selectedEvent.images.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Right Thumbnail Strip */}
                  {selectedEvent.images.length > 1 && (
                    <div className="flex flex-col gap-2 overflow-y-auto w-16 sm:w-20 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {selectedEvent.images.map((image, index) => {
                        const imageUrl = getImageUrl(image);
                        const isPdf = imageUrl.toLowerCase().endsWith('.pdf');
                        const filename = isPdf 
                          ? (typeof image === 'object' && image.original_filename 
                              ? image.original_filename 
                              : decodeURIComponent(imageUrl.split('/').pop()))
                          : '';
                        
                        return (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`flex-shrink-0 w-full aspect-square rounded-lg overflow-hidden border-2 transition-colors touch-manipulation ${
                              index === currentImageIndex 
                                ? 'border-green-500' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            title={isPdf ? filename : `Image ${index + 1}`}
                          >
                            {isPdf ? (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 p-1">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                            ) : (
                              <img
                                src={imageUrl}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </Modal>

      {/* Personal Event Modal */}
      <PersonalEventModal
        isOpen={isPersonalEventModalOpen}
        onClose={() => {
          setIsPersonalEventModalOpen(false);
          setEditingPersonalEvent(null);
          setPersonalEventSelectedDate('');
        }}
        onSuccess={() => {
          fetchData();
        }}
        editingEvent={editingPersonalEvent}
        selectedDate={personalEventSelectedDate}
      />

    </div>
  );
}
