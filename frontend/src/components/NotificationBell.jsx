import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from './Modal';

export default function NotificationBell({ events, user, onNotificationClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const navigate = useNavigate();

  // Get pending invitations count
  const pendingInvitations = events.filter(event => 
    event.members && 
    event.members.some(member => member.id === user?.id && member.status === 'pending')
  );

  // Fetch messages with debouncing
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        fetchMessages();
        // Fetch pending validations if user is admin
        if (user.role === 'Admin') {
          fetchPendingValidations();
        }
      }, 500); // Debounce by 500ms
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/messages');
      setMessages(response.data || []);
    } catch (error) {
      // Silently handle error - messages endpoint may not exist (405 Method Not Allowed)
      // Only log non-auth and non-405 errors
      if (error.response?.status !== 401 && error.response?.status !== 405) {
        console.error('Error fetching messages:', error);
      }
      setMessages([]);
    }
  };

  const fetchPendingValidations = async () => {
    try {
      const response = await api.get('/users/pending-validation');
      setPendingUsers(response.data.pending_users || []);
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Error fetching pending validations:', error);
      }
    }
  };

  // Get unread messages count
  const unreadMessages = messages.filter(msg => !msg.is_read);
  const totalNotifications = pendingInvitations.length + unreadMessages.length + pendingUsers.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.notifications-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (event) => {
    setIsOpen(false);
    if (onNotificationClick) {
      onNotificationClick(event);
    } else {
      navigate('/dashboard');
    }
  };

  const handleMessageClick = async (message) => {
    setSelectedMessage(message);
    setIsMessageModalOpen(true);
    setIsOpen(false);

    // Mark as read (but don't refetch immediately to avoid UI flicker)
    if (!message.is_read) {
      try {
        await api.post(`/messages/${message.id}/read`);
        // Update local state instead of refetching
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === message.id ? { ...msg, is_read: true } : msg
          )
        );
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error('Error marking message as read:', error);
        }
      }
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await api.delete(`/messages/${messageId}`);
      // Remove from local state
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
      setIsMessageModalOpen(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      if (error.response?.status === 401) {
        alert('Session expired. Please log in again.');
      } else {
        alert('Failed to delete message. Please try again.');
      }
    }
  };

  const handleCloseMessageModal = () => {
    // Only close the modal, do NOT delete the message
    setIsMessageModalOpen(false);
    setSelectedMessage(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      <div className="relative notifications-container">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-white hover:bg-green-600 rounded-lg transition-colors duration-200"
          aria-label="Notifications"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {totalNotifications > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-green-700">
              {totalNotifications}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-[60] max-w-[calc(100vw-2rem)] sm:max-w-none">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500 mt-1">
                {pendingInvitations.length} invitation{pendingInvitations.length !== 1 ? 's' : ''}, {unreadMessages.length} message{unreadMessages.length !== 1 ? 's' : ''}{user?.role === 'Admin' ? `, ${pendingUsers.length} pending validation${pendingUsers.length !== 1 ? 's' : ''}` : ''}
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {totalNotifications === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm text-gray-500">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* Pending Invitations */}
                  {pendingInvitations.map(event => (
                    <button
                      key={`event-${event.id}`}
                      onClick={() => handleNotificationClick(event)}
                      className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Invited by {event.host.username}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {event.date}
                            </span>
                            <span>•</span>
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {event.time}
                            </span>
                          </div>
                        </div>
                        <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </div>
                    </button>
                  ))}

                  {/* Messages */}
                  {messages.map(message => (
                    <button
                      key={`message-${message.id}`}
                      onClick={() => handleMessageClick(message)}
                      className={`w-full p-4 hover:bg-gray-50 transition-colors text-left ${
                        !message.is_read ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {message.sender.name}
                            </p>
                            {!message.is_read && (
                              <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Declined: {message.event?.title || 'Event'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {message.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(message.created_at)}</p>
                        </div>
                        <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          Declined
                        </span>
                      </div>
                    </button>
                  ))}

                  {/* Pending User Validations (Admin Only) */}
                  {user?.role === 'Admin' && pendingUsers.map(pendingUser => (
                    <button
                      key={`user-${pendingUser.id}`}
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/admin', { state: { highlightPending: true } });
                      }}
                      className="w-full p-4 hover:bg-gray-50 transition-colors text-left bg-blue-50/30"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {pendingUser.username}
                            </p>
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {pendingUser.email}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Needs validation
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(pendingUser.created_at)}</p>
                        </div>
                        <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          New User
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {totalNotifications > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center text-xs font-medium text-green-700 hover:text-green-800"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      <Modal
        isOpen={isMessageModalOpen}
        onClose={handleCloseMessageModal}
        title="Decline Reason"
        maxWidth="max-w-lg"
      >
        {selectedMessage && (
          <div className="space-y-4">
            {/* Sender Info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-semibold text-lg">
                {selectedMessage.sender.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedMessage.sender.name}</p>
                <p className="text-sm text-gray-500">{selectedMessage.sender.email}</p>
              </div>
            </div>

            {/* Event Info */}
            {selectedMessage.event && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Event Details</p>
                <p className="text-base font-semibold text-gray-900">{selectedMessage.event.title}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(selectedMessage.event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {/* Decline Reason */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Reason for declining:</p>
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
            </div>

            {/* Timestamp */}
            <p className="text-xs text-gray-500 text-center">
              Received {formatDate(selectedMessage.created_at)}
            </p>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => handleDeleteMessage(selectedMessage.id)}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete Message
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
