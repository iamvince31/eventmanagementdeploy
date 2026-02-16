import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Calendar from '../components/Calendar';
import EventDetails from '../components/EventDetails';
import Modal from '../components/Modal';
import { getFixedImageUrl } from '../utils/image';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [userSchedule, setUserSchedule] = useState({});
  const [eventConflicts, setEventConflicts] = useState([]);
  const [highlightedDate, setHighlightedDate] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isEventsListModalOpen, setIsEventsListModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
    fetchUserSchedule();

    // Auto-select today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setSelectedDate(todayStr);
  }, []);

  // Refetch schedule when window regains focus (user comes back from /accounts)
  useEffect(() => {
    const handleFocus = () => {
      fetchUserSchedule();
    };

    const handleScheduleUpdate = () => {
      fetchUserSchedule();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('scheduleUpdated', handleScheduleUpdate);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('scheduleUpdated', handleScheduleUpdate);
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
      const response = await api.get('/schedules');
      if (response.data.schedule) {
        setUserSchedule(response.data.schedule);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
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
    setIsMembersModalOpen(true);
  };

  const handleTotalEventsClick = () => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 shadow-lg sticky top-0 z-20" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            <div className="flex items-center space-x-3 flex-1">
              {/* Calendar Icon */}
              <button className="p-2 rounded-lg hover:bg-white/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600" aria-label="Event Management home">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Event Management</h1>
                <p className="text-xs text-blue-100 font-medium">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/account')}
                className="hidden sm:flex items-center space-x-3"
                aria-label="Go to account settings"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white hover:opacity-80 transition-opacity duration-200">{user?.username}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {/* Total Events */}
          <button
            onClick={handleTotalEventsClick}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 group cursor-pointer text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-4 group-hover:from-blue-200 group-hover:to-blue-100 transition-colors duration-300">
                <svg className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Events</p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{events.length}</p>
              </div>
            </div>
          </button>

          {/* Upcoming Events */}
          <button
            onClick={handleUpcomingClick}
            disabled={upcomingEvents.length === 0}
            className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all duration-300 group text-left ${
              upcomingEvents.length > 0 
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
              <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-4 group-hover:from-purple-200 group-hover:to-purple-100 transition-colors duration-300">
                <svg className="w-7 h-7 text-purple-600 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Members</p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{members.length}</p>
              </div>
            </div>
          </button>
        </div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Calendar View</h2>
            <p className="text-sm text-gray-600 mt-1.5 font-medium">Click a date to view or manage your events</p>
          </div>
          <button
            onClick={() => navigate('/add-event', { state: { selectedDate } })}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:via-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Event
          </button>
        </div>

        {/* Calendar + Event Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <Calendar
              events={events}
              onDateSelect={handleDateSelect}
              highlightedDate={highlightedDate}
            />
          </div>
          <div>
            <EventDetails
              date={selectedDate}
              events={selectedDateEvents}
              members={members}
              currentUser={user}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleViewEvent}
            />
          </div>
        </div>
      </main>

      {/* Event Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Event Details"
      >
        {selectedEvent && (
          <div className="space-y-4">
            {/* Schedule Conflict Warning for Invited Members */}
            {eventConflicts.length > 0 && (
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
                    className="w-full h-64 object-cover rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedEvent.images.map((image, index) => (
                      <img
                        key={index}
                        src={getFixedImageUrl(image)}
                        alt={`${selectedEvent.title} ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg shadow-sm"
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
                {/* Format Date nicer? */}
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
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
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

            {/* Members & RSVP Status */}
            {selectedEvent.members && selectedEvent.members.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <p className="font-semibold text-gray-900 mb-3">Invited Members</p>
                <div className="space-y-2">
                  {selectedEvent.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700 font-medium">{member.username}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${member.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : member.status === 'declined'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {member.status === 'accepted' ? '✓ Accepted' : member.status === 'declined' ? '✗ Declined' : '● Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions in Modal */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
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
                      {myStatus === 'accepted' ? '✓ You accepted this invitation' : '✗ You declined this invitation'}
                    </span>
                  );
                }
              })()}

              {/* Right side - Host actions and Reschedule */}
              <div className="flex space-x-2 ml-auto">
                {/* Reschedule button for all users */}
                <button
                  onClick={() => {
                    // TODO: Handle reschedule
                    console.log('Reschedule event');
                  }}
                  className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  Reschedule
                </button>

                {/* Edit/Delete buttons only for host */}
                {(user?.id === selectedEvent.host.id) && (
                  <>
                    <button
                      onClick={() => {
                        handleCloseModal();
                        handleEdit(selectedEvent);
                      }}
                      className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
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
        )}
      </Modal>

      {/* Members List Modal */}
      <Modal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        title="All Members"
        fullscreen={true}
      >
        <div className="h-full overflow-y-auto">
          <div className="max-w-6xl mx-auto py-8 px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-12 gap-y-8">
              {Object.entries(groupMembersByDepartment()).map(([department, deptMembers]) => (
                <div key={department}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    {department}
                  </h3>
                  <ul className="space-y-3">
                    {deptMembers.map((member) => (
                      <li key={member.id} className="text-gray-300">
                        <div className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                          {member.username}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {member.email}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Events List Modal */}
      <Modal
        isOpen={isEventsListModalOpen}
        onClose={() => setIsEventsListModalOpen(false)}
        title="All Events"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedEvents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No events scheduled</p>
          ) : (
            sortedEvents.map(event => (
              <button
                key={event.id}
                onClick={() => {
                  setIsEventsListModalOpen(false);
                  handleViewEvent(event);
                }}
                className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
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
                  </div>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
