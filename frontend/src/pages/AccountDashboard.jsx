import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AccountDashboard() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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
      // Fetch schedule without blocking UI
      fetchSchedule();
    }
  }, [user]);

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
      const response = await fetch('http://localhost:8000/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ schedule }),
      });

      if (!response.ok) {
        throw new Error('Failed to save schedule');
      }

      setMessage({ type: 'success', text: 'Schedule saved! Event conflicts will be updated automatically.' });
      await fetchSchedule(); // Refresh schedule to get IDs from database
      
      // Trigger a storage event to notify other tabs/windows
      window.dispatchEvent(new Event('scheduleUpdated'));
    } catch (error) {
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

  if (!user || loggingOut) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium text-lg">{loggingOut ? 'Logging out...' : 'Loading account...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 shadow-lg sticky top-0 z-20" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            <div className="flex items-center space-x-3 flex-1">
              <button className="p-2 rounded-lg hover:bg-white/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600" aria-label="Event Management System home">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Event Management</h1>
                <p className="text-xs text-blue-100 font-medium">Account Settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3" role="img" aria-label={`User: ${user?.username}`}>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm" aria-hidden="true">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white">{user?.username}</span>
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
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm"
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
              <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 px-8 py-6 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">📅 Class Schedule</h3>
                  <p className="text-purple-100 text-sm mt-1">
                    {scheduleLoading ? 'Loading schedule...' : `${getTotalScheduledClasses()} classes scheduled this week`}
                  </p>
                </div>
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
                      💾 Save Schedule
                    </>
                  )}
                </button>
              </div>

              <div className="p-6">
                {scheduleLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
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
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span>{day}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {daySchedule.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Schedule Table - Blue Box */}
                  <div className="flex-1 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-bold text-blue-900">{selectedDay} Schedule</h4>
                      <button
                        onClick={() => addNewClass(selectedDay)}
                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Class
                      </button>
                    </div>
                    
                    {getTotalScheduledClasses() === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p className="text-lg font-medium">No schedule set yet</p>
                        <p className="text-sm mt-1">Click "Add Class" to add your classes</p>
                      </div>
                    ) : schedule[selectedDay]?.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p className="text-lg font-medium">No classes on {selectedDay}</p>
                        <p className="text-sm mt-1">Click "Add Class" to add a class</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg overflow-hidden border border-blue-200">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-blue-100">
                              <th className="px-4 py-3 text-left text-sm font-bold text-blue-900">
                                Time Range
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-bold text-blue-900">
                                Class Description
                              </th>
                              <th className="px-4 py-3 text-center text-sm font-bold text-blue-900 w-20">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(schedule[selectedDay] || []).map((slot, index) => (
                              <tr 
                                key={slot.id}
                                className={`border-b border-blue-100 transition-all duration-200 ${
                                  index % 2 === 0 ? 'bg-white' : 'bg-blue-50/50'
                                }`}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="time"
                                      value={slot.startTime}
                                      onChange={(e) => updateClassSlot(selectedDay, slot.id, 'startTime', e.target.value)}
                                      className="px-2 py-1.5 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
                                    />
                                    <span className="text-gray-500 font-bold">-</span>
                                    <input
                                      type="time"
                                      value={slot.endTime}
                                      onChange={(e) => updateClassSlot(selectedDay, slot.id, 'endTime', e.target.value)}
                                      className="px-2 py-1.5 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="text"
                                    placeholder="Enter class name..."
                                    value={slot.description}
                                    onChange={(e) => updateClassSlot(selectedDay, slot.id, 'description', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </td>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-8 py-6">
                  <h3 className="text-2xl font-bold text-white">
                    {editMode ? '✎ Edit Profile' : '👤 Account Information'}
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
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-300"
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
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-300"
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
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-300"
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
                            ✓ Save Changes
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
                            ✕ Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
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
                        className="mt-8 w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        ✎ Edit Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              {/* Account Status */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">Account Status</h3>
                </div>
                <div className="px-6 py-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-green-100 to-green-50 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Status</p>
                      <p className="text-xl font-bold text-green-600">Active</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">Account Info</h3>
                </div>
                <div className="px-6 py-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600">Member Since</span>
                    <span className="text-sm font-bold text-gray-900">February 2026</span>
                  </div>
                </div>
              </div>

              {/* Account Settings */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">Quick Actions</h3>
                </div>
                <div className="px-6 py-6 space-y-2">
                  <button className="w-full px-4 py-3 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-300 text-left flex items-center group">
                    <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Change Password
                  </button>
                  <button className="w-full px-4 py-3 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-300 text-left flex items-center group">
                    <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Notifications
                  </button>
                  <button className="w-full px-4 py-3 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-300 text-left flex items-center group">
                    <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Security Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-sm font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-300 text-left flex items-center group border-t border-gray-200 mt-2 pt-4"
                    aria-label="Logout from account"
                  >
                    <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
