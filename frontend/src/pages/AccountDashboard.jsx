import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import logo from '../assets/CEIT-LOGO.png';

export default function AccountDashboard() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    department: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [schedule, setSchedule] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
  });
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleEditMode, setScheduleEditMode] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const departments = [
    'Department of Information Technology',
    'Department of Agriculture and Food Engineering',
    'Department of Civil Engineering',
    'Department of Computer, Electronics, and Electrical Engineering',
    'Department of Industrial Engineering and Technology'
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        department: user.department || '',
      });
      // Fetch schedule and events without blocking UI
      fetchSchedule();
      fetchEvents();
    }
  }, [user]);

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

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
  };

  const fetchSchedule = async () => {
    setScheduleLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/schedules', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }
      
      const data = await response.json();
      if (data.schedule) {
        // Convert the API response to the format expected by the component
        const formattedSchedule = {};
        days.forEach(day => {
          formattedSchedule[day] = (data.schedule[day] || []).map(slot => ({
            id: slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            description: slot.description
          }));
        });
        setSchedule(formattedSchedule);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      // Set empty schedule on error so UI still shows
      const emptySchedule = {};
      days.forEach(day => {
        emptySchedule[day] = [];
      });
      setSchedule(emptySchedule);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = 'http://localhost:8000/api/user/profile';
      const token = localStorage.getItem('token');
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile.');
      }

      const data = await response.json();
      
      // Update the user in context with the response data
      updateUser({
        username: data.user.username,
        email: data.user.email,
        department: data.user.department,
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditMode(false);
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login');
  };

  const addNewClass = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { id: Date.now(), startTime: '', endTime: '', description: '' }]
    }));
  };

  const removeClassSlot = (day, id) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].filter(slot => slot.id !== id)
    }));
  };

  const updateClassSlot = (day, id, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].map(slot => 
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleScheduleSave = async () => {
    setScheduleSaving(true);
    try {
      console.log('Saving schedule:', schedule);
      const response = await fetch('http://localhost:8000/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ schedule }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Save failed:', errorData);
        throw new Error(errorData.message || 'Failed to save schedule');
      }

      const data = await response.json();
      console.log('Save successful:', data);

      setMessage({ type: 'success', text: 'Schedule saved! You can now create events.' });
      
      // Exit edit mode after successful save
      setScheduleEditMode(false);
      
      // Refresh schedule to get IDs from database and updated initialized status
      await fetchSchedule();
      
      // Update user context to reflect schedule_initialized = true
      if (updateUser) {
        const updatedUserData = { ...user, schedule_initialized: true };
        updateUser(updatedUserData);
        console.log('Updated user with schedule_initialized:', updatedUserData);
      }
      
      // Trigger a storage event to notify other tabs/windows
      window.dispatchEvent(new Event('scheduleUpdated'));
      
      // Trigger custom event for Dashboard to refresh
      window.dispatchEvent(new CustomEvent('scheduleChanged', { detail: { hasSchedule: true } }));
    } catch (error) {
      console.error('Error saving schedule:', error);
      setMessage({ type: 'error', text: 'Failed to save schedule. Please try again.' });
    } finally {
      setScheduleSaving(false);
    }
    
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 3000);
  };

  const getTotalScheduledClasses = () => {
    return Object.values(schedule).reduce((total, daySchedule) => total + daySchedule.length, 0);
  };

  // Convert 24-hour time to 12-hour AM/PM format
  const formatTime12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (!user || loggingOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-green-300 border-t-green-700 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium text-lg">{loggingOut ? 'Logging out...' : 'Loading account...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 shadow-lg sticky top-0 z-20" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            <div className="flex items-center space-x-3 flex-1">
              {/* CEIT Logo */}
              <button 
                onClick={() => navigate('/dashboard')}
                className="focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg transition-all hover:opacity-80"
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
                <p className="text-xs text-green-200 font-medium">Account Settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications Bell */}
              <NotificationBell 
                events={events} 
                user={user}
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
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 bg-green-50 flex items-center space-x-3 cursor-default"
                      >
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Settings</span>
                        <svg className="w-4 h-4 ml-auto text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={handleLogout}
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

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-2 sm:px-0">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Account Dashboard</h2>
              <p className="text-lg text-gray-600 font-medium">Manage your account information and settings</p>
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

          {/* Success/Error Messages */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
              message.type === 'success'
                ? 'bg-green-50/80 text-green-800 border-green-300 shadow-lg shadow-green-500/20'
                : 'bg-red-50/80 text-red-800 border-red-300 shadow-lg shadow-red-500/20'
            }`}>
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="font-semibold">{message.text}</span>
              </div>
            </div>
          )}

          {/* Class Schedule Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 px-8 py-6 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Class Schedule
                    {!user?.schedule_initialized && !scheduleSaving && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white animate-pulse">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Required
                      </span>
                    )}
                  </h3>
                  <p className="text-green-200 text-sm mt-1">
                    {scheduleLoading ? 'Loading schedule...' : user?.schedule_initialized
                      ? `${getTotalScheduledClasses()} classes scheduled this week`
                      : 'No schedule set - Required to create events'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {scheduleEditMode ? (
                    <>
                      <button
                        onClick={handleScheduleSave}
                        disabled={scheduleSaving}
                        className={`px-4 py-2 text-white font-semibold rounded-lg transition-all duration-200 shadow-md flex items-center gap-2 ${
                          scheduleSaving 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {scheduleSaving ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Save Schedule
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setScheduleEditMode(false);
                          fetchSchedule(); // Reload original data
                        }}
                        disabled={scheduleSaving}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all duration-200 shadow-md flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setScheduleEditMode(true)}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all duration-200 shadow-md flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Schedule
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {scheduleLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-12 h-12 border-4 border-green-300 border-t-green-700 rounded-full animate-spin"></div>
                      <p className="text-gray-600 font-medium">Loading schedule...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-6">
                  {/* Day Selector - Vertical */}
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    {days.map(day => {
                      const daySchedule = schedule[day] || [];
                      const isSelected = selectedDay === day;
                      
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDay(day)}
                          className={`px-4 py-3 rounded-lg font-semibold text-left transition-all duration-200 flex justify-between items-center ${
                            isSelected
                              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span>{day}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-green-200 text-green-700'
                          }`}>
                            {daySchedule.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Schedule Table - Green Box */}
                  <div className="flex-1 bg-green-100 border-2 border-green-300 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-bold text-gray-900">{selectedDay} Schedule</h4>
                      {scheduleEditMode && (
                        <button
                          onClick={() => addNewClass(selectedDay)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Class
                        </button>
                      )}
                    </div>
                    
                    {getTotalScheduledClasses() === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg font-medium">No schedule set yet</p>
                        <p className="text-sm mt-1">Click "Edit Schedule" then "Add Class" to add your classes</p>
                      </div>
                    ) : schedule[selectedDay]?.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-lg font-medium">No classes on {selectedDay}</p>
                        {scheduleEditMode && <p className="text-sm mt-1">Click "Add Class" to add a class</p>}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg overflow-hidden border border-green-300">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-green-200">
                              <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">
                                Time Range
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">
                                Class Description
                              </th>
                              {scheduleEditMode && (
                                <th className="px-4 py-3 text-center text-sm font-bold text-gray-900 w-20">
                                  Action
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {(schedule[selectedDay] || []).map((slot, index) => (
                              <tr 
                                key={slot.id}
                                className={`border-b border-green-200 transition-all duration-200 ${
                                  index % 2 === 0 ? 'bg-white' : 'bg-green-100/50'
                                }`}
                              >
                                <td className="px-4 py-3">
                                  {scheduleEditMode ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="time"
                                        value={slot.startTime}
                                        onChange={(e) => updateClassSlot(selectedDay, slot.id, 'startTime', e.target.value)}
                                        className="px-2 py-1.5 text-sm border border-green-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 w-28"
                                      />
                                      <span className="text-gray-500 font-bold">-</span>
                                      <input
                                        type="time"
                                        value={slot.endTime}
                                        onChange={(e) => updateClassSlot(selectedDay, slot.id, 'endTime', e.target.value)}
                                        className="px-2 py-1.5 text-sm border border-green-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 w-28"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {formatTime12Hour(slot.startTime)} - {formatTime12Hour(slot.endTime)}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {scheduleEditMode ? (
                                    <input
                                      type="text"
                                      placeholder="Enter class name..."
                                      value={slot.description}
                                      onChange={(e) => updateClassSlot(selectedDay, slot.id, 'description', e.target.value)}
                                      className="w-full px-3 py-2 text-sm border border-green-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                                    />
                                  ) : (
                                    <div className="text-gray-900">{slot.description || <span className="text-gray-400 italic">No description</span>}</div>
                                  )}
                                </td>
                                {scheduleEditMode && (
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => removeClassSlot(selectedDay, slot.id)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                      title="Remove class"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="mb-8">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="bg-gradient-to-r from-green-700 via-green-700 to-green-800 px-8 py-6">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    {editMode ? (
                      <>
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Profile
                      </>
                    ) : (
                      <>
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Account Information
                      </>
                    )}
                  </h3>
                </div>

                <div className="px-8 py-8">
                  {editMode ? (
                    <form onSubmit={handleSaveChanges}>
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="username" className="block text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                            Username
                          </label>
                          <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-300 hover:border-gray-300"
                          />
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-300 hover:border-gray-300"
                          />
                        </div>

                        <div>
                          <label htmlFor="department" className="block text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                            Department
                          </label>
                          <select
                            id="department"
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-300 hover:border-gray-300"
                          >
                            <option value="">Select a department</option>
                            {departments.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex gap-3 pt-6 border-t border-gray-200">
                          <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            ? Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditMode(false);
                              setFormData({
                                username: user.username || '',
                                email: user.email || '',
                                department: user.department || '',
                              });
                            }}
                            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-300"
                          >
                            ? Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="pb-6 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Member Since</p>
                        <p className="text-lg text-gray-900 font-medium">February 2026</p>
                      </div>

                      <div className="pb-6 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Username</p>
                        <p className="text-2xl font-bold text-gray-900">{user.username}</p>
                      </div>

                      <div className="pb-6 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Email Address</p>
                        <p className="text-lg text-gray-900 font-medium">{user.email}</p>
                      </div>

                      <div className="pb-6 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Department</p>
                        <p className="text-lg text-gray-900 font-medium">{user.department || 'Not specified'}</p>
                      </div>

                      

                      <button
                        onClick={() => setEditMode(true)}
                        className="mt-8 w-full px-6 py-3 bg-gradient-to-r from-green-700 to-green-800 text-white font-semibold rounded-lg hover:from-green-800 hover:to-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        ? Edit Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
