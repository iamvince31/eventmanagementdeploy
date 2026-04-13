import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import api from '../services/api';

const MEMBERS_PER_PAGE = 5;

export default function EventDetailModal({ isOpen, onClose, event, currentUser, userSchedules = [], allEvents = [], onEdit, onDelete, onRespond }) {
  const [isMembersDropdownOpen, setIsMembersDropdownOpen] = useState(false);
  const [membersPage, setMembersPage] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [responding, setResponding] = useState(false);
  const [localStatus, setLocalStatus] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 });

  useEffect(() => {
    setLocalStatus(null);
    setMembersPage(1);
    setIsMembersDropdownOpen(false);
    setCurrentImageIndex(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [event?.id, isOpen]);

  // Reset zoom/pan when switching images
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentImageIndex]);

  const getFixedImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${url.startsWith('/') ? url : '/' + url}`;
  };
  const getImageUrl = (image) => getFixedImageUrl(typeof image === 'string' ? image : image?.url);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    setZoom(z => {
      const next = Math.min(5, Math.max(1, z + delta));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDoubleClick = () => {
    if (zoom > 1) { setZoom(1); setPan({ x: 0, y: 0 }); }
    else setZoom(2.5);
  };

  const handleClose = () => {
    setIsMembersDropdownOpen(false);
    setMembersPage(1);
    setCurrentImageIndex(0);
    setResponding(false);
    setLocalStatus(null);
    onClose();
  };

  const handleRespond = async (status) => {
    setResponding(true);
    try {
      await api.post(`/events/${event.id}/respond`, { status });
      setLocalStatus(status);
      onRespond?.();
    } catch (error) {
      alert('Failed to respond: ' + (error.response?.data?.error || error.message));
    } finally {
      setResponding(false);
    }
  };

  if (!event) return null;

  const myMembership = event.members?.find(m => m.id === currentUser?.id);
  const isHost = currentUser?.id === event.host?.id;
  const isInvited = !!myMembership && !isHost;
  const hasImages = event.images && event.images.length > 0;
  const effectiveStatus = localStatus ?? myMembership?.status;
  const totalMembers = event.members?.length || 0;
  const totalPages = Math.ceil(totalMembers / MEMBERS_PER_PAGE);
  const pagedMembers = event.members?.slice((membersPage - 1) * MEMBERS_PER_PAGE, membersPage * MEMBERS_PER_PAGE) || [];

  // Compute schedule conflicts for this event
  const conflictingSchedules = (() => {
    if (!event.date || !event.time || event.time === 'All Day' || event.is_default_event) return [];
    if (!userSchedules.length) return [];

    // Parse date as local time (avoid UTC offset shifting the day)
    const [year, month, day] = event.date.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[eventDate.getDay()];

    const parseMin = (t) => {
      if (!t) return null;
      const parts = t.split(':');
      return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
    };

    // Strip seconds if present (e.g. "16:51:00" → "16:51")
    const rawTime = event.time.length > 5 ? event.time.substring(0, 5) : event.time;
    const evStart = parseMin(rawTime);
    if (evStart === null) return [];
    const evEnd = evStart + 60;

    return userSchedules.filter(s => {
      if (s.day !== dayName) return false;
      const sStart = parseMin(s.start_time);
      const sEnd = parseMin(s.end_time);
      if (sStart === null || sEnd === null) return false;
      return evStart < sEnd && sStart < evEnd;
    });
  })();

  const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m || '00'} ${ampm}`;
  };

  // Compute event-vs-event conflicts (other events on the same day that overlap)
  const conflictingEvents = (() => {
    if (!event.date || !event.time || event.time === 'All Day' || event.is_default_event) return [];
    if (!allEvents.length) return [];

    const parseMin = (t) => {
      if (!t) return null;
      const raw = t.length > 5 ? t.substring(0, 5) : t;
      const [h, m] = raw.split(':');
      return parseInt(h) * 60 + parseInt(m || 0);
    };

    const rawTime = event.time.length > 5 ? event.time.substring(0, 5) : event.time;
    const evStart = parseMin(rawTime);
    if (evStart === null) return [];
    const evEnd = evStart + 60;

    return allEvents.filter(other => {
      if (other.id === event.id) return false;           // skip self
      if (other.date !== event.date) return false;       // different day
      if (!other.time || other.time === 'All Day') return false;
      const otherStart = parseMin(other.time);
      if (otherStart === null) return false;
      const otherEnd = otherStart + 60;
      return evStart < otherEnd && otherStart < evEnd;
    });
  })();

  const colorDot = event.is_default_event || !event.time ? 'bg-blue-500'
    : event.is_personal ? 'bg-purple-500'
    : event.event_type === 'meeting'
      ? (isHost ? 'bg-amber-800' : 'bg-yellow-500')
      : (isHost ? 'bg-red-500' : 'bg-green-500');

  const currentFile = event.images?.[currentImageIndex];
  const currentFileUrl = currentFile ? getImageUrl(currentFile) : '';
  const isPdf = currentFileUrl.toLowerCase().endsWith('.pdf');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Event Details" maxWidth="max-w-5xl">
      {/* Two-col when images, single col otherwise */}
      <div className={hasImages
        ? 'flex flex-col lg:flex-row lg:gap-8'
        : 'max-w-2xl mx-auto space-y-5'
      }>

        {/* ── Details column ── */}
        <div className={`space-y-5 ${hasImages ? 'lg:w-[42%] flex-shrink-0' : ''}`}>

          {/* Title + color dot + edit/delete */}
          <div className="text-center">
            <div className="flex items-start justify-center gap-2 mb-2 flex-wrap">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-2 ${colorDot}`} />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words flex-1 min-w-0">{event.title}</h3>
              {isHost && !event.is_default_event && (
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { handleClose(); onEdit?.(event); }}
                    className="p-1.5 sm:p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Edit">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => { handleClose(); onDelete?.(event); }}
                    className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <p className="text-gray-500 flex items-center justify-center text-sm sm:text-base gap-1.5">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="break-words">
                {event.end_date
                  ? `${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : `${event.date} at ${event.time}`}
              </span>
            </p>
          </div>

          {/* Schedule Conflict Banner */}
          {conflictingSchedules.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-800 mb-1">
                    Schedule Conflict — {event.is_personal ? 'This personal event' : isHost ? 'You are hosting this' : 'You are invited to this'} {event.is_personal ? '' : event.event_type === 'meeting' ? 'meeting' : 'event'} overlaps with your class
                  </p>
                  <div className="space-y-1">
                    {conflictingSchedules.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-red-700">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color || '#f97316' }} />
                        <span className="font-medium">{s.description || s.title || 'Class'}</span>
                        <span className="text-red-500">·</span>
                        <span>{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Event-vs-Event Conflict Banner */}
          {conflictingEvents.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 sm:p-4">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-orange-800 mb-1">
                    Event Conflict — This overlaps with {conflictingEvents.length} other {conflictingEvents.length === 1 ? 'event' : 'events'} on the same day
                  </p>
                  <div className="space-y-1">
                    {conflictingEvents.map((other, i) => {
                      const isOtherPersonal = other.is_personal;
                      const isOtherMeeting = other.event_type === 'meeting';
                      const isOtherHosted = other.host?.id === currentUser?.id;
                      const typeLabel = isOtherPersonal ? 'Personal' : isOtherMeeting ? 'Meeting' : 'Event';
                      const roleLabel = isOtherPersonal ? '' : isOtherHosted ? ' · Hosting' : ' · Invited';
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs text-orange-700">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isOtherPersonal ? 'bg-purple-500'
                            : isOtherMeeting ? (isOtherHosted ? 'bg-amber-800' : 'bg-yellow-500')
                            : (isOtherHosted ? 'bg-red-500' : 'bg-green-500')
                          }`} />
                          <span className="font-medium truncate">{other.title}</span>
                          <span className="text-orange-400">·</span>
                          <span className="flex-shrink-0">{fmtTime(other.time)}</span>
                          <span className="text-orange-400 flex-shrink-0">·</span>
                          <span className="flex-shrink-0 text-orange-600">{typeLabel}{roleLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm mb-0.5">Location</p>
                <p className="text-gray-600 text-sm break-words">{event.location}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <p className="font-semibold text-gray-900 text-sm mb-1.5">Description</p>
              <p className="text-gray-600 leading-relaxed text-sm break-words">{event.description}</p>
            </div>
          )}

          {/* Host */}
          {event.host && (
            <div className="bg-green-50 rounded-xl p-3 sm:p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-base flex-shrink-0">
                {(event.host.username || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm break-words">Hosted by {event.host.username}</p>
                <p className="text-gray-500 text-xs break-all">{event.host.email}</p>
              </div>
            </div>
          )}

          {/* Members dropdown */}
          {event.members && event.members.length > 0 && (
            <div>
              <button onClick={() => setIsMembersDropdownOpen(!isMembersDropdownOpen)}
                className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-xl p-3 sm:p-4 transition-colors touch-manipulation">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="bg-green-100 rounded-lg p-2 flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">Invited Members</p>
                    <p className="text-xs text-gray-500">{event.members.length} member{event.members.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex -space-x-2">
                    {event.members.slice(0, 3).map((m, i) => (
                      <div key={m.id} className="w-7 h-7 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-green-700 font-bold text-xs" style={{ zIndex: 10 - i }}>
                        {(m.username || m.name || '?').charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {event.members.length > 3 && (
                      <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-600 font-bold text-xs">
                        +{event.members.length - 3}
                      </div>
                    )}
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isMembersDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isMembersDropdownOpen && (
                <div className="mt-2 space-y-1.5">
                  {pagedMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0">
                          {(member.username || member.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{member.username || member.name}</p>
                          <p className="text-xs text-gray-500 truncate">{member.email}</p>
                        </div>
                      </div>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                        member.status === 'accepted' ? 'bg-green-100 text-green-800'
                        : member.status === 'declined' ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {member.status === 'accepted' ? '✔ Accepted' : member.status === 'declined' ? '✘ Declined' : '⏳ Pending'}
                      </span>
                    </div>
                  ))}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-1 px-1">
                      <button onClick={() => setMembersPage(p => Math.max(1, p - 1))} disabled={membersPage === 1}
                        className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        ← Prev
                      </button>
                      <span className="text-xs text-gray-500">{membersPage} / {totalPages}</span>
                      <button onClick={() => setMembersPage(p => Math.min(totalPages, p + 1))} disabled={membersPage === totalPages}
                        className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Accept / Decline / Cancel */}
          {isInvited && (
            <div className="pt-4 border-t border-gray-200">
              {effectiveStatus === 'pending' || !effectiveStatus ? (
                <div className="flex gap-3">
                  <button disabled={responding} onClick={() => handleRespond('accepted')}
                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors touch-manipulation">
                    {responding ? '...' : '✔ Accept'}
                  </button>
                  <button disabled={responding} onClick={() => handleRespond('declined')}
                    className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 disabled:opacity-50 transition-colors touch-manipulation">
                    {responding ? '...' : '✘ Decline'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className={`flex-1 inline-flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold ${
                    effectiveStatus === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {effectiveStatus === 'accepted' ? '✔ You accepted' : '✘ You declined'}
                  </span>
                  <button disabled={responding} onClick={() => handleRespond('pending')}
                    className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors touch-manipulation">
                    {responding ? '...' : 'Cancel'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Files column (only when images exist) ── */}
        {hasImages && (
          <div className="flex-1 min-w-0 space-y-3">
            <p className="font-semibold text-gray-900 text-sm sm:text-base">
              Event Files <span className="text-gray-400 font-normal">({event.images.length})</span>
            </p>

            {/* Main viewer */}
            <div className="relative bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden" style={{ minHeight: '280px' }}>
              <div className="relative w-full h-64 sm:h-80 lg:h-96 bg-white">
                {isPdf ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 p-4">
                    <svg className="w-16 h-16 sm:w-20 sm:h-20 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-700 font-medium text-sm mb-1">PDF Document</p>
                    <p className="text-xs text-gray-500 mb-4 text-center break-all px-4">
                      {currentFile?.original_filename || decodeURIComponent(currentFileUrl.split('/').pop())}
                    </p>
                    <div className="flex gap-2">
                      <a href={currentFileUrl} target="_blank" rel="noopener noreferrer"
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        Open
                      </a>
                      <a href={currentFileUrl} download={currentFile?.original_filename}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download
                      </a>
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-full h-full overflow-hidden"
                    style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onDoubleClick={handleDoubleClick}
                  >
                    <img
                      src={currentFileUrl}
                      alt={`${event.title} ${currentImageIndex + 1}`}
                      draggable={false}
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.15s ease',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        userSelect: 'none',
                      }}
                    />
                    {zoom > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded-full transition-colors"
                        title="Reset zoom"
                      >
                        ✕ Reset
                      </button>
                    )}
                    {zoom === 1 && (
                      <div className="absolute bottom-2 left-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none">
                        Scroll or double-click to zoom
                      </div>
                    )}
                  </div>
                )}

                {/* Prev / Next arrows */}
                {event.images.length > 1 && (
                  <>
                    <button onClick={() => setCurrentImageIndex(p => p === 0 ? event.images.length - 1 : p - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors touch-manipulation" aria-label="Previous">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={() => setCurrentImageIndex(p => p === event.images.length - 1 ? 0 : p + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors touch-manipulation" aria-label="Next">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                      {currentImageIndex + 1} / {event.images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Horizontal thumbnail strip below the main image */}
              {event.images.length > 1 && (
                <div className="flex gap-2 p-2 overflow-x-auto bg-gray-50 border-t border-gray-100">
                  {event.images.map((image, index) => {
                    const imgUrl = getImageUrl(image);
                    const thumbIsPdf = imgUrl.toLowerCase().endsWith('.pdf');
                    return (
                      <button key={index} onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors touch-manipulation ${index === currentImageIndex ? 'border-green-500' : 'border-gray-200 hover:border-gray-400'}`}
                        title={thumbIsPdf ? (image?.original_filename || 'PDF') : `Image ${index + 1}`}>
                        {thumbIsPdf ? (
                          <div className="w-full h-full flex items-center justify-center bg-red-50">
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                        ) : (
                          <img src={imgUrl} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
