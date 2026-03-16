import { useState, useEffect } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function Calendar({ events, defaultEvents = [], onDateSelect, highlightedDate, currentUser, onEditEvent, onDeleteEvent }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [moreModalDate, setMoreModalDate] = useState(null);
  const [moreModalEvents, setMoreModalEvents] = useState([]);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // File viewer state
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate date boundaries: 2 months in the past, 1 year in the future h
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

      // Exclude Sundays for academic events
      if (checkDate.getDay() === 0) return false; // 0 = Sunday

      if (!event.end_date) {
        return eventStartDate.toDateString() === checkDate.toDateString();
      }

      const eventEndDate = new Date(event.end_date);
      return checkDate >= eventStartDate && checkDate <= eventEndDate;
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
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const min = minutes || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour.toString().padStart(2, '0')}:${min} ${ampm}`;
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEventDetailModal(true);
    setShowMoreModal(false);
    setCurrentFileIndex(0); // Reset file index when opening new event
  };
  // File navigation functions
  const nextFile = () => {
    if (selectedEvent?.images?.length > 1) {
      setCurrentFileIndex((prev) => (prev + 1) % selectedEvent.images.length);
    }
  };

  const prevFile = () => {
    if (selectedEvent?.images?.length > 1) {
      setCurrentFileIndex((prev) => (prev - 1 + selectedEvent.images.length) % selectedEvent.images.length);
    }
  };

  const goToFile = (index) => {
    setCurrentFileIndex(index);
  };

  // Keyboard navigation for file carousel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showEventDetailModal && selectedEvent?.images?.length > 1) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          prevFile();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          nextFile();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showEventDetailModal, selectedEvent?.images?.length]);

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

      // Check if this cell will show "View More" button
      const hasViewMore = allEvents.length > displayLimit;
      days.push(
        <div
          key={`${cellYear}-${cellMonth}-${cellDay}`}
          onClick={() => {
            if (isCurrentMonth) {
              handleDateClick(dateStr);
            }
          }}
          className={`
            h-full p-1.5 border border-gray-200 -ml-[1px] -mt-[1px] transition-all duration-200 relative group flex flex-col
            ${isCurrentMonth ? 'cursor-default bg-white' : 'bg-gray-50/50'}
            ${selected ? 'ring-2 ring-green-500 ring-inset z-10' : ''}
            ${highlighted ? 'ring-2 ring-green-400 animate-pulse z-10' : ''}
          `}
        >
          {/* Date Number - Always show */}
          <div className="flex justify-between items-start mb-0.5 sm:mb-1 flex-shrink-0">
            <span className={`text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5 py-0.5 rounded-full
              ${isCurrentDay ? 'bg-green-600 text-white shadow-sm' : 
                isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}
            `}>
              {cellDay}
            </span>
          </div>

          {/* Events List - Only for current month */}
          {isCurrentMonth && (
            <div className="flex-1 space-y-1.5 overflow-hidden">
              {/* Academic Events (Blue Labels) - Clickable */}
              {academicEvents.slice(0, displayLimit).map((event, idx) => (
                <div
                  key={`academic-${idx}`}
                  className="text-[9px] sm:text-xs lg:text-sm px-1 sm:px-1.5 lg:px-2.5 py-0.5 sm:py-1 lg:py-1.5 bg-blue-500 text-white rounded-sm sm:rounded-md truncate font-normal shadow-sm sm:shadow-md cursor-pointer hover:bg-blue-600 transition-colors"
                  title={event.name}
                  onClick={(e) => handleEventClick(event, e)}
                >
                  {event.name}
                </div>
              ))}

              {/* Regular Events (Title Labels) - Always allowed */}
              {regularEvents.slice(0, displayLimit - academicEvents.length).map((event, idx) => {
                const isHosted = currentUser && event.host && event.host.id === currentUser.id;
                const isPersonal = event.is_personal;
                const isMeeting = event.event_type === 'meeting';

                return (
                  <div
                    key={`regular-${idx}`}
                    className={`text-[9px] sm:text-xs lg:text-sm px-1 sm:px-1.5 lg:px-2.5 py-0.5 sm:py-1 lg:py-1.5 text-white rounded-sm sm:rounded-md truncate font-normal shadow-sm sm:shadow-md cursor-pointer transition-colors ${isPersonal
                        ? 'bg-purple-500 hover:bg-purple-600'
                        : isMeeting
                        ? (isHosted ? 'bg-amber-800 hover:bg-amber-900' : 'bg-yellow-500 hover:bg-yellow-600')
                        : (isHosted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600')
                    }`}
                    title={`${event.title} ${
                      isPersonal ? '(Personal)' : 
                      isMeeting ? (isHosted ? '(Hosting Meeting)' : '(Invited to Meeting)') : 
                      (isHosted ? '(Hosting Event)' : '(Invited to Event)')
                    }`}
                    onClick={(e) => handleEventClick(event, e)}
                  >
                    {event.title}
                  </div>
                );
              })}
              {/* "View More" button - only show when total events > 2 */}
              {allEvents.length > displayLimit && (
                <button
                  onClick={(e) => handleMoreClick(e, dateStr)}
                  className="text-[9px] sm:text-xs lg:text-sm text-green-600 hover:text-green-800 font-semibold px-0.5 sm:px-1 hover:underline transition-colors mt-auto"
                >
                  <span className="hidden sm:inline">View More ({allEvents.length})</span>
                  <span className="sm:hidden">+{allEvents.length - displayLimit}</span>
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
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-2 sm:p-3 h-full flex flex-col">
        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-2 sm:mb-3 flex-shrink-0">
          <button
            onClick={prevMonth}
            disabled={isAtMinDate}
            className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg transition-colors ${isAtMinDate
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-green-100 hover:bg-green-200 text-green-600 hover:text-green-800'
              }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-green-800 font-display tracking-tight">
            {monthNames[month]} {year}
          </h2>

          <button
            onClick={nextMonth}
            disabled={isAtMaxDate}
            className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg transition-colors ${isAtMaxDate
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-green-100 hover:bg-green-200 text-green-600 hover:text-green-800'
              }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-0 mb-0 flex-shrink-0 border-b border-green-200">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div
              key={day}
              className="text-center text-[9px] sm:text-[10px] font-semibold text-green-600 uppercase tracking-wider py-1 sm:py-1.5"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 flex-1 min-h-0" style={{ gridAutoRows: '1fr' }}>
          {renderCalendarDays()}
        </div>

        {/* Legend */}
        <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex flex-wrap gap-1.5 sm:gap-2 lg:gap-3 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-blue-500"></div>
              <span className="text-gray-600 font-medium">Academic</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-red-500"></div>
              <span className="text-gray-600 font-medium">Hosting</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-500"></div>
              <span className="text-gray-600 font-medium">Invited</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-amber-800"></div>
              <span className="text-gray-600 font-medium hidden sm:inline">Hosting Meeting</span>
              <span className="text-gray-600 font-medium sm:hidden">Host Mtg</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-yellow-500"></div>
              <span className="text-gray-600 font-medium hidden sm:inline">Invited Meeting</span>
              <span className="text-gray-600 font-medium sm:hidden">Inv Mtg</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-purple-500"></div>
              <span className="text-gray-600 font-medium">Personal</span>
            </div>
          </div>
        </div>
      </div>
      {/* Event Detail Modal */}
      {showMoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] sm:max-h-[80vh] overflow-hidden border border-gray-200">
            {/* Modal Header - Day and Date */}
            <div className="bg-white px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex flex-col items-center relative">
              {/* Close Button */}
              <button
                onClick={() => setShowMoreModal(false)}
                className="absolute top-3 sm:top-4 right-3 sm:right-4 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Day of Week */}
              <div className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wider mb-1">
                {new Date(moreModalDate).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
              </div>

              {/* Date Number */}
              <div className="text-5xl sm:text-6xl font-normal text-gray-800 mb-3 sm:mb-4">
                {new Date(moreModalDate).getDate()}
              </div>
            </div>

            {/* Modal Content - Events List */}
            <div className="px-3 sm:px-4 pb-4 sm:pb-6 overflow-y-auto max-h-[calc(85vh-160px)] sm:max-h-[calc(80vh-180px)]">
              <div className="space-y-2">
                {moreModalEvents.map((event, idx) => {
                  const isAcademic = event.is_default_event || !event.time;
                  const isHosted = currentUser && event.host && event.host.id === currentUser.id;
                  const isPersonal = event.is_personal;
                  const isMeeting = event.event_type === 'meeting';

                  return (
                    <div key={idx}>
                      {isAcademic ? (
                        // Academic Event - Blue Bar Style
                        <div
                          className="bg-blue-500 text-white rounded-lg px-3 sm:px-4 py-2 sm:py-3 font-medium cursor-pointer hover:bg-blue-600 transition-colors text-sm sm:text-base"
                          onClick={(e) => handleEventClick(event, e)}
                        >
                          {event.name || event.title}
                        </div>
                      ) : (
                        // Regular Event - Consistent Color Dots
                        <div 
                          className="flex items-start gap-2 sm:gap-3 px-2 sm:px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          onClick={(e) => handleEventClick(event, e)}
                        >
                          <div className={`flex-shrink-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mt-1 sm:mt-1.5 ${
                            isPersonal
                              ? 'bg-purple-500'
                              : isMeeting
                              ? (isHosted ? 'bg-amber-800' : 'bg-yellow-500')
                              : (isHosted ? 'bg-red-500' : 'bg-green-500')
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-800 font-normal text-sm sm:text-base">
                              <span className="font-medium">{formatTime(event.time)}</span> {event.title || '(No title)'}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {isPersonal ? 'Personal Event' : 
                               isMeeting ? (isHosted ? 'Hosting Meeting' : 'Invited to Meeting') : 
                               (isHosted ? 'Hosting Event' : 'Invited to Event')}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-gray-200">
            {/* Modal Header - Only Close Button */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-end items-center bg-white">
              {/* Close Button */}
              <button
                onClick={() => setShowEventDetailModal(false)}
                className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col lg:flex-row max-h-[calc(90vh-60px)] sm:max-h-[calc(85vh-70px)] overflow-y-auto">
              {/* Left Column - Event Details */}
              <div className="flex-1 px-3 sm:px-6 py-3 sm:py-5 space-y-3 sm:space-y-4">
                {/* Event Header - Name, Bullet Point, Edit/Delete Buttons, Date */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Color Bullet Point */}
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 mt-0.5 sm:mt-1 ${
                      selectedEvent.is_default_event || !selectedEvent.time ? 'bg-blue-500' : 
                      selectedEvent.is_personal
                        ? 'bg-purple-500'
                        : selectedEvent.event_type === 'meeting'
                        ? (currentUser && selectedEvent.host && selectedEvent.host.id === currentUser.id ? 'bg-amber-800' : 'bg-yellow-500')
                        : (currentUser && selectedEvent.host && selectedEvent.host.id === currentUser.id ? 'bg-red-500' : 'bg-green-500')
                    }`}></div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">
                      {selectedEvent.title || selectedEvent.name}
                    </h3>

                    {/* Inline Edit/Delete Buttons */}
                    {currentUser && selectedEvent.host && selectedEvent.host.id === currentUser.id && !selectedEvent.is_default_event && (
                      <>
                        <button
                          onClick={() => {
                            setShowEventDetailModal(false);
                            onEditEvent(selectedEvent);
                          }}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors mt-0.5 sm:mt-1"
                          title="Edit Event"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setEventToDelete(selectedEvent);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors mt-0.5 sm:mt-1"
                          title="Delete Event"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-700 ml-3 sm:ml-5">
                    {selectedEvent.end_date ? (
                      // Multi-day event - show date range
                      <>
                        {new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric'
                        })} - {new Date(selectedEvent.end_date).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </>
                    ) : (
                      // Single day event - show full date with weekday
                      new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })
                    )}
                  </div>
                </div>
                {/* Horizontal divider after date */}
                <div className="border-t border-gray-200"></div>
                
                {/* Academic Event - School Year & Duration */}
                {(selectedEvent.is_default_event || !selectedEvent.time) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                    {/* School Year */}
                    {selectedEvent.school_year && (
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <div>
                          <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">School Year</div>
                          <div className="text-sm font-semibold text-blue-900">{selectedEvent.school_year}</div>
                        </div>
                      </div>
                    )}

                    {/* Event Type Badge */}
                    <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium text-blue-700">Official Academic Calendar Event</span>
                    </div>
                  </div>
                )}

                {/* Time */}
                {selectedEvent.time && selectedEvent.time !== 'All Day' && (
                  <div className="flex items-start gap-2 sm:gap-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm sm:text-base text-gray-900 font-medium">{formatTime(selectedEvent.time)}</div>
                  </div>
                )}

                {/* Location */}
                {selectedEvent.location && (
                  <div className="flex items-start gap-2 sm:gap-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <div className="text-sm sm:text-base text-gray-900">{selectedEvent.location}</div>
                  </div>
                )}

                {/* Description */}
                {selectedEvent.description && (
                  <div className="flex items-start gap-2 sm:gap-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    <div className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">{selectedEvent.description}</div>
                  </div>
                )}
                {/* Invited Participants Section - Compact */}
                {!(selectedEvent.is_default_event || !selectedEvent.time) && (
                  <div className="mt-3 sm:mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Participants</h4>
                        
                        {/* Invited Members - Expanded */}
                        {selectedEvent.members && selectedEvent.members.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] sm:text-xs font-medium text-gray-600 uppercase tracking-wide">
                                Invited ({selectedEvent.members.length})
                              </span>
                            </div>
                            <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto pr-2">
                              {selectedEvent.members.map((member, index) => (
                                <div key={member.id || index} className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
                                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <span className="text-white text-xs sm:text-sm font-medium">
                                      {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                      {member.name || 'Member'}
                                      {currentUser && member.id === currentUser.id && (
                                        <span className="ml-2 text-xs text-green-600 font-normal">(You)</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate mt-0.5">{member.email}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No participants message - Compact */}
                        {(!selectedEvent.members || selectedEvent.members.length === 0) && (
                          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            <div className="text-gray-400 text-sm font-medium">No participants invited</div>
                            <div className="text-gray-300 text-xs mt-1">This event has no invited participants</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {/* Regular Event Information Box - School Year & Badge Only - Closer */}
                {!(selectedEvent.is_default_event || !selectedEvent.time) && selectedEvent.school_year && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
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

                {/* Event Type Badge (when no school year) - Closer */}
                {!(selectedEvent.is_default_event || !selectedEvent.time) && !selectedEvent.school_year && (
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <span className={`inline-flex items-center gap-2 text-xs font-medium ${
                      selectedEvent.is_personal
                        ? 'text-purple-700'
                        : selectedEvent.event_type === 'meeting'
                        ? (currentUser && selectedEvent.host && selectedEvent.host.id === currentUser.id ? 'text-amber-900' : 'text-yellow-700')
                        : (currentUser && selectedEvent.host && selectedEvent.host.id === currentUser.id ? 'text-red-700' : 'text-green-700')
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {selectedEvent.is_personal ? 'Personal Event' : 
                       selectedEvent.event_type === 'meeting'
                         ? (currentUser && selectedEvent.host && selectedEvent.host.id === currentUser.id ? 'Hosting Meeting' : 'Invited to Meeting')
                         : (currentUser && selectedEvent.host && selectedEvent.host.id === currentUser.id ? 'Hosting Event' : 'Invited to Event')}
                    </span>
                  </div>
                )}
              </div>
              {/* Right Column - File Viewer */}
              {selectedEvent.images && selectedEvent.images.length > 0 && (
                <div className="w-[650px] border-l border-gray-200 bg-gray-50 flex flex-col">
                  {/* File Viewer Header */}
                  <div className="px-4 py-3 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 00-2.828-2.828l-6.586 6.586a2 2 0 102.828 2.828L19 9" />
                        </svg>
                        <h4 className="text-sm font-semibold text-gray-900">Files ({selectedEvent.images.length})</h4>
                      </div>
                      {/* File counter */}
                      {selectedEvent.images.length > 1 && (
                        <span className="text-xs text-gray-500">
                          {currentFileIndex + 1} of {selectedEvent.images.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* File Viewer Content */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {selectedEvent.images[currentFileIndex] && (
                      <>
                        {/* Full Display Viewer with Navigation Buttons */}
                        <div className="relative bg-white border-b border-gray-200 group">
                          <div className="w-full h-[600px] flex items-center justify-center p-2">
                            {selectedEvent.images[currentFileIndex].original_filename?.toLowerCase().endsWith('.pdf') ? (
                              /* PDF Viewer - Full Display */
                              <div className="w-full h-full border border-gray-200 rounded-lg overflow-hidden shadow-lg">
                                <iframe
                                  src={selectedEvent.images[currentFileIndex].url}
                                  className="w-full h-full"
                                  title={selectedEvent.images[currentFileIndex].original_filename}
                                />
                              </div>
                            ) : (
                              /* Image Viewer - Full Display */
                              <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg shadow-lg">
                                <img
                                  src={selectedEvent.images[currentFileIndex].url}
                                  alt={selectedEvent.images[currentFileIndex].original_filename}
                                  className="max-w-full max-h-full object-contain rounded-lg"
                                  style={{ minHeight: '200px', minWidth: '200px' }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="hidden flex-col items-center justify-center text-gray-500 bg-gray-100 rounded-lg p-8 w-full h-full">
                                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                  </svg>
                                  <p className="text-lg font-medium">Failed to load image</p>
                                  <p className="text-sm text-gray-400 mt-1">Please try opening in a new tab</p>
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Navigation Buttons Inside Viewer */}
                          {selectedEvent.images.length > 1 && (
                            <>
                              {/* Previous Button */}
                              <button
                                onClick={prevFile}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full transition-all duration-200 opacity-0 hover:opacity-100 group-hover:opacity-100 shadow-lg"
                                title="Previous file"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>

                              {/* Next Button */}
                              <button
                                onClick={nextFile}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full transition-all duration-200 opacity-0 hover:opacity-100 group-hover:opacity-100 shadow-lg"
                                title="Next file"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>

                        {/* File Thumbnails (if multiple files) */}
                        {selectedEvent.images.length > 1 && (
                          <div className="px-4 py-3 bg-gray-100 border-t border-gray-200">
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {selectedEvent.images.map((file, index) => (
                                <button
                                  key={index}
                                  onClick={() => goToFile(index)}
                                  className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition-all ${
                                    index === currentFileIndex
                                      ? 'border-blue-500 bg-blue-50 shadow-md'
                                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                  }`}
                                  title={file.original_filename}
                                >
                                  {file.original_filename?.toLowerCase().endsWith('.pdf') ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <svg className={`w-8 h-8 ${index === currentFileIndex ? 'text-red-600' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  ) : (
                                    <img
                                      src={file.url}
                                      alt={file.original_filename}
                                      className="w-full h-full object-cover rounded-lg"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  )}
                                  <div className="hidden w-full h-full items-center justify-center">
                                    <svg className={`w-8 h-8 ${index === currentFileIndex ? 'text-blue-600' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setEventToDelete(null);
        }}
        onConfirm={async () => {
          if (!eventToDelete) return;
          
          setIsDeleting(true);
          try {
            setShowEventDetailModal(false);
            await onDeleteEvent(eventToDelete);
            setShowDeleteConfirm(false);
            setEventToDelete(null);
          } catch (error) {
            console.error('Error deleting event:', error);
          } finally {
            setIsDeleting(false);
          }
        }}
        eventTitle={eventToDelete?.title || eventToDelete?.name}
        eventType={eventToDelete?.event_type === 'meeting' ? 'Meeting' : 'Event'}
        isDeleting={isDeleting}
      />
    </>
  );
}