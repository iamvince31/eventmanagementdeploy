import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import api from '../services/api';
import logo from "../assets/CvSU Logo.png";

export default function Navbar({
  isLoading = false,
  pageTitle = "Dashboard",
  onNotificationClick = null,
  refreshTrigger = 0,
  events: eventsProp = null,  // optional — Dashboard passes its already-loaded events
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [fetchedEvents, setFetchedEvents] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use prop events if provided, otherwise use internally fetched events
  const events = eventsProp !== null ? eventsProp : fetchedEvents;

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) fetchEvents();
  }, [refreshTrigger]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAccountDropdownOpen && !event.target.closest('.account-dropdown-container')) {
        setIsAccountDropdownOpen(false);
      }
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAccountDropdownOpen, isMobileMenuOpen]);

  const fetchEvents = async () => {
    // Only fetch if no events were passed as prop
    if (eventsProp !== null) return;
    try {
      const response = await api.get('/events');
      setFetchedEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 shadow-lg sticky top-0 z-20" aria-label="Main navigation">
        <div className="w-full px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left corner - Logo and Title */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 min-w-0">
              <button
                onClick={() => navigate('/dashboard')}
                disabled={isLoading}
                className={`focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg transition-all flex-shrink-0 ${isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:opacity-80'}`}
                aria-label="Go to dashboard"
              >
                <img
                  src={logo}
                  alt="CvSU Logo"
                  className="h-10 w-auto cursor-pointer"
                />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight truncate">Event Management</h1>
                <p className="text-xs text-green-200 font-medium hidden sm:block">{pageTitle}</p>
              </div>
            </div>

            {/* Right corner - Desktop Icons (hidden on mobile) */}
            <div className="hidden sm:flex items-center space-x-4">
              {/* Home Icon - Desktop */}
              <button
                onClick={() => navigate('/dashboard')}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-colors duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-white/10'}`}
                aria-label="Go to dashboard"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>

              {/* Organizational Chart Icon */}
              <button
                onClick={() => navigate('/organizational-chart')}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-colors duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-white/10'}`}
                aria-label="View organizational chart"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </button>

              {/* History Icon - Desktop */}
              <button
                onClick={() => navigate('/history')}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-colors duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-white/10'}`}
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
                  onNotificationClick={onNotificationClick || ((event) => navigate('/dashboard', { state: { viewEvent: event } }))}
                  isDisabled={isLoading}
                />
              </div>

              {/* Admin Panel Icon - Only for Admin users */}
              {user?.role === 'Admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  disabled={isLoading}
                  className={`p-2 rounded-lg transition-colors duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-white/10'}`}
                  aria-label="Admin panel"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </button>
              )}

              {/* Account Dropdown - Desktop */}
              <div className="relative account-dropdown-container">
                <button
                  onClick={() => !isLoading && setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  disabled={isLoading}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-white/10'}`}
                  aria-label="Account menu"
                >
                  {user?.profile_picture ? (
                    <img src={user.profile_picture} alt={user?.username} className="w-10 h-10 rounded-full object-cover border-2 border-white/30" />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-green-300 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-white hidden sm:block">{user?.username}</span>
                  <svg className={`w-4 h-4 text-white transition-transform duration-200 ${isAccountDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isAccountDropdownOpen && !isLoading && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="py-1">
                      <button
                        onClick={() => { setIsAccountDropdownOpen(false); navigate('/account'); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Settings</span>
                      </button>

                      {user?.role === 'Admin' && (
                        <>
                          <div className="border-t border-gray-100"></div>
                          <button
                            onClick={() => { setIsAccountDropdownOpen(false); navigate('/archive'); }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 transition-colors flex items-center space-x-3"
                          >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            <span className="font-medium">Archive</span>
                          </button>
                        </>
                      )}

                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={async () => { setIsAccountDropdownOpen(false); await logout(); }}
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

            {/* Mobile Menu Button */}
            <div className="sm:hidden flex items-center space-x-2">
              {/* Notifications Bell - Mobile */}
              <div className="relative">
                <NotificationBell
                  events={events}
                  user={user}
                  onNotificationClick={onNotificationClick || ((event) => navigate('/dashboard', { state: { viewEvent: event } }))}
                  isDisabled={isLoading}
                />
              </div>

              {/* Admin Panel Icon - Mobile - Only for Admin users */}
              {user?.role === 'Admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  disabled={isLoading}
                  className={`p-2 rounded-lg transition-colors duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-white/10'}`}
                  aria-label="Admin panel"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </button>
              )}

              {/* Hamburger Menu */}
              <div className="relative mobile-menu-container">
                <button
                  onClick={() => !isLoading && setIsMobileMenuOpen(!isMobileMenuOpen)}
                  disabled={isLoading}
                  className={`p-2 rounded-lg transition-colors duration-200 ${isLoading
                      ? 'opacity-50 cursor-not-allowed pointer-events-none'
                      : 'hover:bg-white/10'
                    }`}
                  aria-label="Menu"
                  aria-disabled={isLoading}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && !isLoading && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="py-1">
                      {/* Home */}
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigate('/dashboard');
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="font-medium">Home</span>
                      </button>

                      {/* Organizational Chart */}
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigate('/organizational-chart');
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="font-medium">Organizational Chart</span>
                      </button>

                      {/* History */}
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigate('/history');
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">History</span>
                      </button>

                      <div className="border-t border-gray-100"></div>

                      {/* Settings */}
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
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

                      {/* Archive - Only for admin users */}
                      {user?.role === 'Admin' && (
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            navigate('/archive');
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 transition-colors flex items-center space-x-3"
                        >
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                          <span className="font-medium">Archive</span>
                        </button>
                      )}

                      <div className="border-t border-gray-100"></div>

                      {/* Logout */}
                      <button
                        onClick={async () => {
                          setIsMobileMenuOpen(false);
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


    </>
  );
}
