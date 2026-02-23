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
  
  // Event Details Modal State
  const [isMembersDropdownOpen, setIsMembersDropdownOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
    if (!loading && !scheduleLoading && !hasSchedule) {
      setIsScheduleRequiredModalOpen(true);
    }
  }, [loading, scheduleLoading, hasSchedule]);

  // Refetch schedule when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchUserSchedule();
    };

    const handleScheduleUpdate = () => {
      fetchUserSchedule();
    };

    const handleScheduleChange = (event) => {
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
      if (response.data.schedule) {
        setUserSchedule(response.data.schedule);
      }
      const scheduleInitialized = response.data.initialized || false;
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

    const eventDate = new Date(event.date + 'T00:00:00');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[eventDate.getDay()];
    const daySchedule = userSchedule[dayName] || [];

    if (daySchedule.length === 0) return null;

    const eventTime = event.time;
    let eventHour, eventMinute;

    if (eventTime.includes(':')) {
      const parts = eventTime.split(':');
      eventHour = parseInt(parts[0]);
      eventMinute = parseInt(parts[1]);

      if (eventTime.toLowerCase().includes('pm') && eventHour < 12) {
        eventHour += 12;
      } else if (eventTime.toLowerCase().includes('am') && eventHour === 12) {
        eventHour = 0;
      }
    }

    const eventTimeStr = `${String(eventHour).padStart(2, '0')}:${String(eventMinute).padStart(2, '0')}`;

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

    await fetchUserSchedule();

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
    setIsMembersDropdownOpen(false);
    setCurrentImageIndex(0);
  };

  const handleDateSelect = (date, events) => {
    setSelectedDate(date);
    setSelectedDateEvents(events);
  };

  const handleUpcomingClick = () => {
    if (upcomingEvents.length > 0) {
      const nextEvent = upcomingEvents[0];
      setHighlightedDate(nextEvent.date);
      const eventsOnDate = events.filter(e => e.date === nextEvent.date);
      handleDateSelect(nextEvent.date, eventsOnDate);

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

  // Compute stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date + 'T00:00:00');
    return eventDate >= today;
  });

  const hostedEvents = events.filter(event => event.host.id === user?.id);

  const handleAddEventClick = () => {
    if (!hasSchedule) {
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
                <p className="text-xs text-green-200 font-medium">Dashboard</p>
              </div>
            </div>

            {/* Right corner - Home Icon, Notifications and Account */}
            <div className="flex items-center space-x-4">
              {/* Home Icon */}
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                aria-label="Go to dashboard"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>

              {/* Notifications Bell */}
              <div className="relative">
                <NotificationBell
                  events={events}
                  user={user}
                  onNotificationClick={handleViewEvent}
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
                      
                      {/* Admin Panel Link - Only for admin users */}
                      {user?.role === 'admin' && (
                        <>
                          <div className="border-t border-gray-100"></div>
                          <button
                            onClick={() => {
                              setIsAccountDropdownOpen(false);
                              navigate('/admin');
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center space-x-3"
                          >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="font-medium">Admin Panel</span>
                          </button>
                        </>
                      )}
                      
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
      <main className="flex-1 w-full py-8 px-4 sm:px-6 lg:px-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300 h-full">
            {loading ? (
              // Skeleton for calendar
              <div className="animate-pulse h-full flex flex-col">
                <div className="h-8 bg-gray-200 rounded w-32 mb-4 flex-shrink-0"></div>
                <div className="grid grid-cols-7 gap-2 mb-2 flex-shrink-0">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <div className="grid grid-cols-7 grid-rows-6 gap-2 flex-1">
                  {[...Array(42)].map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <Calendar
                events={events}
                onDateSelect={handleDateSelect}
                highlightedDate={highlightedDate}
                currentUser={user}
              />
            )}
          </div>
          <div className="h-full">
            {loading ? (
              // Skeleton for event details
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse h-full flex flex-col">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="flex-1 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
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
        maxWidth="max-w-2xl"
      >
        {selectedEvent && (
          <div className="space-y-6">
            {/* Schedule Conflict Warnings */}
            {eventConflicts.length > 0 && selectedEvent && user?.id === selectedEvent.host.id && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-yellow-800 mb-2">⚠️ Schedule Conflicts Detected</h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      The following invited members have class schedule conflicts:
                    </p>
                    <div className="space-y-2">
                      {eventConflicts.map((conflict, index) => (
                        <div key={index} className="bg-white/50 rounded-xl p-3 border border-yellow-200">
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
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {checkScheduleConflict(selectedEvent) && (
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-xl">
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
                          {conflict.startTime} - {conflict.endTime}: {conflict.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Event Details */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedEvent.title}</h3>
              <p className="text-gray-500 flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {selectedEvent.date} at {selectedEvent.time}
              </p>
            </div>

            {selectedEvent.location && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Location</p>
                    <p className="text-gray-600">{selectedEvent.location}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedEvent.description && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900 mb-2">Description</p>
                <p className="text-gray-600 leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>
            )}

            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">
                    {selectedEvent.host.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Hosted by {selectedEvent.host.username}</p>
                    <p className="text-gray-500 text-sm">{selectedEvent.host.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Images Carousel */}
            {selectedEvent.images && selectedEvent.images.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Event Images ({selectedEvent.images.length})</h4>
                <div className="relative">
                  {/* Main Image Display */}
                  <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={getFixedImageUrl(selectedEvent.images[currentImageIndex])}
                      alt={`${selectedEvent.title} ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Navigation Arrows */}
                    {selectedEvent.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(prev => 
                            prev === 0 ? selectedEvent.images.length - 1 : prev - 1
                          )}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                          aria-label="Previous image"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(prev => 
                            prev === selectedEvent.images.length - 1 ? 0 : prev + 1
                          )}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                          aria-label="Next image"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                    
                    {/* Image Counter */}
                    {selectedEvent.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {currentImageIndex + 1} / {selectedEvent.images.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Thumbnail Strip */}
                  {selectedEvent.images.length > 1 && (
                    <div className="flex space-x-2 mt-3 overflow-x-auto pb-2">
                      {selectedEvent.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                            index === currentImageIndex 
                              ? 'border-green-500' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={getFixedImageUrl(image)}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
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
                  className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 rounded-lg p-2">
                      <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900">Invited Members</h4>
                      <p className="text-sm text-gray-500">{selectedEvent.members.length} member{selectedEvent.members.length !== 1 ? 's' : ''} invited</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Member avatars preview */}
                    <div className="flex -space-x-2">
                      {selectedEvent.members.slice(0, 3).map((member, index) => (
                        <div
                          key={member.id}
                          className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-green-700 font-bold text-xs"
                          style={{ zIndex: 10 - index }}
                        >
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {selectedEvent.members.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-600 font-bold text-xs">
                          +{selectedEvent.members.length - 3}
                        </div>
                      )}
                    </div>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
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
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {selectedEvent.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.username}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
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
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              {/* Accept/Decline for invited members */}
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
                            const updatedRes = await api.get('/events');
                            const updatedEvent = updatedRes.data.events.find(e => e.id === selectedEvent.id);
                            if (updatedEvent) setSelectedEvent(updatedEvent);
                          } catch (error) {
                            console.error('Error accepting invitation:', error);
                            alert('Failed to accept invitation: ' + (error.response?.data?.error || error.message));
                          }
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
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
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
                      >
                        ✗ Decline
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-semibold ${myStatus === 'accepted'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {myStatus === 'accepted' ? '✓ You accepted' : '✗ You declined'}
                    </span>
                  );
                }
              })()}

              {/* Host actions */}
              {(user?.id === selectedEvent.host.id) && (
                <div className="flex space-x-2 ml-auto">
                  <button
                    onClick={() => {
                      handleCloseModal();
                      handleEdit(selectedEvent);
                    }}
                    className="px-4 py-2 text-sm font-medium text-green-800 bg-green-100 rounded-xl hover:bg-green-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleCloseModal();
                      handleDelete(selectedEvent);
                    }}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
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

      {/* Members Modal */}
      <Modal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        title="All Members"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Total members: {members.length}</p>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{member.username}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    <p className="text-xs text-gray-400">{member.department}</p>
                  </div>
                </div>
                {member.id === user?.id && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    You
                  </span>
                )}
              </div>
            ))}
          </div>
          {members.length === 0 && (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-500">No members found</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Your Events Modal */}
      <Modal
        isOpen={isEventsListModalOpen}
        onClose={() => setIsEventsListModalOpen(false)}
        title="Your Events"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Events you're hosting: {hostedEvents.length}</p>
          <div className="max-h-96 overflow-y-auto space-y-4">
            {hostedEvents.map((event) => (
              <div key={event.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{event.title}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {event.date} at {event.time}
                      </div>
                      {event.location && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.location}
                        </div>
                      )}
                      {event.members && event.members.length > 0 && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.members.length} member{event.members.length !== 1 ? 's' : ''} invited
                        </div>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{event.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Host
                    </span>
                    <button
                      onClick={() => {
                        setIsEventsListModalOpen(false);
                        handleViewEvent(event);
                      }}
                      className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {hostedEvents.length === 0 && (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 mb-4">You haven't created any events yet</p>
              <button
                onClick={() => {
                  setIsEventsListModalOpen(false);
                  handleAddEventClick();
                }}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Event
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}