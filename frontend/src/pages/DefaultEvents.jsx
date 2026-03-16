import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import DatePicker from '../components/DatePicker';
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
  const [selectedEndDate, setSelectedEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentSchoolYear, setCurrentSchoolYear] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [schoolYearError, setSchoolYearError] = useState('');
  const [creatingEventMonth, setCreatingEventMonth] = useState(null);
  const [newEventName, setNewEventName] = useState('');
  const [tempEventId, setTempEventId] = useState(null);

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'Admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Lock body scroll when editing dates
  useEffect(() => {
    if (editingEventId !== null) {
      // Disable scrolling
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable scrolling
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [editingEventId]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Handle date change
  const handleDateChange = (dateString, setter, fieldName) => {
    setter(dateString);
    setError(''); // Clear any previous errors
  };

  // Determine semester for a given month (1-12)
  const getSemester = (month) => {
    // 1st Semester: September (9) to January (1)
    if (month >= 9 || month === 1) return 1;
    // 2nd Semester: February (2) to June (6)
    if (month >= 2 && month <= 6) return 2;
    // Mid-Year Semester: July (7) and August (8)
    if (month === 7 || month === 8) return 'mid-year';
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
    // If event has a date, use it; otherwise default to first day of the event's month
    if (event.date) {
      // Ensure date is in YYYY-MM-DD format for the date input
      const dateObj = new Date(event.date);
      const formattedDate = dateObj.toISOString().split('T')[0];
      setSelectedDate(formattedDate);
    } else {
      // Set default date to first day of the event's designated month
      const yearForMonth = getYearForMonth(event.month);
      const defaultDate = `${yearForMonth}-${String(event.month).padStart(2, '0')}-01`;
      setSelectedDate(defaultDate);
    }
    
    // Set end date if it exists
    if (event.end_date) {
      const endDateObj = new Date(event.end_date);
      const formattedEndDate = endDateObj.toISOString().split('T')[0];
      setSelectedEndDate(formattedEndDate);
    } else {
      setSelectedEndDate('');
    }
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setSelectedDate('');
    setSelectedEndDate('');
  };

  const handleSaveDate = async (event) => {
    if (!selectedDate) {
      alert('Please select a start date');
      return;
    }

    // Validate that end date is after or equal to start date
    if (selectedEndDate && selectedEndDate < selectedDate) {
      alert('End date must be on or after the start date');
      return;
    }

    // Validate that the date is within the school year (September to August)
    const dateObj = new Date(selectedDate);
    const [startYear, endYear] = currentSchoolYear.split('-').map(Number);
    
    const schoolYearStart = new Date(startYear, 8, 1); // September 1st (month is 0-indexed)
    const schoolYearEnd = new Date(endYear, 7, 31); // August 31st
    
    if (dateObj < schoolYearStart || dateObj > schoolYearEnd) {
      alert(`Start date must be within the school year ${currentSchoolYear} (September ${startYear} to August ${endYear})`);
      return;
    }

    // Validate end date if provided
    if (selectedEndDate) {
      const endDateObj = new Date(selectedEndDate);
      if (endDateObj < schoolYearStart || endDateObj > schoolYearEnd) {
        alert(`End date must be within the school year ${currentSchoolYear} (September ${startYear} to August ${endYear})`);
        return;
      }
    }

    try {
      setSaving(true);
      await api.put(`/default-events/${event.id}/date`, {
        date: selectedDate,
        end_date: selectedEndDate || null,
        school_year: currentSchoolYear
      });
      
      // Refresh the events list to show the event in the correct month
      await fetchDefaultEvents();
      
      setEditingEventId(null);
      setSelectedDate('');
      setSelectedEndDate('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update date');
      console.error('Error updating date:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString, endDateString) => {
    if (!dateString) return 'No date set';
    
    const date = new Date(dateString);
    const formattedStart = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    // If there's an end date, show the range
    if (endDateString) {
      const endDate = new Date(endDateString);
      const formattedEnd = endDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      // If same month and year, show abbreviated format
      if (date.getMonth() === endDate.getMonth() && date.getFullYear() === endDate.getFullYear()) {
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.getDate()}, ${endDate.getFullYear()}`;
      }
      
      return `${formattedStart} - ${formattedEnd}`;
    }
    
    return formattedStart;
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

  const handleStartCreateEvent = (monthNumber) => {
    if (!currentSchoolYear) {
      alert('Please select a school year first');
      return;
    }
    
    setCreatingEventMonth(monthNumber);
    setNewEventName('');
    setError('');
  };

  const handleCancelCreateEvent = () => {
    setCreatingEventMonth(null);
    setNewEventName('');
    setError('');
  };

  const handleSaveNewEventName = async (monthNumber) => {
    if (!newEventName.trim()) {
      setError('Please enter an event name');
      return;
    }

    try {
      setSaving(true);
      const response = await api.post('/default-events/create-empty', {
        name: newEventName.trim(),
        month: monthNumber,
        school_year: currentSchoolYear
      });
      
      // Refresh the events list
      await fetchDefaultEvents();
      
      // Reset form and immediately open date editor for the new event
      setCreatingEventMonth(null);
      setNewEventName('');
      setTempEventId(response.data.event.id);
      setError('');
      
      // Auto-open the date editor for the newly created event
      setTimeout(() => {
        const newEvent = response.data.event;
        handleEditDate(newEvent);
      }, 100);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create event');
      console.error('Error creating event:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50">
        {/* Navigation Bar Skeleton */}
        <nav className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 shadow-lg sticky top-0 z-20">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-white/20 rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-6 w-40 bg-white/20 rounded animate-pulse"></div>
                  <div className="h-3 w-32 bg-white/10 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-white/20 rounded-lg animate-pulse"></div>
                <div className="h-10 w-10 bg-white/20 rounded-lg animate-pulse"></div>
                <div className="h-10 w-10 bg-white/20 rounded-lg animate-pulse"></div>
                <div className="h-10 w-32 bg-white/20 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Skeleton */}
        <main className="w-full py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-2 sm:px-0">
            <div className="mb-8 animate-pulse">
              <div className="mb-4">
                <div className="h-10 w-80 bg-gray-300 rounded mb-2"></div>
                <div className="h-6 w-96 bg-gray-200 rounded"></div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl shadow-md border-2 border-green-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-green-300 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-5 w-32 bg-green-300 rounded mb-2"></div>
                    <div className="h-4 w-48 bg-green-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-pulse">
                  <div className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 px-6 py-4">
                    <div className="h-6 w-40 bg-white/20 rounded"></div>
                  </div>
                  <div className="p-6 space-y-3">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="flex items-center space-x-4">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 h-6 bg-gray-200 rounded"></div>
                        <div className="h-6 w-32 bg-gray-200 rounded"></div>
                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50">
      <Navbar isLoading={loading} />

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
              
              // Semester text header
              let semesterHeader = null;
              
              if (semester === 1) {
                semesterHeader = '1st Semester';
              } else if (semester === 2) {
                semesterHeader = '2nd Semester';
              } else if (semester === 'mid-year') {
                semesterHeader = 'Mid-Year Semester';
              }
              
              const yearForMonth = getYearForMonth(monthNumber);
              
              return (
                <div key={monthNumber}>
                  {/* Semester Header - Show only for first month of each semester */}
                  {((semester === 1 && monthNumber === 9) || 
                    (semester === 2 && monthNumber === 2) || 
                    (semester === 'mid-year' && monthNumber === 7)) && (
                    <div className="mb-6">
                      <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-700 via-green-600 to-green-800 tracking-tight">
                        {semesterHeader}
                      </h2>
                      <div className="mt-3 h-1.5 w-full bg-gradient-to-r from-green-600 via-green-500 to-transparent rounded-full"></div>
                    </div>
                  )}
                  
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    {/* Month Label Header */}
                    <div className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <h3 className="text-xl font-bold text-white">{monthName} {yearForMonth}</h3>
                        </div>
                        <span className="text-sm text-green-200 font-medium">
                          {monthEvents.length} {monthEvents.length === 1 ? 'event' : 'events'}
                        </span>
                      </div>
                    </div>

                  {/* Events Table */}
                  {monthEvents.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gradient-to-r from-green-50 to-green-100 border-b-2 border-green-200">
                              <th className="px-6 py-3 text-left text-xs font-bold text-green-900 uppercase tracking-wider w-16">#</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-green-900 uppercase tracking-wider">Event Name</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-green-900 uppercase tracking-wider w-64">Date</th>
                              <th className="px-6 py-3 text-center text-xs font-bold text-green-900 uppercase tracking-wider w-32">Action</th>
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
                                <td className="px-6 py-4 w-80">
                                  {editingEventId === event.id ? (
                                    <div className="space-y-2">
                                      <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                          Start Date
                                        </label>
                                        <DatePicker
                                          selectedDate={selectedDate}
                                          onDateSelect={(date) => handleDateChange(date, setSelectedDate, 'Start date')}
                                          minDate={`${currentSchoolYear.split('-')[0]}-09-01`}
                                          maxDate={`${currentSchoolYear.split('-')[1]}-08-31`}
                                          excludeSundays={true}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                          End Date (Optional)
                                        </label>
                                        <DatePicker
                                          selectedDate={selectedEndDate}
                                          onDateSelect={(date) => handleDateChange(date, setSelectedEndDate, 'End date')}
                                          minDate={selectedDate || `${currentSchoolYear.split('-')[0]}-09-01`}
                                          maxDate={`${currentSchoolYear.split('-')[1]}-08-31`}
                                          excludeSundays={true}
                                        />
                                      </div>
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
                                        {formatDate(event.date, event.end_date)}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center w-32">
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
                      
                      {/* Add Academic Event Button for all academic year months */}
                      {(semester !== null || monthNumber === 7 || monthNumber === 8) && (
                        <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 border-t border-green-200">
                          {creatingEventMonth === monthNumber ? (
                            <div className="flex items-center gap-3">
                              <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                                {monthEvents.length + 1}
                              </span>
                              <input
                                type="text"
                                value={newEventName}
                                onChange={(e) => setNewEventName(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && newEventName.trim()) {
                                    handleSaveNewEventName(monthNumber);
                                  }
                                }}
                                placeholder="Enter event name"
                                className="flex-1 px-3 py-2 text-sm font-semibold border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent shadow-sm"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveNewEventName(monthNumber)}
                                disabled={saving || !newEventName.trim()}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                                onClick={handleCancelCreateEvent}
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <button
                                onClick={() => handleStartCreateEvent(monthNumber)}
                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Create Academic Event
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="px-6 py-12 text-center">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-400 mb-4">No events scheduled</p>
                      {(semester !== null || monthNumber === 7 || monthNumber === 8) && (
                        <>
                          {creatingEventMonth === monthNumber ? (
                            <div className="max-w-md mx-auto flex items-center gap-3">
                              <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                                1
                              </span>
                              <input
                                type="text"
                                value={newEventName}
                                onChange={(e) => setNewEventName(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && newEventName.trim()) {
                                    handleSaveNewEventName(monthNumber);
                                  }
                                }}
                                placeholder="Enter event name"
                                className="flex-1 px-3 py-2 text-sm font-semibold border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent shadow-sm"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveNewEventName(monthNumber)}
                                disabled={saving || !newEventName.trim()}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                                onClick={handleCancelCreateEvent}
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartCreateEvent(monthNumber)}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                              </svg>
                              Add Academic Event
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  </div>
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
