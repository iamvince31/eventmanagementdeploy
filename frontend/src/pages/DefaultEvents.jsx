import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import logo from '../assets/CEIT-LOGO.png';
import api from '../services/api';

const DefaultEvents = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentSchoolYear, setCurrentSchoolYear] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [schoolYearError, setSchoolYearError] = useState('');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Determine semester for a given month (1-12)
  const getSemester = (month) => {
    // 1st Semester: September (9) to January (1)
    if (month >= 9 || month === 1) return 1;
    // 2nd Semester: February (2) to June (6)
    if (month >= 2 && month <= 6) return 2;
    // July (7) and August (8) - Summer/Break
    return null;
  };

  // Get current school year based on current date
  const getCurrentSchoolYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    
    // If we're in Sept-Dec, school year is current-next
    // If we're in Jan-Aug, school year is previous-current
    if (currentMonth >= 9) {
      return `${currentYear}-${currentYear + 1}`;
    } else {
      return `${currentYear - 1}-${currentYear}`;
    }
  };

  // Validate and apply school year
  const applySchoolYear = () => {
    // Validate inputs
    if (!startYear || !endYear) {
      setSchoolYearError('Please enter both start and end year');
      return;
    }

    const start = parseInt(startYear);
    const end = parseInt(endYear);

    if (isNaN(start) || isNaN(end)) {
      setSchoolYearError('Please enter valid years');
      return;
    }

    if (start < 2000 || start > 2100 || end < 2000 || end > 2100) {
      setSchoolYearError('Please enter years between 2000 and 2100');
      return;
    }

    if (end !== start + 1) {
      setSchoolYearError('End year must be exactly one year after start year');
      return;
    }

    const schoolYear = `${start}-${end}`;
    setCurrentSchoolYear(schoolYear);
    setSchoolYearError('');
  };

  // Handle year input changes
  const handleStartYearChange = (value) => {
    setStartYear(value);
    setSchoolYearError('');
    
    // Auto-fill end year
    if (value.length === 4) {
      const year = parseInt(value);
      if (!isNaN(year)) {
        setEndYear((year + 1).toString());
      }
    }
  };

  const handleEndYearChange = (value) => {
    setEndYear(value);
    setSchoolYearError('');
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      applySchoolYear();
    }
  };

  useEffect(() => {
    const defaultYear = getCurrentSchoolYear();
    const [start, end] = defaultYear.split('-');
    setStartYear(start);
    setEndYear(end);
    setCurrentSchoolYear(defaultYear);
    fetchAllEvents();
  }, []);

  useEffect(() => {
    if (currentSchoolYear) {
      fetchDefaultEvents();
    }
  }, [currentSchoolYear]);

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

  const fetchDefaultEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/default-events?school_year=${currentSchoolYear}`);
      setEvents(response.data.events);
      setError('');
    } catch (err) {
      setError('Failed to load default events');
      console.error('Error fetching default events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const response = await api.get('/events');
      setAllEvents(response.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleEditDate = (event) => {
    setEditingEventId(event.id);
    setSelectedDate(event.date || '');
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setSelectedDate('');
  };

  const handleSaveDate = async (event) => {
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    // Validate that the date is within the school year (September to August)
    const dateObj = new Date(selectedDate);
    const [startYear, endYear] = currentSchoolYear.split('-').map(Number);
    
    const schoolYearStart = new Date(startYear, 8, 1); // September 1st (month is 0-indexed)
    const schoolYearEnd = new Date(endYear, 7, 31); // August 31st
    
    if (dateObj < schoolYearStart || dateObj > schoolYearEnd) {
      alert(`Date must be within the school year ${currentSchoolYear} (September ${startYear} to August ${endYear})`);
      return;
    }

    try {
      setSaving(true);
      await api.put(`/default-events/${event.id}/date`, {
        date: selectedDate,
        school_year: currentSchoolYear
      });
      
      // Update local state
      setEvents(events.map(e => 
        e.id === event.id ? { ...e, date: selectedDate, school_year: currentSchoolYear } : e
      ));
      
      setEditingEventId(null);
      setSelectedDate('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update date');
      console.error('Error updating date:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getYearForMonth = (month) => {
    // Parse school year (e.g., "2024-2025")
    const [startYear, endYear] = currentSchoolYear.split('-').map(Number);
    
    // Sept-Dec use start year, Jan-Aug use end year
    if (month >= 9) {
      return startYear;
    } else {
      return endYear;
    }
  };

  const groupEventsByMonth = () => {
    const grouped = {};
    events.forEach(event => {
      if (!grouped[event.month]) {
        grouped[event.month] = [];
      }
      grouped[event.month].push(event);
    });
    return grouped;
  };

  const eventsByMonth = groupEventsByMonth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-green-300 border-t-green-700 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium text-lg">Loading academic calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50">
      {/* Navigation Bar */}
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
                <p className="text-xs text-green-200 font-medium">Academic Calendar</p>
              </div>
            </div>

            {/* Right corner - Notifications and Account */}
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
                  events={allEvents} 
                  user={user}
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
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={async () => {
                          setIsAccountDropdownOpen(false);
                          await handleLogout();
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
      <main className="w-full py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-2 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-4">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Academic Calendar</h2>
              <p className="text-lg text-gray-600 font-medium">Default events throughout the academic year</p>
            </div>

            {/* School Year Selector */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl shadow-md border-2 border-green-200 p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-700 text-white rounded-lg p-2.5 shadow-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-green-900 block">
                      School Year
                    </label>
                    <p className="text-xs text-green-700">Select academic year to view/edit</p>
                  </div>
                </div>
                <div className="flex-1 w-full sm:w-auto flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={startYear}
                      onChange={(e) => handleStartYearChange(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="2024"
                      min="2000"
                      max="2100"
                      className={`w-24 px-3 py-2 text-sm font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 bg-white shadow-sm transition-colors ${
                        schoolYearError 
                          ? 'border-red-400 focus:border-red-500' 
                          : 'border-green-300 hover:border-green-400'
                      }`}
                    />
                    <span className="text-lg font-bold text-green-700">-</span>
                    <input
                      type="number"
                      value={endYear}
                      onChange={(e) => handleEndYearChange(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="2025"
                      min="2000"
                      max="2100"
                      disabled
                      className={`w-24 px-3 py-2 text-sm font-semibold border-2 rounded-lg focus:outline-none bg-white cursor-not-allowed shadow-sm transition-colors ${
                        schoolYearError 
                          ? 'border-red-400' 
                          : 'border-green-300'
                      }`}
                    />
                    <button
                      onClick={applySchoolYear}
                      className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Apply
                    </button>
                  </div>
                </div>
                {currentSchoolYear === getCurrentSchoolYear() && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-700 text-white shadow-sm">
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Current
                  </span>
                )}
              </div>
              {schoolYearError && (
                <p className="mt-3 text-xs font-semibold text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {schoolYearError}
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 bg-red-50/80 text-red-800 border-red-300 shadow-lg shadow-red-500/20">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          {/* Events by Month */}
          <div className="space-y-8">
            {/* Display months in academic year order: Sept-Jan (1st sem), Feb-June (2nd sem), July-Aug (summer) */}
            {[9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8].map((monthNumber) => {
              const monthName = monthNames[monthNumber - 1];
              const monthEvents = eventsByMonth[monthNumber] || [];
              const semester = getSemester(monthNumber);
              
              // Semester badge
              let semesterBadge = null;
              
              if (semester === 1) {
                semesterBadge = (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-900 text-green-100">
                    1st Semester
                  </span>
                );
              } else if (semester === 2) {
                semesterBadge = (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-800 text-green-50">
                    2nd Semester
                  </span>
                );
              }
              
              const yearForMonth = getYearForMonth(monthNumber);
              
              return (
                <div key={monthNumber} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Month Label Header */}
                  <div className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-xl font-bold text-white">{monthName} {yearForMonth}</h3>
                        {semesterBadge}
                      </div>
                      <span className="text-sm text-green-200 font-medium">
                        {monthEvents.length} {monthEvents.length === 1 ? 'event' : 'events'}
                      </span>
                    </div>
                  </div>

                  {/* Events Table */}
                  {monthEvents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gradient-to-r from-green-50 to-green-100 border-b-2 border-green-200">
                            <th className="px-6 py-3 text-left text-xs font-bold text-green-900 uppercase tracking-wider w-16">#</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-green-900 uppercase tracking-wider">Event Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-green-900 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-green-900 uppercase tracking-wider w-24">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {monthEvents.map((event, idx) => (
                            <tr
                              key={event.id}
                              className="hover:bg-green-50 transition-colors duration-150"
                            >
                              <td className="px-6 py-4">
                                <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-gray-900 text-sm font-semibold">
                                  {event.name}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {editingEventId === event.id ? (
                                  <div className="space-y-2">
                                    <input
                                      type="date"
                                      value={selectedDate}
                                      onChange={(e) => setSelectedDate(e.target.value)}
                                      min={`${currentSchoolYear.split('-')[0]}-09-01`}
                                      max={`${currentSchoolYear.split('-')[1]}-08-31`}
                                      className="w-full px-3 py-2 text-sm font-medium border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent shadow-sm"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSaveDate(event)}
                                        disabled={saving}
                                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {saving ? (
                                          <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Save
                                          </>
                                        ) : (
                                          <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Save
                                          </>
                                        )}
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        disabled={saving}
                                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className={`text-sm font-semibold ${event.date ? 'text-green-700' : 'text-gray-500'}`}>
                                      {formatDate(event.date)}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {editingEventId !== event.id && (
                                  <button
                                    onClick={() => handleEditDate(event)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-green-700 hover:text-white bg-green-100 hover:bg-green-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    {event.date ? 'Edit' : 'Set'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="px-6 py-12 text-center text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium">No events scheduled</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DefaultEvents;
