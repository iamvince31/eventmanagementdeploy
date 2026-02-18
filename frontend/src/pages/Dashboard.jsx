import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Calendar from '../components/Calendar';
import EventDetails from '../components/EventDetails';
import Modal from '../components/Modal';
import NotificationBell from '../components/NotificationBell';
import { getFixedImageUrl } from '../utils/image';
import logo from "../assets/CEIT-LOGO.png";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [userSchedule, setUserSchedule] = useState({});
  const [eventConflicts, setEventConflicts] = useState([]);
  const [highlightedDate, setHighlightedDate] = useState(null);
  const [hasSchedule, setHasSchedule] = useState(user?.schedule_initialized ?? false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedMemberForView, setSelectedMemberForView] = useState(null);
  const [isEventsListModalOpen, setIsEventsListModalOpen] = useState(false);
  const [isScheduleRequiredModalOpen, setIsScheduleRequiredModalOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  // Reschedule State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleRequests, setRescheduleRequests] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchData(), fetchUserSchedule()]);
    };
    loadData();

    // Auto-select today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setSelectedDate(todayStr);
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

  // Check if schedule is set and show modal on first load
  useEffect(() => {
    console.log('Schedule check:', { loading, scheduleLoading, hasSchedule, isScheduleRequiredModalOpen });
    if (!loading && !scheduleLoading && !hasSchedule) {
      // Show modal automatically if no schedule is set
      console.log('Opening schedule required modal');
      setIsScheduleRequiredModalOpen(true);
    }
  }, [loading, scheduleLoading, hasSchedule]);

  // Refetch schedule when window regains focus (user comes back from /accounts)
  useEffect(() => {
    const handleFocus = () => {
      fetchUserSchedule();
    };

    const handleScheduleUpdate = () => {
      fetchUserSchedule();
    };

    const handleScheduleChange = (event) => {
      // When schedule is saved, refetch and close modal
      fetchUserSchedule().then(() => {
        if (event.detail?.hasSchedule) {
          setIsScheduleRequiredModalOpen(false);
        }
      });
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('scheduleUpdated', handleScheduleUpdate);
    window.addEventListener('scheduleChanged', handleScheduleChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('scheduleUpdated', handleScheduleUpdate);
      window.removeEventListener('scheduleChanged', handleScheduleChange);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, membersRes] = await Promise.all([
        api.get('/events'),
        api.get('/users'),
      ]);
      const fetchedEvents = eventsRes.data.events;
      setEvents(fetchedEvents);
      setMembers(membersRes.data.members);

      // Auto-select today's events
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const todayEvents = fetchedEvents.filter(event => event.date === todayStr);
      setSelectedDateEvents(todayEvents);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSchedule = async () => {
    try {
      setScheduleLoading(true);
      const response = await api.get('/schedules');
      console.log('Schedule response:', response.data);
      if (response.data.schedule) {
        setUserSchedule(response.data.schedule);
      }
      // Check the initialized flag from backend
      const scheduleInitialized = response.data.initialized || false;
      console.log('Schedule initialized:', scheduleInitialized);
      setHasSchedule(scheduleInitialized);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setHasSchedule(false);
    } finally {
      setScheduleLoading(false);
    }
  };

  const checkScheduleConflict = (event) => {
    if (!event || !event.date || !event.time) return null;

    // Get day of week from event date
    const eventDate = new Date(event.date + 'T00:00:00');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[eventDate.getDay()];

    // Get user's schedule for that day
    const daySchedule = userSchedule[dayName] || [];

    if (daySchedule.length === 0) return null;

    // Parse event time (assuming format like "14:00" or "2:00 PM")
    const eventTime = event.time;
    let eventHour, eventMinute;

    if (eventTime.includes(':')) {
      const parts = eventTime.split(':');
      eventHour = parseInt(parts[0]);
      eventMinute = parseInt(parts[1]);

      // Handle PM times if format includes AM/PM
      if (eventTime.toLowerCase().includes('pm') && eventHour < 12) {
        eventHour += 12;
      } else if (eventTime.toLowerCase().includes('am') && eventHour === 12) {
        eventHour = 0;
      }
    }

    const eventTimeStr = `${String(eventHour).padStart(2, '0')}:${String(eventMinute).padStart(2, '0')}`;

    // Check for conflicts
    const conflicts = daySchedule.filter(classSlot => {
      if (!classSlot.startTime || !classSlot.endTime) return false;
      return eventTimeStr >= classSlot.startTime && eventTimeStr < classSlot.endTime;
    });

    return conflicts.length > 0 ? conflicts : null;
  };

  const handleEdit = (event) => {
    navigate('/add-event', { state: { event } });
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

    // Refresh user schedule to get latest data
    await fetchUserSchedule();

    // Check for schedule conflicts for all invited members
    if (event.members && event.members.length > 0) {
      await checkEventConflicts(event);
    } else {
      setEventConflicts([]);
    }

    if (user && event.host.id === user.id) {
      fetchRescheduleRequests(event.id);
    } else {
      setRescheduleRequests([]);
    }
  };

  const checkEventConflicts = async (event) => {
    try {
      const memberIds = event.members.map(m => m.id);
      const response = await api.post('/schedules/check-conflicts', {
        user_ids: memberIds,
        date: event.date,
        time: event.time
      });

      setEventConflicts(response.data.conflicts || []);
    } catch (error) {
      console.error('Error checking conflicts:', error);
      setEventConflicts([]);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setEventConflicts([]);
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleDateSelect = (date, events) => {
    setSelectedDate(date);
    setSelectedDateEvents(events);
  };

  const handleUpcomingClick = () => {
    if (upcomingEvents.length > 0) {
      // Get the first upcoming event
      const nextEvent = upcomingEvents[0];
      // Highlight the date on calendar
      setHighlightedDate(nextEvent.date);
      // Select the date to show events
      const eventsOnDate = events.filter(e => e.date === nextEvent.date);
      handleDateSelect(nextEvent.date, eventsOnDate);

      // Remove highlight after 2 seconds
      setTimeout(() => {
        setHighlightedDate(null);
      }, 2000);
    }
  };

  const handleMembersClick = () => {
    if (members.length > 0) {
      setSelectedMemberForView(members[0]);
    }
    setIsMembersModalOpen(true);
  };

  const handleYourEventsClick = () => {
    setIsEventsListModalOpen(true);
  };

  const groupMembersByDepartment = () => {
    const grouped = {};
    members.forEach(member => {
      const dept = member.department || 'No Department';
      if (!grouped[dept]) {
        grouped[dept] = [];
      }
      grouped[dept].push(member);
    });

    // Sort members alphabetically within each department
    Object.keys(grouped).forEach(dept => {
      grouped[dept].sort((a, b) => a.username.localeCompare(b.username));
    });

    return grouped;
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

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.date + 'T' + a.time);
    const dateB = new Date(b.date + 'T' + b.time);
    return dateA - dateB;
  });

  // Compute stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date + 'T00:00:00');
    return eventDate >= today;
  });

  // Get events hosted by current user
  const hostedEvents = events.filter(event => event.host.id === user?.id);

  const handleAddEventClick = () => {
    if (!hasSchedule) {
      // Show modal if schedule not initialized
      setIsScheduleRequiredModalOpen(true);
      return;
    }
    navigate('/add-event', { state: { selectedDate } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50 flex flex-col">
      {/* Overlay when schedule is required */}
      {!hasSchedule && isScheduleRequiredModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-30" />
      )}

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
                <p className="text-xs text-green-200 font-medium">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications Bell */}
              <NotificationBell
                events={events}
                user={user}
                onNotificationClick={handleViewEvent}
              />

              {/* Account Dropdown */}
              <div className="relative account-dropdown-container">
                <button
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="hidden sm:flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                  aria-label="Account menu"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-green-300 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white">{user?.username}</span>
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {loading ? (
            // Skeleton for stats cards
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-200 rounded-xl w-16 h-16"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Your Events (Hosted by User) */}
              <button
                onClick={handleYourEventsClick}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 group cursor-pointer text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-green-200 to-green-100 rounded-xl p-4 group-hover:from-green-300 group-hover:to-green-200 transition-colors duration-300">
                    <svg className="w-7 h-7 text-green-700 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Your Events</p>
                    <p className="text-3xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">{hostedEvents.length}</p>
                  </div>
                </div>
              </button>

              {/* Upcoming Events */}
              <button
                onClick={handleUpcomingClick}
                disabled={upcomingEvents.length === 0}
                className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all duration-300 group text-left ${upcomingEvents.length > 0
                  ? 'hover:shadow-2xl hover:scale-105 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
                  }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-4 group-hover:from-green-200 group-hover:to-green-100 transition-colors duration-300">
                    <svg className="w-7 h-7 text-green-600 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Upcoming</p>
                    <p className="text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">{upcomingEvents.length}</p>
                  </div>
                </div>
              </button>

              {/* Total Members */}
              <button
                onClick={handleMembersClick}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 group cursor-pointer text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-4 group-hover:from-green-200 group-hover:to-green-100 transition-colors duration-300">
                    <svg className="w-7 h-7 text-green-700 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Members</p>
                    <p className="text-3xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">{members.length}</p>
                  </div>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Calendar View</h2>
            <p className="text-sm text-gray-600 mt-1.5 font-medium">Click a date to view or manage your events</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleAddEventClick}
              disabled={!hasSchedule}
              className={`inline-flex items-center px-6 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 group ${hasSchedule
                  ? 'bg-gradient-to-r from-green-700 via-green-700 to-green-800 text-white hover:from-green-800 hover:via-green-800 hover:to-green-900 focus:ring-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Event
            </button>
            {!hasSchedule && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium">Set your class schedule first</span>
              </div>
            )}
          </div>
        </div>

        {/* Calendar + Event Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            {loading ? (
              // Skeleton for calendar
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(35)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <Calendar
                events={events}
                onDateSelect={handleDateSelect}
                highlightedDate={highlightedDate}
              />
            )}
          </div>
          <div>
            {loading ? (
              // Skeleton for event details
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <EventDetails
                date={selectedDate}
                events={selectedDateEvents}
                members={members}
                currentUser={user}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleViewEvent}
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
        maxWidth="max-w-5xl"
        noPadding={true}
      >
        {selectedEvent && (
          <div className="flex items-start">
            {/* Left Pane - Event Details */}
            <div className="w-7/12 flex flex-col bg-white sticky top-0 h-[calc(85vh-5rem)] overflow-y-auto scrollbar-hide">
              <div className="p-6 space-y-6 flex-1">

                {/* Warnings Section */}
                {/* Schedule Conflict Warning for Invited Members - Only visible to host */}
                {eventConflicts.length > 0 && selectedEvent && user?.id === selectedEvent.host.id && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-yellow-800 mb-2">⚠️ Schedule Conflicts Detected</h4>
                        <p className="text-sm text-yellow-700 mb-3">
                          The following invited members have class schedule conflicts:
                        </p>
                        <div className="space-y-3">
                          {eventConflicts.map((conflict, index) => (
                            <div key={index} className="bg-white/50 rounded-lg p-3 border border-yellow-200">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-sm flex-shrink-0">
                                    {conflict.username.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{conflict.username}</p>
                                    <p className="text-xs text-gray-600">{conflict.email}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 ml-10 flex items-center text-sm text-yellow-800">
                                <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">{conflict.class_time}</span>
                                {conflict.class_description && (
                                  <span className="ml-2 text-gray-700">- {conflict.class_description}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Schedule Conflict Warning */}
                {checkScheduleConflict(selectedEvent) && (
                  <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-orange-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-orange-800 mb-1">Your Schedule Conflict</h4>
                        <p className="text-sm text-orange-700">
                          This event conflicts with your class schedule:
                        </p>
                        <ul className="mt-2 space-y-1">
                          {checkScheduleConflict(selectedEvent).map((conflict, index) => (
                            <li key={index} className="text-sm text-orange-700 flex items-center">
                              <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              {conflict.startTime} - {conflict.endTime}: {conflict.description || 'Class'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image */}
                {selectedEvent.images && selectedEvent.images.length > 0 && (
                  <div className="mb-4">
                    {selectedEvent.images.length === 1 ? (
                      <img
                        src={getFixedImageUrl(selectedEvent.images[0])}
                        alt={selectedEvent.title}
                        className="w-full h-64 object-cover rounded-xl shadow-sm"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedEvent.images.map((image, index) => (
                          <img
                            key={index}
                            src={getFixedImageUrl(image)}
                            alt={`${selectedEvent.title} ${index + 1}`}
                            className="w-full h-32 object-cover rounded-xl shadow-sm"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Title & Time */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h3>
                  <p className="text-gray-500 flex items-center mt-1">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {selectedEvent.date} at {selectedEvent.time}
                  </p>
                </div>

                {/* Location */}
                {selectedEvent.location && (
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Location</p>
                      <p className="text-gray-600">{selectedEvent.location}</p>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedEvent.description && (
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Description</p>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {/* Host */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                        {selectedEvent.host.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">Hosted by {selectedEvent.host.username}</p>
                        <p className="text-gray-500">{selectedEvent.host.email}</p>
                      </div>
                    </div>
                    {/* Maybe render open event badge here */}
                    {selectedEvent.is_open && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Open Event
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reschedule Requests (Host Only) */}
              {user?.id === selectedEvent.host.id && rescheduleRequests.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-orange-50">
                  <h4 className="text-sm font-bold text-orange-800 mb-3">📅 Reschedule Requests</h4>
                  <div className="space-y-3">
                    {rescheduleRequests.map(request => (
                      <div key={request.id} className="bg-white rounded-lg p-3 border border-orange-200 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900 text-sm">{request.user.username}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                {request.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              Suggested: <span className="font-medium">{request.suggested_date} at {request.suggested_time}</span>
                            </p>
                            {request.reason && (
                              <p className="text-xs text-gray-500 mt-1 italic">"{request.reason}"</p>
                            )}
                          </div>
                          {request.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleRespondToReschedule(request.id, 'accepted')}
                                className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded hover:bg-green-200"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRespondToReschedule(request.id, 'declined')}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded hover:bg-gray-200"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Footer - Fixed at bottom of left pane */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex justify-between items-center">
                  {/* Left side - Accept/Decline buttons for invited members */}
                  {selectedEvent.members && selectedEvent.members.some(member => member.id === user?.id) && user?.id !== selectedEvent.host.id && (() => {
                    const myMembership = selectedEvent.members.find(m => m.id === user?.id);
                    const myStatus = myMembership?.status;

                    if (myStatus === 'pending') {
                      return (
                        <div className="flex space-x-2">
                          <button
                            onClick={async () => {
                              try {
                                await api.post(`/events/${selectedEvent.id}/respond`, { status: 'accepted' });
                                await fetchData();
                                // Update selected event with new data
                                const updatedRes = await api.get('/events');
                                const updatedEvent = updatedRes.data.events.find(e => e.id === selectedEvent.id);
                                if (updatedEvent) setSelectedEvent(updatedEvent);
                              } catch (error) {
                                console.error('Error accepting invitation:', error);
                                alert('Failed to accept invitation: ' + (error.response?.data?.error || error.message));
                              }
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
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
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            ✗ Decline
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${myStatus === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {myStatus === 'accepted' ? '✓ You accepted' : '✗ You declined'}
                        </span>
                      );
                    }
                  })()}

                  {/* Right side - Host actions and Reschedule */}
                  <div className="flex space-x-2 ml-auto">
                    {/* Reschedule button for invited members (not host) - Only show if pending */}
                    {user?.id !== selectedEvent.host.id && selectedEvent.members?.find(m => m.id === user?.id)?.status === 'pending' && (
                      <button
                        onClick={handleRescheduleClick}
                        className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        Reschedule
                      </button>
                    )}

                    {/* Edit/Delete buttons only for host */}
                    {(user?.id === selectedEvent.host.id) && (
                      <>
                        <button
                          onClick={() => {
                            handleCloseModal();
                            handleEdit(selectedEvent);
                          }}
                          className="px-4 py-2 text-sm font-medium text-green-800 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleCloseModal();
                            handleDelete(selectedEvent);
                          }}
                          className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Pane - Invited Members */}
            <div className="w-5/12 bg-gray-50 border-l border-gray-100 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Invited Members</h4>
              </div>
              <div className="p-4">
                {selectedEvent.members && selectedEvent.members.length > 0 ? (
                  <div className="space-y-2">
                    {selectedEvent.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-700 font-medium truncate">{member.username}</span>
                        </div>
                        <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${member.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : member.status === 'declined'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {member.status === 'accepted' ? 'Accepted' : member.status === 'declined' ? 'Declined' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                    <p className="text-sm">No members invited</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Members List Modal */}
      <Modal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        title="People"
        maxWidth="max-w-4xl"
        noPadding={true}
      >
        <div className="flex h-[500px] overflow-hidden">
          {/* Left Pane - Details */}
          <div className="w-7/12 p-8 flex flex-col items-center justify-center border-r border-gray-100 bg-white">
            {selectedMemberForView ? (
              <div className="flex flex-col items-center text-center animate-fade-in">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center text-4xl font-bold text-green-600 mb-6 shadow-sm border-4 border-white">
                  {selectedMemberForView.username.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {selectedMemberForView.username}
                </h2>
                <p className="text-gray-500 mb-4">{selectedMemberForView.email}</p>

                {selectedMemberForView.department && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {selectedMemberForView.department}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p>Select a person to view details</p>
              </div>
            )}
          </div>

          {/* Right Pane - List */}
          <div className="w-5/12 bg-gray-50 flex flex-col border-l border-gray-100 h-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                Select a person to view details
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {members.length === 0 ? (
                <p className="p-4 text-center text-gray-500 text-sm">No members found</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {members.sort((a, b) => a.username.localeCompare(b.username)).map((member) => (
                    <li
                      key={member.id}
                      onClick={() => setSelectedMemberForView(member)}
                      className={`p-4 flex items-center space-x-3 cursor-pointer transition-all duration-200 hover:bg-white ${selectedMemberForView?.id === member.id ? 'bg-white border-l-4 border-green-500 shadow-sm' : 'border-l-4 border-transparent'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${selectedMemberForView?.id === member.id
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-white border border-gray-200 text-gray-600'
                        }`}>
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${selectedMemberForView?.id === member.id ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                          {member.username}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Events List Modal - Shows only events hosted by current user */}
      <Modal
        isOpen={isEventsListModalOpen}
        onClose={() => setIsEventsListModalOpen(false)}
        title="Your Events"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {hostedEvents.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 font-medium">You haven't created any events yet</p>
              <button
                onClick={() => {
                  setIsEventsListModalOpen(false);
                  handleAddEventClick();
                }}
                className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Event
              </button>
            </div>
          ) : (
            hostedEvents
              .sort((a, b) => {
                const dateA = new Date(a.date + 'T' + a.time);
                const dateB = new Date(b.date + 'T' + b.time);
                return dateA - dateB;
              })
              .map(event => (
                <button
                  key={event.id}
                  onClick={() => {
                    setIsEventsListModalOpen(false);
                    handleViewEvent(event);
                  }}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${event.has_pending_reschedule_requests
                    ? 'bg-orange-50 border-orange-500 hover:bg-orange-100 ring-2 ring-orange-200'
                    : event.is_open
                      ? 'bg-blue-50 border-blue-500 hover:bg-blue-100'
                      : 'bg-gray-50 border-gray-200 hover:bg-green-100 hover:border-green-300'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Host
                        </span>
                        {event.is_open && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                            Open
                          </span>
                        )}
                        {event.has_pending_reschedule_requests && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 animate-pulse">
                            Reschedule Request
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 space-x-4">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {event.date}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {event.time}
                        </span>
                      </div>
                      {event.location && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {event.location}
                        </p>
                      )}
                      {event.members && event.members.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.members.length} invited member{event.members.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-2">
                      <svg className={`w-5 h-5 ${event.has_pending_reschedule_requests ? 'text-orange-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                      {new Date(event.date + 'T' + event.time) < new Date() && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          Ended
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
          )}
        </div>
      </Modal>

      {/* Schedule Required Modal */}
      <Modal
        isOpen={isScheduleRequiredModalOpen}
        onClose={() => {
          // Only allow closing if user has schedule
          if (hasSchedule) {
            setIsScheduleRequiredModalOpen(false);
          }
        }}
        title="Class Schedule Required"
        showCloseButton={false}
        closeOnBackdrop={false}
      >
        <div className="space-y-6">
          {/* Icon and Message */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Set Up Your Class Schedule First</h3>
            <p className="text-gray-600 leading-relaxed">
              Before {hasSchedule ? 'creating events' : 'using the dashboard'}, you need to set up your class schedule. This helps prevent scheduling conflicts and ensures better event planning.
            </p>
          </div>

          {/* Benefits List */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/account')}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Set Up Schedule Now
            </button>
            {hasSchedule && (
              <button
                onClick={() => setIsScheduleRequiredModalOpen(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200"
              >
                Maybe Later
              </button>
            )}
          </div>

          {/* Warning if no schedule */}
          {!hasSchedule && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
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
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Propose New Time"
        maxWidth="max-w-md"
      >
        <form onSubmit={submitRescheduleRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
            <input
              type="date"
              required
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
            <input
              type="time"
              required
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
            <textarea
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
              rows="3"
              placeholder="Why do you want to reschedule?"
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsRescheduleModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${selectedEvent?.auto_accept_reschedule
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-green-600 hover:bg-green-700'
                }`}
            >
              {selectedEvent?.auto_accept_reschedule ? 'Reschedule' : 'Send Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
