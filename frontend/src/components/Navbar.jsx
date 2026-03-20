import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import api from '../services/api';
import logo from "../assets/CvSU Logo.png";

export default function Navbar({
  isLoading = false
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchMembers();
  }, []);

  // Fetch members when modal opens
  useEffect(() => {
    if (isMembersModalOpen && members.length === 0) {
      fetchMembers();
    }
  }, [isMembersModalOpen]);

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
    try {
      const response = await api.get('/events');
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      setIsFetchingMembers(true);
      const response = await api.get('/users');
      setMembers(response.data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsFetchingMembers(false);
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
                <p className="text-xs text-green-200 font-medium hidden sm:block">Dashboard</p>
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

              {/* Members Icon */}
              <button
                onClick={() => setIsMembersModalOpen(true)}
                disabled={isLoading || isFetchingMembers}
                className={`relative p-2 rounded-lg transition-colors duration-200 ${isLoading || isFetchingMembers ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-white/10 cursor-pointer'}`}
                aria-label="View members"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {members.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {members.length}
                  </span>
                )}
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
                  onNotificationClick={(event) => navigate('/dashboard', { state: { viewEvent: event } })}
                  isDisabled={isLoading}
                />
              </div>

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
                            onClick={() => { setIsAccountDropdownOpen(false); navigate('/admin'); }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center space-x-3"
                          >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="font-medium">Admin Panel</span>
                          </button>
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
                  onNotificationClick={(event) => navigate('/dashboard', { state: { viewEvent: event } })}
                  isDisabled={isLoading}
                />
              </div>

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

                      {/* Members */}
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsMembersModalOpen(true);
                        }}
                        disabled={isFetchingMembers}
                        className={`w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors flex items-center space-x-3 ${isFetchingMembers ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Members</span>
                        {members.length > 0 && (
                          <span className="ml-auto bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {members.length}
                          </span>
                        )}
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

                      {/* Admin Panel Link - Only for admin users */}
                      {user?.role === 'Admin' && (
                        <>
                          <button
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              navigate('/admin');
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center space-x-3"
                          >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="font-medium">Admin Panel</span>
                          </button>
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
                        </>
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

      {/* Members Modal */}
      {isMembersModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">All Members</h2>
              <button onClick={() => setIsMembersModalOpen(false)} className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {isFetchingMembers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-green-600 mx-auto mb-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500">Loading members...</p>
                  </div>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gray-500 text-lg">No members found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600 mb-4">Total members: {members.length}</p>
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between bg-gray-50 hover:bg-green-50 rounded-xl p-4 transition-colors border border-gray-200 hover:border-green-300">
                      <div className="flex items-center space-x-3">
                        {member.profile_picture ? (
                          <img src={member.profile_picture} alt={member.username} className="w-12 h-12 rounded-full object-cover border-2 border-green-200" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{member.username}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                          {member.department && <p className="text-xs text-gray-400">{member.department}</p>}
                          {member.role && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              {member.role}
                            </span>
                          )}
                        </div>
                      </div>
                      {member.id === user?.id && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">You</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
