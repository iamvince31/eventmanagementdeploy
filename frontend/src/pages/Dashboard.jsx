import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Calendar from '../components/Calendar';
import EventDetails from '../components/EventDetails';
import NotificationBell from '../components/NotificationBell';
import logo from "../assets/CEIT-LOGO.png";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [highlightedDate, setHighlightedDate] = useState(null);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  useEffect(() => {
    fetchData();
    
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

  const handleViewEvent = (event) => {
    // Don't navigate for default events
    if (event.is_default_event) {
      return;
    }
    navigate('/add-event', { state: { event } });
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

  // Compute stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date + 'T00:00:00');
    return eventDate >= today;
  });

  const hostedEvents = events.filter(event => event.host.id === user?.id);

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
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 group cursor-pointer text-left">
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
              </div>

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
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 group cursor-pointer text-left">
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
              </div>
            </>
          )}
        </div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Calendar View</h2>
            <p className="text-sm text-gray-600 mt-1.5 font-medium">Click a date to view or manage your events</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/default-events')}
              className="inline-flex items-center px-6 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 group bg-white text-green-700 border-2 border-green-700 hover:bg-green-50 focus:ring-green-600"
            >
              <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Academic Calendar
            </button>
            <button
              onClick={() => navigate('/add-event', { state: { selectedDate } })}
              className="inline-flex items-center px-6 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 group bg-gradient-to-r from-green-700 via-green-700 to-green-800 text-white hover:from-green-800 hover:via-green-800 hover:to-green-900 focus:ring-green-600"
            >
              <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Event
            </button>
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
    </div>
  );
}
