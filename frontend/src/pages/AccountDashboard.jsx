import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AccountDashboard() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    department: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

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
    }
  }, [user]);

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
    await logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
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
              <button
                onClick={() => navigate('/dashboard')}
                className="px-3 py-1.5 text-sm font-medium text-white bg-white/15 border border-white/30 rounded-lg hover:bg-white/25 transition-all duration-200"
                aria-label="Go back to dashboard"
              >
                Dashboard
              </button>
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
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Account Dashboard</h2>
            <p className="text-lg text-gray-600 font-medium">Manage your account information and settings</p>
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
