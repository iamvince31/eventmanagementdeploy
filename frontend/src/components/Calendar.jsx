import { useState } from 'react';

export default function Calendar({ events, defaultEvents = [], onDateSelect, highlightedDate, currentUser, onEditEvent, onDeleteEvent }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [moreModalDate, setMoreModalDate] = useState(null);
  const [moreModalEvents, setMoreModalEvents] = useState([]);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate date boundaries: 2 months in the past, 1 year in the future
  const today = new Date();
  const minDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const maxDate = new Date(today.getFullYear() + 1, today.getMonth(), 0);

  const currentMonthDate = new Date(year, month, 1);
  const isAtMinDate = currentMonthDate <= minDate;
  const isAtMaxDate = currentMonthDate >= maxDate;

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    if (newDate >= minDate) {
      setCurrentDate(newDate);
    }
  };

  const nextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    if (newDate <= maxDate) {
      setCurrentDate(newDate);
    }
  };

  const getEventsForDate = (dateStr) => {
    return events.filter(event => event.date === dateStr);
  };

  const getDefaultEventsForDate = (dateStr) => {
    return defaultEvents.filter(event => {
      if (!event.date) return false;
      
      const eventStartDate = new Date(event.date);
      const checkDate = new Date(dateStr);
      
      if (!event.end_date) {
        return eventStartDate.toDateString() === checkDate.toDateString();
      }
      
      const eventEndDate = new Date(event.end_date);
      const isInRange = checkDate >= eventStartDate && checkDate <= eventEndDate;
      
      if (isInRange) {
        const dayOfWeek = checkDate.getDay();
        return dayOfWeek !== 0;
      }
      
      return false;
    });
  };

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    const regularEvents = getEventsForDate(dateStr);
    
    if (onDateSelect) {
      onDateSelect(dateStr, regularEvents);
    }
  };

  const handleMoreClick = (e, dateStr) => {
    e.stopPropagation();
    const regularEvents = getEventsForDate(dateStr);
    const academicEvents = getDefaultEventsForDate(dateStr);
    
    setMoreModalDate(dateStr);
    setMoreModalEvents([...academicEvents, ...regularEvents]);
    setShowMoreModal(true);
  };

  const formatTime = (time) => {
    if (!time || time === 'All Day') return 'All Day';
    
    // Parse time (assuming format like "14:00" or "2:00 PM")
    const [hours] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour}${ampm}`;
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEventDetailModal(true);
    setShowMoreModal(false);
  };

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const prevMonthNum = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonthNum + 1, 0).getDate();

    const nextMonthNum = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    // Calculate if we need 5 or 6 rows
    const totalDaysNeeded = firstDayOfMonth + daysInMonth;
    const rowsNeeded = Math.ceil(totalDaysNeeded / 7);
    const totalCells = rowsNeeded * 7;

    for (let i = 0; i < totalCells; i++) {
      let cellDay, cellMonth, cellYear, isCurrentMonth;

      if (i < firstDayOfMonth) {
        cellDay = daysInPrevMonth - (firstDayOfMonth - 1 - i);
        cellMonth = prevMonthNum;
        cellYear = prevYear;
        isCurrentMonth = false;
      } else if (i < firstDayOfMonth + daysInMonth) {
        cellDay = i - firstDayOfMonth + 1;
        cellMonth = month;
        cellYear = year;
        isCurrentMonth = true;
      } else {
        cellDay = i - firstDayOfMonth - daysInMonth + 1;
        cellMonth = nextMonthNum;
        cellYear = nextYear;
        isCurrentMonth = false;
      }

      const cellDate = new Date(cellYear, cellMonth, cellDay);
      cellDate.setHours(0, 0, 0, 0);
      const isSunday = cellDate.getDay() === 0;

      const isCurrentDay = (
        cellDay === today.getDate() &&
        cellMonth === today.getMonth() &&
        cellYear === today.getFullYear()
      );

      const dateStr = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(cellDay).padStart(2, '0')}`;
      const selected = selectedDate === dateStr;
      const highlighted = highlightedDate === dateStr;

      // Get events for this date (only for current month to avoid confusion)
      const academicEvents = isCurrentMonth ? getDefaultEventsForDate(dateStr) : [];
      const regularEvents = isCurrentMonth ? getEventsForDate(dateStr) : [];
      const allEvents = [...academicEvents, ...regularEvents];

      // Display limit: show first 2 items (academic events + regular events)
      const displayLimit = 2;

      days.push(
        <div
          key={`${cellYear}-${cellMonth}-${cellDay}`}
          onClick={() => {
            if (isCurrentMonth && !isSunday) {
              handleDateClick(dateStr);
            }
          }}
          className={`
            h-full p-1.5 border border-gray-200 -ml-[1px] -mt-[1px] transition-all duration-200 relative group flex flex-col
            ${isCurrentMonth 
              ? `${isSunday ? 'cursor-not-allowed bg-gray-50' : 'cursor-default bg-white'}`
              : 'bg-gray-50/50'
            }
            ${selected ? 'ring-2 ring-blue-500 ring-inset z-10' : ''}
            ${highlighted ? 'ring-2 ring-green-400 animate-pulse z-10' : ''}
          `}
        >
          {/* Date Number - Always show */}
          <div className="flex justify-between items-start mb-1 flex-shrink-0">
            <span className={`
              text-xs font-semibold px-1.5 py-0.5 rounded-full
              ${isCurrentDay 
                ? 'bg-blue-600 text-white shadow-sm' 
                : isCurrentMonth 
                  ? 'text-gray-800' 
                  : 'text-gray-400'
              }
            `}>
              {cellDay}
            </span>
          </div>

          {/* Events List - Only for current month */}
          {isCurrentMonth && !isSunday && (
            <div className="flex-1 space-y-1.5 overflow-hidden">
              {/* Academic Events (Green Labels) - Clickable */}
              {academicEvents.slice(0, displayLimit).map((event, idx) => (
                <div
                  key={`academic-${idx}`}
                  className="text-sm px-2.5 py-1.5 bg-green-600 text-white rounded-md truncate font-normal shadow-md cursor-pointer hover:bg-green-700 transition-colors"
                  title={event.name}
                  onClick={(e) => handleEventClick(event, e)}
                >
                  {event.name}
                </div>
              ))}

              {/* Regular Events (Colored Dots) */}
              {regularEvents.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1 flex-1 items-start relative">
                  {regularEvents.slice(0, 3).map((event, idx) => {
                    const isHosted = currentUser && event.host && event.host.id === currentUser.id;
                    const isPersonal = event.is_personal;
                    const isMeeting = event.event_type === 'meeting';
                    
                    return (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full ${
                          isPersonal
                            ? 'bg-purple-500'
                            : isMeeting
                              ? (isHosted ? 'bg-amber-800' : 'bg-yellow-500')
                              : (isHosted ? 'bg-red-500' : 'bg-green-500')
                        }`}
                        title={`${event.title} ${isPersonal ? '(Personal)' : isMeeting ? (isHosted ? '(Hosting Meeting)' : '(Invited to Meeting)') : (isHosted ? '(Hosting Event)' : '(Invited to Event)')}`}
                      />
                    );
                  })}
                  {regularEvents.length > 3 && (
                    <span className="text-[10px] text-gray-600 font-semibold bg-gray-100 px-1.5 py-0.5 rounded-full">
                      +{regularEvents.length - 3}
                    </span>
                  )}
                  
                  {/* Hover Tooltip for Event Titles */}
                  {regularEvents.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20 w-56">
                      <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl">
                        <div className="font-semibold mb-1.5 text-green-300 border-b border-gray-700 pb-1">
                          {regularEvents.length} Event{regularEvents.length !== 1 ? 's' : ''}
                        </div>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {regularEvents.map((event, idx) => {
                            const isHosted = currentUser && event.host && event.host.id === currentUser.id;
                            const isMeeting = event.event_type === 'meeting';
                            const isPersonal = event.is_personal;
                            return (
                              <div key={idx} className="flex items-start gap-2">
                                <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                                  isPersonal
                                    ? 'bg-purple-400'
                                    : isMeeting
                                      ? (isHosted ? 'bg-amber-700' : 'bg-yellow-400')
                                      : (isHosted ? 'bg-red-400' : 'bg-green-400')
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{event.title}</div>
                                  <div className="text-gray-400 text-[10px]">
                                    {event.time} • {isPersonal ? 'Personal Event' : isMeeting ? (isHosted ? 'Hosting Meeting' : 'Invited to Meeting') : (isHosted ? 'Hosting Event' : 'Invited to Event')}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* "View More" button - only show when total events > 2 */}
              {allEvents.length > displayLimit && (
                <button
                  onClick={(e) => handleMoreClick(e, dateStr)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold px-1 hover:underline transition-colors"
                >
                  View More ({allEvents.length})
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 h-full flex flex-col">
        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-3 flex-shrink-0">
          <button
            onClick={prevMonth}
            disabled={isAtMinDate}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              isAtMinDate
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-gray-900 font-display tracking-tight">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            disabled={isAtMaxDate}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              isAtMaxDate
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-0 mb-0 flex-shrink-0 border-b border-gray-200">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div
              key={day}
              className="text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider py-1.5"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 flex-1 min-h-0">
          {renderCalendarDays()}
        </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-400"></div>
            <span className="text-gray-600 font-medium">Academic Event</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-gray-600 font-medium">Hosting Event</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-gray-600 font-medium">Invited to Event</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-800"></div>
            <span className="text-gray-600 font-medium">Hosting Meeting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span className="text-gray-600 font-medium">Invited to Meeting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span className="text-gray-600 font-medium">Personal Event</span>
          </div>
        </div>
      </div>
    </div>

      {/* Event Detail Modal */}
      {showMoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header - Day and Date */}
            <div className="bg-gray-100 px-6 pt-6 pb-4 flex flex-col items-center relative">
              {/* Close Button */}
              <button
                onClick={() => setShowMoreModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Day of Week */}
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                {new Date(moreModalDate).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
              </div>
              
              {/* Date Number */}
              <div className="text-6xl font-normal text-gray-800 mb-4">
                {new Date(moreModalDate).getDate()}
              </div>
            </div>

            {/* Modal Content - Events List */}
            <div className="px-4 pb-6 overflow-y-auto max-h-[calc(80vh-180px)]">
              <div className="space-y-2">
                {moreModalEvents.map((event, idx) => {
                  const isAcademic = event.is_default_event || !event.time;
                  
                  return (
                    <div key={idx}>
                      {isAcademic ? (
                        // Academic Event - Green Bar Style
                        <div 
                          className="bg-green-600 text-white rounded-lg px-4 py-3 font-medium cursor-pointer hover:bg-green-700 transition-colors"
                          onClick={(e) => handleEventClick(event, e)}
                        >
                          {event.name || event.title}
                        </div>
                      ) : (
                        // Regular Event - Blue Bullet Style
                        <div 
                          className="flex items-start gap-2 px-2 py-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                          onClick={(e) => handleEventClick(event, e)}
                        >
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-800 font-normal">
                              <span className="font-medium">{formatTime(event.time)}</span> {event.title || '(No title)'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Event Detail Modal */}
      {showEventDetailModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
              <div className="flex items-start gap-3 flex-1 min-h-[4rem]">
                {/* Color Indicator */}
                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                  selectedEvent.is_default_event || !selectedEvent.time ? 'bg-green-600' : 'bg-blue-600'
                }`}></div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1 break-words">
                    {selectedEvent.title || selectedEvent.name}
                  </h3>
                  <div className="text-sm text-gray-600">
                    {new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-3">
                {currentUser && selectedEvent.host && selectedEvent.host.id === currentUser.id && onEditEvent && (
                  <button
                    onClick={() => {
                      setShowEventDetailModal(false);
                      onEditEvent(selectedEvent);
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit Event"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                {currentUser && selectedEvent.host && selectedEvent.host.id === currentUser.id && onDeleteEvent && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${selectedEvent.title || selectedEvent.name}"?`)) {
                        setShowEventDetailModal(false);
                        onDeleteEvent(selectedEvent);
                      }
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Delete Event"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => setShowEventDetailModal(false)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-5 space-y-4">
              {/* Academic Event - School Year & Duration */}
              {(selectedEvent.is_default_event || !selectedEvent.time) && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                  {/* School Year */}
                  {selectedEvent.school_year && (
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <div>
                        <div className="text-xs text-green-600 font-medium uppercase tracking-wide">School Year</div>
                        <div className="text-sm font-semibold text-green-900">{selectedEvent.school_year}</div>
                      </div>
                    </div>
                  )}



                  {/* Event Type Badge */}
                  <div className="flex items-center gap-2 pt-2 border-t border-green-200">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium text-green-700">Official Academic Calendar Event</span>
                  </div>
                </div>
              )}

              {/* Time */}
              {selectedEvent.time && selectedEvent.time !== 'All Day' && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-gray-900 font-medium">{formatTime(selectedEvent.time)}</div>
                </div>
              )}

              {/* Location */}
              {selectedEvent.location && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <div className="text-gray-900">{selectedEvent.location}</div>
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <div className="text-gray-700 whitespace-pre-wrap">{selectedEvent.description}</div>
                </div>
              )}

              {/* Regular Event Information Box - School Year & Badge Only */}
              {!(selectedEvent.is_default_event || !selectedEvent.time) && selectedEvent.school_year && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                  {/* School Year */}
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <div>
                      <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">School Year</div>
                      <div className="text-sm font-semibold text-blue-900">{selectedEvent.school_year}</div>
                    </div>
                  </div>

                  {/* Event Type Badge */}
                  <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-medium text-blue-700">Regular Event</span>
                  </div>
                </div>
              )}

              {/* Regular Event Type Badge (when no school year) */}
              {!(selectedEvent.is_default_event || !selectedEvent.time) && !selectedEvent.school_year && (
                <div className="pt-3 border-t border-gray-200">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Regular Event
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
