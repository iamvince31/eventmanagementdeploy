import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import logo from '../assets/CEIT-LOGO.png';
import NotificationBell from '../components/NotificationBell';

export default function History() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activities, setActivities] = useState([]);
  const [events, setEvents] = useState([]); // For NotificationBell
  const [loading, setLoading] = useState(true);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 20,
    total: 0,
    last_page: 1,
  });

  useEffect(() => {
    // Check if user is validated
    if (user && !user.is_validated) {
      navigate('/account');
      return;
    }
    
    fetchActivities();
    fetchEvents(); // For NotificationBell
  }, [filterType, filterStatus]);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchActivities = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get('/activities', {
        params: {
          type: filterType,
          status: filterStatus,
          page: page,
          per_page: 20
        }
      });
      setActivities(response.data.activities);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleViewActivity = (activity) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedActivity(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAccountDropdownOpen && !event.target.closest('.account-dropdown-container')) {
        setIsAccountDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAccountDropdownOpen]);

  const getActivityIcon = (type) => {
    const iconClasses = "w-5 h-5";
    
    switch (type) {
      case 'event_hosted':
        return (
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-purple-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'event_invited':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'event_request_submitted':
        return (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case 'event_request_approved':
        return (
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-emerald-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'event_request_rejected':
        return (
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'event_request_reviewed':
        return (
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-indigo-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'hierarchy_approval_requested':
        return (
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-amber-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'hierarchy_approval_decision':
        return (
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-teal-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        );
      case 'message_sent':
        return (
          <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-pink-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
        );
      case 'message_received':
        return (
          <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-cyan-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getActivityTitle = (activity) => {
    switch (activity.type) {
      case 'event_hosted':
        return `Hosted: ${activity.title}`;
      case 'event_invited':
        return `Invited to: ${activity.title}`;
      case 'event_request_submitted':
        return `Requested: ${activity.title}`;
      case 'event_request_approved':
        return `Approved Request: ${activity.title}`;
      case 'event_request_rejected':
        return `Rejected Request: ${activity.title}`;
      case 'event_request_reviewed':
        return `Reviewed: ${activity.title}`;
      case 'hierarchy_approval_requested':
        return `Approval Requested: ${activity.title}`;
      case 'hierarchy_approval_decision':
        return `Approval Decision: ${activity.title}`;
      case 'message_sent':
      case 'message_received':
        return activity.title;
      default:
        return activity.title;
    }
  };

  const getStatusBadge = (activity) => {
    const status = activity.status;
    let badgeClass = '';
    let statusText = '';

    switch (status) {
      case 'completed':
      case 'accepted':
      case 'approved':
      case 'read':
        badgeClass = 'bg-green-100 text-green-700';
        statusText = status.charAt(0).toUpperCase() + status.slice(1);
        break;
      case 'declined':
      case 'rejected':
        badgeClass = 'bg-red-100 text-red-700';
        statusText = status.charAt(0).toUpperCase() + status.slice(1);
        break;
      case 'pending':
      case 'unread':
        badgeClass = 'bg-yellow-100 text-yellow-700';
        statusText = status.charAt(0).toUpperCase() + status.slice(1);
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-700';
        statusText = status.charAt(0).toUpperCase() + status.slice(1);
    }

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badgeClass}`}>
        {statusText}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50">
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
                <p className="text-xs text-green-200 font-medium">History</p>
              </div>
            </div>

            {/* Right corner - Home, History, Notifications and Account */}
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

              {/* History Icon - Active */}
              <button
                onClick={() => navigate('/history')}
                className="p-2 rounded-lg bg-white/20 transition-colors duration-200"
                aria-label="View history"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Notifications Bell */}
              <div className="relative">
                <NotificationBell
                  events={events}
                  user={user}
                  onNotificationClick={handleViewActivity}
                />
              </div>

              {/* Account Dropdown */}
              <div className="relative account-dropdown-container">
                <button
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                  aria-label="Account menu"
                >
                  {user?.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt={user?.username}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-green-300 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
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
                      
                      {user?.role === 'Admin' && (
                        <button
                          onClick={() => {
                            setIsAccountDropdownOpen(false);
                            navigate('/admin');
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors flex items-center space-x-3"
                        >
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span className="font-medium">Admin Panel</span>
                        </button>
                      )}

                      <div className="border-t border-gray-200 my-1"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Activity History</h2>
          <p className="text-gray-600">Complete history of all your interactions, events, approvals, and messages</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Activity Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'all'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('event_hosted')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'event_hosted'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Events Hosted
                </button>
                <button
                  onClick={() => setFilterType('event_invited')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'event_invited'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Invitations
                </button>
                <button
                  onClick={() => setFilterType('event_request_submitted')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'event_request_submitted'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Requests
                </button>
                <button
                  onClick={() => setFilterType('hierarchy_approval_requested')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'hierarchy_approval_requested'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Approvals
                </button>
                <button
                  onClick={() => setFilterType('message_sent')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'message_sent'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Messages
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'pending'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus('approved')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'approved'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setFilterStatus('rejected')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'rejected'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Rejected
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Activities List */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-6 w-3/4 bg-gray-300 rounded"></div>
                      <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                    <div className="flex items-center space-x-4 pt-2">
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-600">No activities match your current filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {activities.map((activity, index) => (
                <div
                  key={`${activity.type}-${activity.id}-${index}`}
                  onClick={() => handleViewActivity(activity)}
                  className="p-6 hover:bg-green-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    {/* Activity Icon */}
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            {getActivityTitle(activity)}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {activity.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {activity.date} at {activity.time}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {activity.location}
                            </span>
                            <span>{formatDate(activity.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          {getStatusBadge(activity)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} activities
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchActivities(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchActivities(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.last_page}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activity Details Modal */}
      {isModalOpen && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getActivityIcon(selectedActivity.type)}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{getActivityTitle(selectedActivity)}</h2>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(selectedActivity.created_at)}</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                {getStatusBadge(selectedActivity)}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
                  <p className="text-gray-600">{selectedActivity.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Date & Time</h3>
                    <p className="text-gray-600">
                      {new Date(selectedActivity.date).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })} at {selectedActivity.time}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Location</h3>
                    <p className="text-gray-600">{selectedActivity.location}</p>
                  </div>
                </div>

                {/* Activity-specific details */}
                {selectedActivity.type === 'event_hosted' && selectedActivity.details && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Event Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900">{selectedActivity.details.members_count}</div>
                        <div className="text-xs text-gray-500">Total Invited</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-700">{selectedActivity.details.accepted_count}</div>
                        <div className="text-xs text-gray-500">Accepted</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-lg font-bold text-red-700">{selectedActivity.details.declined_count}</div>
                        <div className="text-xs text-gray-500">Declined</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-lg font-bold text-yellow-700">{selectedActivity.details.pending_count}</div>
                        <div className="text-xs text-gray-500">Pending</div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedActivity.type === 'event_invited' && selectedActivity.details && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Invitation Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Hosted by</p>
                          <p className="font-medium text-gray-900">{selectedActivity.details.host?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Your Response</p>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedActivity.details.user_response === 'accepted' ? 'bg-green-100 text-green-700' :
                            selectedActivity.details.user_response === 'declined' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {selectedActivity.details.user_response?.charAt(0).toUpperCase() + selectedActivity.details.user_response?.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedActivity.type === 'event_request_submitted' && selectedActivity.details && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Request Details</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-medium text-gray-600 mb-1">Justification</h4>
                        <p className="text-sm text-gray-700">{selectedActivity.details.justification}</p>
                      </div>
                      {selectedActivity.details.dean_approver && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-600 mb-1">Dean Approval</h4>
                          <p className="text-sm text-green-700">✓ Approved by {selectedActivity.details.dean_approver.name}</p>
                          <p className="text-xs text-gray-500">on {formatDate(selectedActivity.details.dean_approved_at)}</p>
                        </div>
                      )}
                      {selectedActivity.details.chair_approver && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-600 mb-1">Chairperson Approval</h4>
                          <p className="text-sm text-green-700">✓ Approved by {selectedActivity.details.chair_approver.name}</p>
                          <p className="text-xs text-gray-500">on {formatDate(selectedActivity.details.chair_approved_at)}</p>
                        </div>
                      )}
                      {selectedActivity.details.rejection_reason && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-600 mb-1">Rejection Reason</h4>
                          <p className="text-sm text-red-700">{selectedActivity.details.rejection_reason}</p>
                        </div>
                      )}
                      {selectedActivity.details.all_approvals_received && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-medium text-green-800">✓ All approvals received - You can now create this event!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedActivity.type === 'event_request_approved' && selectedActivity.details && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Approval Details</h3>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Requested by</p>
                          <p className="font-medium text-gray-900">{selectedActivity.details.requester?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Your Role</p>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                            {selectedActivity.details.approval_role}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Approved on {formatDate(selectedActivity.details.approved_at)}
                      </p>
                    </div>
                  </div>
                )}

                {selectedActivity.type === 'event_request_rejected' && selectedActivity.details && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Rejection Details</h3>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Requested by</p>
                          <p className="font-medium text-gray-900">{selectedActivity.details.requester?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Status</p>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                            Rejected
                          </span>
                        </div>
                      </div>
                      {selectedActivity.details.rejection_reason && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-600 mb-1">Reason</p>
                          <p className="text-sm text-red-700">{selectedActivity.details.rejection_reason}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Rejected on {formatDate(selectedActivity.details.reviewed_at)}
                      </p>
                    </div>
                  </div>
                )}

                {selectedActivity.type === 'hierarchy_approval_requested' && selectedActivity.details && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Approval Status</h3>
                    <div className="space-y-2">
                      {selectedActivity.details.approvers?.map((approver, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{approver.name}</p>
                            <p className="text-xs text-gray-500">{approver.role}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              approver.status === 'approved' ? 'bg-green-100 text-green-700' :
                              approver.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {approver.status?.charAt(0).toUpperCase() + approver.status?.slice(1)}
                            </span>
                            {approver.decided_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(approver.decided_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-4">
                      <div className="text-center p-2 bg-yellow-50 rounded">
                        <div className="text-sm font-bold text-yellow-700">{selectedActivity.details.pending_count}</div>
                        <div className="text-xs text-gray-500">Pending</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-sm font-bold text-green-700">{selectedActivity.details.approved_count}</div>
                        <div className="text-xs text-gray-500">Approved</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="text-sm font-bold text-red-700">{selectedActivity.details.rejected_count}</div>
                        <div className="text-xs text-gray-500">Rejected</div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedActivity.type === 'hierarchy_approval_decision' && selectedActivity.details && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Your Decision</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Event requested by</p>
                          <p className="font-medium text-gray-900">{selectedActivity.details.host?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Your Decision</p>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedActivity.details.decision === 'approved' ? 'bg-green-100 text-green-700' :
                            selectedActivity.details.decision === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {selectedActivity.details.decision?.charAt(0).toUpperCase() + selectedActivity.details.decision?.slice(1)}
                          </span>
                        </div>
                      </div>
                      {selectedActivity.details.decision_reason && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Reason</p>
                          <p className="text-sm text-gray-700">{selectedActivity.details.decision_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(selectedActivity.type === 'message_sent' || selectedActivity.type === 'message_received') && selectedActivity.details && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Message Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-600">
                            {selectedActivity.type === 'message_sent' ? 'Sent to' : 'Received from'}
                          </p>
                          <p className="font-medium text-gray-900">
                            {selectedActivity.type === 'message_sent' 
                              ? selectedActivity.details.recipient?.name 
                              : selectedActivity.details.sender?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="text-sm font-medium text-gray-900">{selectedActivity.details.type}</p>
                        </div>
                      </div>
                      {selectedActivity.details.event && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Related Event</p>
                          <p className="text-sm text-gray-700">{selectedActivity.details.event.title}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={closeModal}
                className="mt-6 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
