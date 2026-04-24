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
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();

  // Tick every minute so upcoming reminders update live
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  // ── Derived notification lists ──────────────────────────────────────────────

  const todayStr = now.toISOString().split('T')[0];

  const parseMin = (t) => {
    if (!t) return null;
    const [h, m] = t.split(':');
    return parseInt(h) * 60 + parseInt(m || 0);
  };

  // Helper: get event type label
  const getTypeLabel = (event) => {
    if (event.is_personal) return 'Personal Event';
    if (event.event_type === 'meeting') return 'Meeting';
    return 'Event';
  };

  // Pending invitations — show regardless of date, EXCEPT if the event date has already passed
  const pendingInvitations = events.filter(event => {
    if (!event.members?.some(m => m.id === user?.id && m.status === 'pending')) return false;
    // Expire if the event date is in the past
    if (event.date && event.date < todayStr) return false;
    return true;
  });

  // Accepted invitations — only show on the day of the event
  const acceptedInvitations = events.filter(event => {
    if (event.host?.id === user?.id) return false; // not an invitation
    const membership = event.members?.find(m => m.id === user?.id);
    if (!membership || membership.status !== 'accepted') return false;
    return event.date === todayStr; // only today
  });

  // Upcoming reminders — accepted + hosted events today within 60 mins
  const upcomingReminders = (() => {
    const nowMin = now.getHours() * 60 + now.getMinutes();

    return events.filter(event => {
      if (!event.date || !event.time) return false;
      if (event.date !== todayStr) return false;

      const isHost = event.host?.id === user?.id;
      const membership = event.members?.find(m => m.id === user?.id);
      const isAccepted = isHost || membership?.status === 'accepted';
      if (!isAccepted) return false;

      const [h, m] = event.time.split(':');
      const eventMin = parseInt(h) * 60 + parseInt(m || 0);
      const diff = eventMin - nowMin;
      return diff >= 0 && diff <= 60;
    }).map(event => {
      const [h, m] = event.time.split(':');
      const eventMin = parseInt(h) * 60 + parseInt(m || 0);
      const diff = eventMin - (now.getHours() * 60 + now.getMinutes());
      return { ...event, _minsUntil: diff };
    });
  })();

  const unreadMessages = messages.filter(msg => !msg.is_read);
  const totalNotifications = pendingInvitations.length + acceptedInvitations.length + upcomingReminders.length + unreadMessages.length + pendingUsers.length;

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchAllNotifications = () => {
    if (!user?.id) return;
    fetchMessages();
    if (user.role === 'Admin') fetchPendingValidations();
  };

  useEffect(() => {
    if (user?.id) {
      fetchAllNotifications();
      const interval = setInterval(fetchAllNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (isOpen && user?.id) fetchAllNotifications();
  }, [isOpen, user?.id, user?.role]);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/messages');
      setMessages(response.data || []);
    } catch (error) {
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

  // ── Handlers ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && !e.target.closest('.notifications-container')) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (event) => {
    setIsOpen(false);
    if (onNotificationClick) onNotificationClick(event);
    else navigate('/dashboard');
  };

  const handleMessageClick = async (message) => {
    setSelectedMessage(message);
    setIsMessageModalOpen(true);
    setIsOpen(false);
    if (!message.is_read) {
      try {
        await api.post(`/messages/${message.id}/read`);
        setMessages(prev => prev.map(msg => msg.id === message.id ? { ...msg, is_read: true } : msg));
      } catch (error) {
        if (error.response?.status !== 401) console.error('Error marking message as read:', error);
      }
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await api.delete(`/messages/${messageId}`);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setIsMessageModalOpen(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert(error.response?.status === 401 ? 'Session expired.' : 'Failed to delete message.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const diffH = (now - date) / (1000 * 60 * 60);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (diffH < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCountdown = (mins) => {
    if (mins <= 0) return 'Starting now';
    if (mins <= 10) return `In ${mins} min`;
    if (mins <= 30) return `In ${mins} min`;
    return `In ~1 hr`;
  };

  const countdownColor = (mins) => {
    if (mins <= 10) return 'bg-red-100 text-red-800';
    if (mins <= 30) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m || '00'} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────────

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

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-[60] max-w-[calc(100vw-2rem)] sm:max-w-none">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500 mt-1">
                {upcomingReminders.length > 0 && `${upcomingReminders.length} upcoming · `}
                {pendingInvitations.length > 0 && `${pendingInvitations.length} pending · `}
                {acceptedInvitations.length > 0 && `${acceptedInvitations.length} accepted today · `}
                {unreadMessages.length > 0 && `${unreadMessages.length} message${unreadMessages.length !== 1 ? 's' : ''} · `}
                {user?.role === 'Admin' && pendingUsers.length > 0 && `${pendingUsers.length} validation${pendingUsers.length !== 1 ? 's' : ''} · `}
                {totalNotifications === 0 && 'All caught up'}
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

                  {/* ── Upcoming reminders (accepted + hosted events today) ── */}
                  {upcomingReminders.map(event => (
                    <button
                      key={`upcoming-${event.id}`}
                      onClick={() => handleNotificationClick(event)}
                      className="w-full p-4 hover:bg-blue-50/40 transition-colors text-left"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {getTypeLabel(event)} · {event.host?.id === user?.id ? 'Hosting' : 'Accepted'} · {fmtTime(event.time)}
                          </p>
                          {event.location && <p className="text-xs text-gray-400 mt-0.5 truncate">{event.location}</p>}
                        </div>
                        <span className={`flex-shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${countdownColor(event._minsUntil)}`}>
                          {formatCountdown(event._minsUntil)}
                        </span>
                      </div>
                    </button>
                  ))}

                  {/* ── Pending invitations ── */}
                  {pendingInvitations.map(event => (
                    <button
                      key={`pending-${event.id}`}
                      onClick={() => handleNotificationClick(event)}
                      className="w-full p-4 hover:bg-yellow-50/40 transition-colors text-left"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {getTypeLabel(event)} · Invited by {event.host?.username}
                          </p>
                          <div className="flex items-center text-xs text-gray-400 mt-0.5 gap-1.5">
                            <span>{event.date}</span><span>·</span><span>{fmtTime(event.time)}</span>
                          </div>
                        </div>
                        <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </div>
                    </button>
                  ))}

                  {/* ── Accepted invitations ── */}
                  {acceptedInvitations.map(event => (
                    <button
                      key={`accepted-${event.id}`}
                      onClick={() => handleNotificationClick(event)}
                      className="w-full p-4 hover:bg-green-50/40 transition-colors text-left"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {getTypeLabel(event)} · Invited by {event.host?.username}
                          </p>
                          <div className="flex items-center text-xs text-gray-400 mt-0.5 gap-1.5">
                            <span>{event.date}</span><span>·</span><span>{fmtTime(event.time)}</span>
                          </div>
                        </div>
                        <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Accepted
                        </span>
                      </div>
                    </button>
                  ))}

                  {/* ── Decline messages ── */}
                  {messages.map(message => (
                    <button
                      key={`message-${message.id}`}
                      onClick={() => handleMessageClick(message)}
                      className={`w-full p-4 hover:bg-gray-50 transition-colors text-left ${!message.is_read ? 'bg-red-50/30' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">{message.sender.name}</p>
                            {!message.is_read && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {message.type === 'meeting_declined' ? 'Declined meeting: ' : 'Declined: '}
                            {message.event?.title || 'Event'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{message.message}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(message.created_at)}</p>
                        </div>
                        <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          Declined
                        </span>
                      </div>
                    </button>
                  ))}

                  {/* ── Pending user validations (Admin only) ── */}
                  {user?.role === 'Admin' && pendingUsers.map(pendingUser => (
                    <button
                      key={`user-${pendingUser.id}`}
                      onClick={() => { setIsOpen(false); navigate('/admin', { state: { highlightPending: true } }); }}
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
                            <p className="text-sm font-semibold text-gray-900 truncate">{pendingUser.username}</p>
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{pendingUser.email}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Needs validation</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(pendingUser.created_at)}</p>
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
                <button onClick={() => setIsOpen(false)} className="w-full text-center text-xs font-medium text-green-700 hover:text-green-800">
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Decline message detail modal */}
      <Modal isOpen={isMessageModalOpen} onClose={() => { setIsMessageModalOpen(false); setSelectedMessage(null); }} title="Decline Reason" maxWidth="max-w-lg">
        {selectedMessage && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-semibold text-lg">
                {selectedMessage.sender.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedMessage.sender.name}</p>
                <p className="text-sm text-gray-500">{selectedMessage.sender.email}</p>
              </div>
            </div>
            {selectedMessage.event && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Event Details</p>
                <p className="text-base font-semibold text-gray-900">{selectedMessage.event.title}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(selectedMessage.event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Reason for declining:</p>
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">Received {formatDate(selectedMessage.created_at)}</p>
            <div className="pt-4 border-t border-gray-200">
              <button onClick={() => handleDeleteMessage(selectedMessage.id)} className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors">
                Delete Message
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
