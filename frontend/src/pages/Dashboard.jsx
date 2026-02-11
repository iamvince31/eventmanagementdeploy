import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Calendar from '../components/Calendar';
import EventDetails from '../components/EventDetails';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, membersRes] = await Promise.all([
        api.get('/events'),
        api.get('/users'),
      ]);
      setEvents(eventsRes.data.events);
      setMembers(membersRes.data.members);
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

  const handleLogout = async () => {
    await logout();
  };

  const handleDateSelect = (date, events) => {
    setSelectedDate(date);
    setSelectedDateEvents(events);
  };

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              {/* Calendar Icon */}
              <div className="bg-white/20 rounded-lg p-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">Event Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white leading-tight">{user?.username}</p>
                  <p className="text-xs text-blue-200 leading-tight">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm font-medium text-white bg-white/15 border border-white/30 rounded-lg hover:bg-white/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-fade-in">
          {/* Total Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center space-x-4 hover:shadow-md transition-shadow">
            <div className="bg-blue-50 rounded-lg p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              <p className="text-sm text-gray-500">Total Events</p>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center space-x-4 hover:shadow-md transition-shadow">
            <div className="bg-green-50 rounded-lg p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcomingEvents.length}</p>
              <p className="text-sm text-gray-500">Upcoming</p>
            </div>
          </div>

          {/* Total Members */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center space-x-4 hover:shadow-md transition-shadow">
            <div className="bg-purple-50 rounded-lg p-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{members.length}</p>
              <p className="text-sm text-gray-500">Members</p>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
            <p className="text-sm text-gray-500 mt-0.5">Click a date to view or manage events</p>
          </div>
          <button
            onClick={() => navigate('/add-event', { state: { selectedDate } })}
            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Event
          </button>
        </div>

        {/* Calendar + Event Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2">
            <Calendar
              events={events}
              onDateSelect={handleDateSelect}
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
            />
          </div>
        </div>
      </main>
    </div>
  );
}
