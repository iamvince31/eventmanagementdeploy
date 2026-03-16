import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Calendar from '../components/Calendar';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import logo from "../assets/CEIT-LOGO.png";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [defaultEvents, setDefaultEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [userSchedule, setUserSchedule] = useState({});
  const [highlightedDate, setHighlightedDate] = useState(null);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMembersDropdownOpen, setIsMembersDropdownOpen] = useState(false);
  const [isScheduleRequiredModalOpen, setIsScheduleRequiredModalOpen] = useState(false);
  const [hasSchedule, setHasSchedule] = useState(true);

  // Reschedule States
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleRequests, setRescheduleRequests] = useState([]);

  // Decline Reason State
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [decliningEventId, setDecliningEventId] = useState(null);

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
      // Clear the state to prevent re-fetching on every render
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

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

  const fetchData = async () => {
    try {
      // Use the new optimized dashboard endpoint
      const response = await api.get('/dashboard');
      const { events: fetchedEvents, defaultEvents: fetchedDefaultEvents, members: fetchedMembers } = response.data;
      
      // Filter out default events from the regular events list to avoid duplicates
      const regularEventsOnly = fetchedEvents.filter(event => !event.is_default_event);
      
      setEvents(regularEventsOnly);
      setMembers(fetchedMembers);
      setDefaultEvents(fetchedDefaultEvents);

      // Auto-select today's events (including default events)
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const todayRegularEvents = regularEventsOnly.filter(event => event.date === todayStr);
      
      // Get default events for today
      const todayDefaultEvents = fetchedDefaultEvents.filter(defEvent => {
        if (!defEvent.date) return false;
        
        const eventStartDate = new Date(defEvent.date);
        const checkDate = new Date(todayStr);
        
        if (!defEvent.end_date) {
          return eventStartDate.toDateString() === checkDate.toDateString();
        }
        
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
      
      setSelectedDateEvents([...todayRegularEvents, ...todayDefaultEvents]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event) => {
    if (event.is_personal) {
      navigate('/personal-event', { state: { event } });
    } else {
      navigate('/add-event', { state: { event } });
    }
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
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

  const handleViewEvent = async (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);

    await fetchUserSchedule();

    if (user && event.host.id === user.id) {
      fetchRescheduleRequests(event.id);
    } else {
      setRescheduleRequests([]);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setIsMembersDropdownOpen(false);
    setCurrentImageIndex(0);
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
    
    // Combine regular events with default events
    const allEvents = [...events, ...defaultEventsForDate];
    setSelectedDateEvents(allEvents);
  };

  const fetchRescheduleRequests = async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/reschedule-requests`);
      setRescheduleRequests(response.data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleRescheduleClick = () => {
    setRescheduleDate(selectedEvent.date);
    setRescheduleTime(selectedEvent.time);
    setRescheduleReason('');
    setIsRescheduleModalOpen(true);
  };

  const submitRescheduleRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/events/${selectedEvent.id}/reschedule`, {
        suggested_date: rescheduleDate,
        suggested_time: rescheduleTime,
        reason: rescheduleReason,
      });
      alert('Reschedule request sent!');
      setIsRescheduleModalOpen(false);
    } catch (error) {
      console.error('Error sending request:', error);
      alert('Failed to send request: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRespondToReschedule = async (requestId, status) => {
    try {
      await api.post(`/reschedule-requests/${requestId}/respond`, { status });
      await fetchRescheduleRequests(selectedEvent.id);
      await fetchData();

      if (status === 'accepted') {
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error responding:', error);
      alert('Failed to respond: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeclineWithReason = async () => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining');
      return;
    }

    try {
      // Decline the event
      await api.post(`/events/${decliningEventId}/respond`, { status: 'declined' });
      
      // Send decline reason message to host
      const event = events.find(e => e.id === decliningEventId);
      if (event && event.host) {
        await api.post('/messages', {
          recipient_id: event.host.id,
          event_id: decliningEventId,
          type: 'decline_reason',
          message: declineReason
        });
      }

      // Refresh data
      await fetchData();
      const updatedRes = await api.get('/events');
      const updatedEvent = updatedRes.data.events.find(e => e.id === decliningEventId);
      if (updatedEvent) setSelectedEvent(updatedEvent);

      // Close modals and reset state
      setIsDeclineModalOpen(false);
      setDeclineReason('');
      setDecliningEventId(null);
    } catch (error) {
      console.error('Error declining invitation:', error);
      alert('Failed to decline invitation: ' + (error.response?.data?.error || error.message));
    }
  };

  // Helper function to fetch user schedule
  const fetchUserSchedule = async () => {
    try {
      const response = await api.get('/schedule');
      setUserSchedule(response.data.schedule || {});
      setHasSchedule(true);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setHasSchedule(false);
    }
  };

  // Helper function to check schedule conflicts
  const checkScheduleConflict = (event) => {
    if (!event || !userSchedule) return null;
    
    const eventDate = new Date(event.date);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][eventDate.getDay()];
    const daySchedule = userSchedule[dayOfWeek];
    
    if (!daySchedule || daySchedule.length === 0) return null;
    
    const eventTime = event.time;
    const conflicts = daySchedule.filter(slot => {
      // Simple time overlap check
      return slot.startTime <= eventTime && slot.endTime >= eventTime;
    });
    
    return conflicts.length > 0 ? conflicts : null;
  };

  // Helper function to fix image URLs
  const getFixedImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${url.startsWith('/') ? url : '/' + url}`;
  };

  // Helper function for add event click
  const handleAddEventClick = () => {
    navigate('/add-event', { state: { selectedDate } });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50 flex flex-col overflow-hidden">
      <Navbar isLoading={loading} />

      {/* Main Content */}
      <main className="flex-1 w-full py-2 sm:py-4 px-2 sm:px-4 lg:px-8 overflow-hidden flex flex-col">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-4 flex-shrink-0">
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
            {user?.role === 'Faculty Member' || user?.role === 'Staff' ? (
              // Faculty Members and Staff can now use Add Event (with restrictions)
              <>
                <button
                  onClick={() => navigate('/event-requests')}
                  className="inline-flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg shadow hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 group bg-white text-green-700 border-2 border-green-700 hover:bg-green-50 focus:ring-green-600"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Event Requests</span>
                  <span className="sm:hidden">Requests</span>
                </button>
                <button
                  onClick={() => navigate('/personal-event', { state: { selectedDate } })}
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
                {(user?.role === 'Dean' || user?.role === 'Chairperson') && (
                  <button
                    onClick={() => navigate('/event-requests')}
                    className="inline-flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg shadow hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 group bg-white text-green-700 border-2 border-green-700 hover:bg-green-50 focus:ring-green-600"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Event Requests</span>
                    <span className="sm:hidden">Requests</span>
                  </button>
                )}
                <button
                  onClick={() => navigate('/personal-event', { state: { selectedDate } })}
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
                onDateSelect={handleDateSelect}
                highlightedDate={highlightedDate}
                currentUser={user}
                onEditEvent={handleEdit}
                onDeleteEvent={handleDelete}
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
          <div className="space-y-4 sm:space-y-6">
            {/* User's Own Schedule Conflict Warning */}
            {checkScheduleConflict(selectedEvent) && (
              <div className="bg-orange-50 border-l-4 border-orange-400 p-3 sm:p-4 rounded-xl">
                <div className="flex items-start">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-orange-800 mb-1">Your Schedule Conflict</h4>
                    <p className="text-sm text-orange-700 mb-2">
                      This event conflicts with your class schedule:
                    </p>
                    <ul className="space-y-1">
                      {checkScheduleConflict(selectedEvent).map((conflict, index) => (
                        <li key={index} className="text-sm text-orange-700 flex items-start">
                          <svg className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span className="break-words">{conflict.startTime} - {conflict.endTime}: {conflict.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

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

            {/* Images/Files Carousel */}
            {selectedEvent.images && selectedEvent.images.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Event Files ({selectedEvent.images.length})</h4>
                <div className="relative">
                  {/* Main File Display */}
                  <div className="relative w-full h-48 sm:h-64 bg-gray-100 rounded-xl overflow-hidden">
                    {(typeof selectedEvent.images[currentImageIndex] === 'string' 
                      ? getFixedImageUrl(selectedEvent.images[currentImageIndex]) 
                      : selectedEvent.images[currentImageIndex].url
                    ).toLowerCase().endsWith('.pdf') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 p-3 sm:p-4">
                        <svg className="w-16 h-16 sm:w-20 sm:h-20 text-red-600 mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-700 font-medium mb-1 text-sm sm:text-base">PDF Document</p>
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 text-center break-all px-2 sm:px-4">
                          {typeof selectedEvent.images[currentImageIndex] === 'object' && selectedEvent.images[currentImageIndex].original_filename
                            ? selectedEvent.images[currentImageIndex].original_filename
                            : decodeURIComponent((typeof selectedEvent.images[currentImageIndex] === 'string' 
                                ? getFixedImageUrl(selectedEvent.images[currentImageIndex]) 
                                : selectedEvent.images[currentImageIndex].url
                              ).split('/').pop())}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <a
                            href={typeof selectedEvent.images[currentImageIndex] === 'string' 
                              ? getFixedImageUrl(selectedEvent.images[currentImageIndex]) 
                              : selectedEvent.images[currentImageIndex].url}
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
                            href={typeof selectedEvent.images[currentImageIndex] === 'string' 
                              ? getFixedImageUrl(selectedEvent.images[currentImageIndex]) 
                              : selectedEvent.images[currentImageIndex].url}
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
                        src={typeof selectedEvent.images[currentImageIndex] === 'string' 
                          ? getFixedImageUrl(selectedEvent.images[currentImageIndex]) 
                          : selectedEvent.images[currentImageIndex].url}
                        alt={`${selectedEvent.title} ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Navigation Arrows */}
                    {selectedEvent.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(prev => 
                            prev === 0 ? selectedEvent.images.length - 1 : prev - 1
                          )}
                          className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 sm:p-2 transition-colors touch-manipulation"
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
                          className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 sm:p-2 transition-colors touch-manipulation"
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
                      <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {currentImageIndex + 1} / {selectedEvent.images.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Thumbnail Strip */}
                  {selectedEvent.images.length > 0 && (
                    <div className={`flex space-x-1.5 sm:space-x-2 lg:space-x-3 mt-2 sm:mt-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ${
                      selectedEvent.images.length === 1 ? 'hidden lg:flex' : 'flex'
                    }`}>
                      {selectedEvent.images.map((image, index) => {
                        const imageUrl = typeof image === 'string' ? getFixedImageUrl(image) : image.url;
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
                            className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors touch-manipulation ${
                              isPdf ? 'w-20 h-16 sm:w-24 sm:h-20 lg:w-28 lg:h-24' : 'w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20'
                            } ${
                              index === currentImageIndex 
                                ? 'border-green-500' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            title={isPdf ? filename : `Image ${index + 1}`}
                          >
                            {isPdf ? (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 p-1">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-red-600 mb-0.5 sm:mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs lg:text-sm text-red-700 font-medium truncate w-full text-center px-0.5 sm:px-1">
                                  <span className="lg:hidden">{filename.length > 12 ? filename.substring(0, 12) + '...' : filename}</span>
                                  <span className="hidden lg:inline">{filename.length > 16 ? filename.substring(0, 16) + '...' : filename}</span>
                                </span>
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

            {/* Members Dropdown */}
            {selectedEvent.members && selectedEvent.members.length > 0 && (
              <div>
                <button
                  onClick={() => setIsMembersDropdownOpen(!isMembersDropdownOpen)}
                  className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-xl p-3 sm:p-4 transition-colors touch-manipulation"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className="bg-green-100 rounded-lg p-1.5 sm:p-2 flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Invited Members</h4>
                      <p className="text-xs sm:text-sm text-gray-500">{selectedEvent.members.length} member{selectedEvent.members.length !== 1 ? 's' : ''} invited</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {/* Member avatars preview */}
                    <div className="flex -space-x-1 sm:-space-x-2">
                      {selectedEvent.members.slice(0, 3).map((member, index) => (
                        <div
                          key={member.id}
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-green-700 font-bold text-xs"
                          style={{ zIndex: 10 - index }}
                        >
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {selectedEvent.members.length > 3 && (
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-600 font-bold text-xs">
                          +{selectedEvent.members.length - 3}
                        </div>
                      )}
                    </div>
                    <svg 
                      className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 ${
                        isMembersDropdownOpen ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {/* Dropdown Content */}
                {isMembersDropdownOpen && (
                  <div className="mt-2 sm:mt-3 space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
                    {selectedEvent.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between bg-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs sm:text-sm flex-shrink-0">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">{member.username}</p>
                            <p className="text-xs text-gray-500 break-all">{member.email}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                          member.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : member.status === 'declined'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {member.status === 'accepted' ? '✓ Accepted' : member.status === 'declined' ? '✗ Declined' : '⏳ Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                        onClick={() => {
                          setDecliningEventId(selectedEvent.id);
                          setIsDeclineModalOpen(true);
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
        )}
      </Modal>

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

      {/* Decline Reason Modal */}
      <Modal
        isOpen={isDeclineModalOpen}
        onClose={() => {
          setIsDeclineModalOpen(false);
          setDeclineReason('');
          setDecliningEventId(null);
        }}
        title="Decline Event"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm sm:text-base">Please provide a reason for declining this event invitation:</p>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Enter your reason here..."
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm sm:text-base"
            rows="4"
            maxLength="1000"
          />
          <p className="text-xs text-gray-500 text-right">{declineReason.length}/1000</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-2 sm:pt-4">
            <button
              onClick={() => {
                setIsDeclineModalOpen(false);
                setDeclineReason('');
                setDecliningEventId(null);
              }}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors touch-manipulation"
            >
              Cancel
            </button>
            <button
              onClick={handleDeclineWithReason}
              disabled={!declineReason.trim()}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              Send & Decline
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
