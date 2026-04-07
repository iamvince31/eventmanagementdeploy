import { useState, useEffect, useRef } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function Calendar({ events, defaultEvents = [], userSchedules = [], onDateSelect, highlightedDate, currentUser, onEditEvent, onDeleteEvent, onEventClick }) {
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
  const [cellHeight, setCellHeight] = useState(0);
  const gridRef = useRef(null);

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

  const getScheduleEventsForDate = (dateStr) => {
    const checkDate = new Date(dateStr);
    const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];

    // Get current semester (based on today's date)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    let currentSemester;

    if (currentMonth >= 9 || currentMonth <= 1) {
      currentSemester = 'first';
    } else if (currentMonth >= 2 && currentMonth <= 6) {
      currentSemester = 'second';
    } else if (currentMonth >= 7 && currentMonth <= 8) {
      currentSemester = 'midyear';
    }

    // Check if the specific date falls within the current semester
    const dateMonth = checkDate.getMonth() + 1;
    let dateInCurrentSemester = false;

    if (currentSemester === 'first' && (dateMonth >= 9 || dateMonth <= 1)) {
      dateInCurrentSemester = true;
    } else if (currentSemester === 'second' && (dateMonth >= 2 && dateMonth <= 6)) {
      dateInCurrentSemester = true;
    } else if (currentSemester === 'midyear' && (dateMonth >= 7 && dateMonth <= 8)) {
      dateInCurrentSemester = true;
    }

    // Filter schedules by day and only show during current semester
    return userSchedules.filter(schedule => {
      if (schedule.day !== dayName) {
        return false;
      }

      // Only show schedules during the current semester period
      // This ensures Tuesday classes only show on Tuesdays within the current semester
      return dateInCurrentSemester;
    });
  };

  // Check if there are time conflicts on a specific date
  const hasConflicts = (dateStr) => {
    const regularEvents = getEventsForDate(dateStr);
    const scheduleEvents = getScheduleEventsForDate(dateStr);

    // Collect all timed events (regular events + schedules)
    const timedEvents = [];

    // Add regular events with time
    regularEvents.forEach(event => {
      if (event.time && event.time !== 'All Day') {
        timedEvents.push({
          time: event.time,
          type: 'event',
          id: event.id
        });
      }
    });

    // Add schedule events
    scheduleEvents.forEach(schedule => {
      if (schedule.start_time && schedule.end_time) {
        timedEvents.push({
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          type: 'schedule',
          id: schedule.id
        });
      }
    });

    // Check for overlaps
    for (let i = 0; i < timedEvents.length; i++) {
      for (let j = i + 1; j < timedEvents.length; j++) {
        const event1 = timedEvents[i];
        const event2 = timedEvents[j];

        // Helper function to parse time to minutes
        const parseTimeToMinutes = (timeStr) => {
          if (!timeStr) return null;
          const parts = timeStr.split(':');
          return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
        };

        // Get time ranges for both events
        let time1Start, time1End, time2Start, time2End;

        if (event1.type === 'schedule') {
          time1Start = parseTimeToMinutes(event1.start_time);
          time1End = parseTimeToMinutes(event1.end_time);
        } else {
          // For point-in-time events, assume 1-hour duration
          time1Start = parseTimeToMinutes(event1.time);
          time1End = time1Start + 60; // 1 hour duration
        }

        if (event2.type === 'schedule') {
          time2Start = parseTimeToMinutes(event2.start_time);
          time2End = parseTimeToMinutes(event2.end_time);
        } else {
          // For point-in-time events, assume 1-hour duration
          time2Start = parseTimeToMinutes(event2.time);
          time2End = time2Start + 60; // 1 hour duration
        }

        // Check for overlap: two ranges overlap if one starts before the other ends
        if (time1Start !== null && time2Start !== null && time1End !== null && time2End !== null) {
          if (time1Start < time2End && time2Start < time1End) {
            return true; // Overlap detected
          }
        }
      }
    }

    return false;
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
    const scheduleEvents = getScheduleEventsForDate(dateStr);

    // Group all schedules into a single entry
    const groupedSchedules = scheduleEvents.length > 0 ? [{
      is_schedule: true,
      type: 'schedule',
      day: scheduleEvents[0].day,
      allSchedules: scheduleEvents,
      isScheduleGroup: true,
      clickedDate: dateStr
    }] : [];

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

  const formatTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return '';

    // Parse start time
    const [startHours, startMinutes] = startTime.split(':');
    const startHour = parseInt(startHours);
    const startMin = startMinutes || '00';
    const startAmpm = startHour >= 12 ? 'PM' : 'AM';
    const startDisplayHour = startHour % 12 || 12;

    // Parse end time
    const [endHours, endMinutes] = endTime.split(':');
    const endHour = parseInt(endHours);
    const endMin = endMinutes || '00';
    const endAmpm = endHour >= 12 ? 'PM' : 'AM';
    const endDisplayHour = endHour % 12 || 12;

    return `${startDisplayHour}:${startMin} ${startAmpm} - ${endDisplayHour}:${endMin} ${endAmpm}`;
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();

    // Schedule events use the internal modal (grouped view, no accept/decline needed)
    if (event.is_schedule || event.type === 'schedule') {
      const dateStr = event.clickedDate || moreModalDate || selectedDate;
      const allSchedulesForDay = getScheduleEventsForDate(dateStr);
      const combinedScheduleEvent = {
        ...event,
        allSchedules: allSchedulesForDay,
        isScheduleGroup: true,
        date: dateStr
      };
      setSelectedEvent(combinedScheduleEvent);
      setShowEventDetailModal(true);
      setShowMoreModal(false);
      setCurrentFileIndex(0);
    } else if (onEventClick) {
      // Regular/personal/default events — delegate to parent (EventDetailModal)
      setShowMoreModal(false);
      onEventClick(event);
    } else {
      setSelectedEvent(event);
      setShowEventDetailModal(true);
      setShowMoreModal(false);
      setCurrentFileIndex(0);
    }
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

  // Measure cell height to compute dynamic pill limit
  useEffect(() => {
    if (!gridRef.current) return;
    const observer = new ResizeObserver(() => {
      const grid = gridRef.current;
      if (!grid) return;
      // Each row is 1fr — total height / rows gives cell height
      const totalHeight = grid.clientHeight;
      const rowsNeeded = Math.ceil((firstDayOfMonth + daysInMonth) / 7);
      const rows = Math.max(rowsNeeded, 5);
      setCellHeight(Math.floor(totalHeight / rows));
    });
    observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, [firstDayOfMonth, daysInMonth]);

  // Check if a specific event conflicts with the schedule on a given date
  const eventConflictsWithSchedule = (event, dateStr) => {
    const scheduleEvents = getScheduleEventsForDate(dateStr);
    if (!scheduleEvents.length || !event.time || event.time === 'All Day') return false;

    const parseTimeToMinutes = (t) => {
      if (!t) return null;
      const [h, m] = t.split(':');
      return parseInt(h) * 60 + parseInt(m || 0);
    };

    const evStart = parseTimeToMinutes(event.time);
    const evEnd = evStart + 60;

    return scheduleEvents.some(s => {
      const sStart = parseTimeToMinutes(s.start_time);
      const sEnd = parseTimeToMinutes(s.end_time);
      if (sStart === null || sEnd === null) return false;
      return evStart < sEnd && sStart < evEnd;
    });
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

      const isSunday = cellDate.getDay() === 0; // Check if it's Sunday
      const isPastDate = cellDate < today && isCurrentMonth;

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

      // Group all schedules into a single entry for display
      const groupedSchedules = scheduleEvents.length > 0 ? [{
        is_schedule: true,
        type: 'schedule',
        day: scheduleEvents[0].day,
        allSchedules: scheduleEvents,
        isScheduleGroup: true,
        clickedDate: dateStr
      }] : [];

      // allEvents includes schedules for "View All" modal, but eventsToDisplay excludes them
      // so regular/academic events are never displaced by the schedule indicator
      const allEvents = [...academicEvents, ...groupedSchedules, ...regularEvents];
      const nonScheduleEvents = [...academicEvents, ...regularEvents];

      // allEvents for "View All" only includes non-schedule events
      // Schedules are shown via the green tint/border only — not as clickable pills
      const allEvents = [...academicEvents, ...regularEvents];
      const nonScheduleEvents = allEvents;

      // Dynamic display limit based on cell height:
      // ~18px per pill + 14px date row + 14px "view all" button
      const pillHeight = 18;
      const reservedPx = 28; // date number row + view-all button
      const dynamicLimit = cellHeight > 0
        ? Math.max(1, Math.floor((cellHeight - reservedPx) / pillHeight))
        : 1;
      const displayLimit = dynamicLimit;
      const eventsToDisplay = nonScheduleEvents.slice(0, displayLimit);

      // Check if this cell will show "View More" button
      const hasViewMore = allEvents.length > displayLimit;

      // Check for conflicts on this date
      const dateHasConflicts = isCurrentMonth && !isPastDate && hasConflicts(dateStr);

      // Check if this day has a weekly schedule (regardless of semester ΓÇö for the full year tint)
      const dayOfWeek = cellDate.getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const cellDayName = dayNames[dayOfWeek];
      const hasWeeklySchedule = userSchedules.some(s => s.day === cellDayName);

      days.push(
        <div
          key={`${cellYear}-${cellMonth}-${cellDay}`}
          onClick={() => {
            if (isCurrentMonth && !isPastDate) {
              handleDateClick(dateStr);
            }
          }}
          className={`h-full p-0.5 border -ml-[1px] -mt-[1px] transition-all duration-200 relative group flex flex-col
            border-gray-200
            ${isCurrentMonth ? (isPastDate ? 'cursor-default bg-gray-50' : 'cursor-default bg-white') : 'bg-gray-50/50'}
            ${selected && !isPastDate ? 'ring-2 ring-green-500 ring-inset z-10' : ''}
            ${highlighted && !isPastDate ? 'ring-2 ring-green-400 animate-pulse z-10' : ''}
            ${isPastDate ? 'opacity-60' : ''}
          `}
          style={undefined}
        >
          {/* Date Number */}
          <div className="flex justify-between items-start mb-0.5 flex-shrink-0">
            <div className="flex items-center gap-1 flex-wrap">
              <span className={`text-[9px] sm:text-xs font-semibold px-1 py-0.5 rounded-full transition-colors leading-none
                ${isCurrentDay ? 'bg-green-600 text-white shadow-sm' :
                  isPastDate ? 'text-gray-400' :
                    isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}
              `}>
                {cellDay}
              </span>
              {dateHasConflicts && (
                <>
                  <div className="relative group/conflict flex-shrink-0">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 cursor-help drop-shadow-sm"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {/* Tooltip */}
                    <div className="absolute left-0 top-full mt-1.5 hidden group-hover/conflict:block z-50">
                      <div className="bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap">
                        <span className="font-medium">Schedule Conflict</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Events List - Only for current month */}
          {isCurrentMonth && (
            <div className="flex-1 space-y-0.5 overflow-hidden">
              {/* Display first 1 event of any type */}
              {eventsToDisplay.map((event, idx) => {
                const isAcademic = event.is_default_event === true;
                const isHosted = currentUser && event.host && event.host.id === currentUser.id;
                const isPersonal = event.is_personal;
                const isMeeting = event.event_type === 'meeting';

                if (isAcademic) {
                  return (
                    <div
                      key={`academic-${idx}`}
                      className={`text-[8px] sm:text-xs px-1 py-0.5 rounded-sm truncate font-normal shadow-sm transition-all ${isPastDate
                          ? 'bg-gray-300 text-gray-600 opacity-75'
                          : 'bg-blue-500 text-white cursor-pointer hover:bg-blue-600'
                        }`}
                      title={event.name}
                      onClick={(e) => !isPastDate && handleEventClick(event, e)}
                    >
                      {event.name}
                    </div>
                  );
                } else {
                  const hasConflict = !isPastDate && eventConflictsWithSchedule(event, dateStr);
                  return (
                    <div
                      key={`regular-${idx}`}
                      className={`text-[8px] sm:text-xs px-1 py-0.5 text-white rounded-sm truncate font-normal shadow-sm transition-all ${isPastDate
                          ? 'bg-gray-400 opacity-75'
                          : isPersonal
                            ? 'bg-purple-500 hover:bg-purple-600 cursor-pointer'
                            : isMeeting
                              ? (isHosted ? 'bg-amber-800 hover:bg-amber-900 cursor-pointer' : 'bg-yellow-500 hover:bg-yellow-600 cursor-pointer')
                              : (isHosted ? 'bg-red-500 hover:bg-red-600 cursor-pointer' : 'bg-green-500 hover:bg-green-600 cursor-pointer')
                        }`}
                      title={`${event.title} ${isPastDate ? '(Past Event)' :
                          isPersonal ? '(Personal)' :
                            isMeeting ? (isHosted ? '(Hosting Meeting)' : '(Invited to Meeting)') :
                              (isHosted ? '(Hosting Event)' : '(Invited to Event)')
                        }`}
                      onClick={(e) => !isPastDate && handleEventClick(event, e)}
                    >
                      {hasConflict && (
                        <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="truncate">{event.title}</span>
                    </div>
                  );
                }
              })}



              {/* "View All" button - only show when total events > 1 and not past */}
              {!isPastDate && allEvents.length > displayLimit && (
                <button
                  onClick={(e) => handleMoreClick(e, dateStr)}
                  className="text-[8px] sm:text-xs text-green-600 hover:text-green-800 font-semibold px-0.5 hover:underline transition-colors mt-auto"
                >
                  <span className="hidden sm:inline">View All ({allEvents.length})</span>
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
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-2 sm:p-3 h-full flex flex-col overflow-hidden">
        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-1 sm:mb-2 flex-shrink-0">
          <button
            onClick={prevMonth}
            disabled={isAtMinDate}
            className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg transition-colors ${isAtMinDate
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-green-100 hover:bg-green-200 text-green-600 hover:text-green-800'
              }`}
          >
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-green-800 font-display tracking-tight">
            {monthNames[month]} {year}
          </h2>

          <button
            onClick={nextMonth}
            disabled={isAtMaxDate}
            className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg transition-colors ${isAtMaxDate
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-green-100 hover:bg-green-200 text-green-600 hover:text-green-800'
              }`}
          >
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-0 mb-0 flex-shrink-0 border-b border-green-200">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div
              key={day}
              className="text-center text-[8px] sm:text-[9px] font-semibold text-green-600 uppercase tracking-wider py-0.5 sm:py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div ref={gridRef} className="grid grid-cols-7 gap-0 flex-1 min-h-0 overflow-hidden" style={{ gridAutoRows: '1fr' }}>
          {renderCalendarDays()}
        </div>

        {/* Legend - 2 lines on mobile, scrollable on larger screens */}
        <div className="mt-1 sm:mt-2 pt-1.5 sm:pt-2 flex-shrink-0 overflow-x-auto">
          <div className="flex flex-wrap gap-2 sm:gap-3 text-[9px] sm:text-xs pb-1 max-w-full">
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded flex-shrink-0" style={{ backgroundColor: 'rgba(22,163,74,0.1)', border: '1px solid #4ade80' }}></div>
              <span className="text-gray-600 font-medium">Class Day</span>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-blue-500 flex-shrink-0"></div>
              <span className="text-gray-600 font-medium">Academic Event</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-red-500"></div>
              <span className="text-gray-600 font-medium">Hosting Event</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-500"></div>
              <span className="text-gray-600 font-medium">Invited Event</span>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-amber-800 flex-shrink-0"></div>
              <span className="text-gray-600 font-medium">Hosting Meeting</span>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-yellow-500 flex-shrink-0"></div>
              <span className="text-gray-600 font-medium">Invited Meeting</span>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-purple-500 flex-shrink-0"></div>
              <span className="text-gray-600 font-medium">Personal Event</span>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-600 font-medium">Schedule Conflict</span>
            </div>
          </div>
        </div>
      </div>
      {/* Event Detail Modal */}
      {showMoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-sm max-w-md w-full max-h-[85vh] sm:max-h-[80vh] overflow-hidden border border-gray-200 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {new Date(moreModalDate).toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
                <h3 className="text-2xl font-semibold text-gray-900 mt-1">
                  {new Date(moreModalDate).getDate()}
                </h3>
              </div>
              <button
                onClick={() => setShowMoreModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Events List */}
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-100">
                {moreModalEvents.map((event, idx) => {
                  const isAcademic = event.is_default_event === true;
                  const isSchedule = event.is_schedule || event.type === 'schedule';
                  const isHosted = currentUser && event.host && event.host.id === currentUser.id;
                  const isPersonal = event.is_personal;
                  const isMeeting = event.event_type === 'meeting';

                  return (
                    <div
                      key={idx}
                      onClick={(e) => handleEventClick(event, e)}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      {isAcademic ? (
                        // Academic Event
                        <div className="flex items-start gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">
                              {event.name || event.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Academic Calendar</p>
                          </div>
                        </div>
                      ) : isSchedule ? (
                        // Schedule Event - Show day name
                        <div className="flex items-start gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">
                              {event.day} Classes
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">Click to view schedule</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Regular Event
                        <div className="flex items-start gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${isPersonal
                              ? 'bg-purple-500'
                              : isMeeting
                                ? (isHosted ? 'bg-amber-800' : 'bg-yellow-500')
                                : (isHosted ? 'bg-red-500' : 'bg-green-500')
                            }`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {event.title || '(No title)'}
                              </p>
                              {eventConflictsWithSchedule(event, moreModalDate) && (
                                <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  Conflict
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-600">{formatTime(event.time)}</span>
                              <span className="text-xs text-gray-500">
                                {isPersonal ? 'Personal' :
                                  isMeeting ? (isHosted ? 'Hosting' : 'Invited') :
                                    (isHosted ? 'Hosting' : 'Invited')}
                              </span>
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
          <div className="bg-white rounded-lg shadow-sm w-full max-w-5xl h-[90vh] 2xl:h-[75vh] overflow-hidden border border-gray-200 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${selectedEvent.is_default_event || (!selectedEvent.time && !selectedEvent.is_schedule) ? 'bg-blue-500' :
                    selectedEvent.is_schedule || selectedEvent.type === 'schedule' ? 'bg-orange-500' :
                      selectedEvent.is_personal
                        ? 'bg-purple-500'
                        : selectedEvent.event_type === 'meeting'
                          ? (currentUser && selectedEvent.host && selectedEvent.host.id === currentUser.id ? 'bg-amber-800' : 'bg-yellow-500')
                          : (currentUser && selectedEvent.host && selectedEvent.host.id === currentUser.id ? 'bg-red-500' : 'bg-green-500')
                  }`}></div>
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {selectedEvent.isScheduleGroup
                    ? `${selectedEvent.day} Classes`
                    : (selectedEvent.title || selectedEvent.name)}
                </h3>
                {currentUser && selectedEvent.host && selectedEvent.host.id === currentUser.id && !selectedEvent.is_default_event && !selectedEvent.isScheduleGroup && (
                  <>
                    <button
                      onClick={() => {
                        setShowEventDetailModal(false);
                        onEditEvent(selectedEvent);
                      }}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                      title="Edit Event"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setEventToDelete(selectedEvent);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                      title="Delete Event"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowEventDetailModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
              {/* Left Column - Event Details */}
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col">
                <div className="space-y-5">
                  {/* Date */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date</p>
                    <p className="text-sm text-gray-900">
                      {selectedEvent.end_date ? (
                        <>
                          {new Date(selectedEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(selectedEvent.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </>
                      ) : (
                        new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                      )}
                    </p>
                  </div>

                  {/* Time */}
                  {selectedEvent.time && selectedEvent.time !== 'All Day' && !selectedEvent.isScheduleGroup && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Time</p>
                      <p className="text-sm text-gray-900 font-medium">{formatTime(selectedEvent.time)}</p>
                    </div>
                  )}

                  {/* Class Schedule Details - Show all schedules for the day */}
                  {selectedEvent.isScheduleGroup && selectedEvent.allSchedules && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Class Schedule</p>
                      <div className="space-y-2">
                        {selectedEvent.allSchedules.map((schedule, index) => {
                          // Get the color from the schedule, default to orange if not set
                          const scheduleColor = schedule.color || '#f97316'; // default orange-500

                          return (
                            <div key={index} className="flex items-start gap-3">
                              <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                                style={{ backgroundColor: scheduleColor }}
                              ></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">
                                  {schedule.description || schedule.title || 'Class'}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: scheduleColor }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="font-medium">
                                    {formatTimeRange(schedule.start_time, schedule.end_time)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {selectedEvent.location && !selectedEvent.isScheduleGroup && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Location</p>
                      <p className="text-sm text-gray-900">{selectedEvent.location}</p>
                    </div>
                  )}

                  {/* Description */}
                  {selectedEvent.description && !selectedEvent.isScheduleGroup && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Details</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedEvent.description}</p>
                    </div>
                  )}

                  {/* Academic Event Info - Only show for actual academic events, not schedules */}
                  {(selectedEvent.is_default_event || (!selectedEvent.time && !selectedEvent.isScheduleGroup)) && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                      {selectedEvent.school_year && (
                        <div>
                          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Academic Year</p>
                          <p className="text-sm font-semibold text-blue-900">{selectedEvent.school_year}</p>
                        </div>
                      )}
                      <div className={selectedEvent.school_year ? 'pt-3 border-t border-blue-200' : ''}>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs font-medium text-blue-700">Official Academic Calendar</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Participants */}
                  {!(selectedEvent.is_default_event || !selectedEvent.time) && !selectedEvent.isScheduleGroup && selectedEvent.members && selectedEvent.members.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-gray-200 flex-1 flex flex-col min-h-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex-shrink-0">Participants ({selectedEvent.members.length})</p>
                      <div className="space-y-2 overflow-y-auto flex-1">
                        {selectedEvent.members.map((member, index) => (
                          <div key={member.id || index} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-semibold">
                                {(member.username || member.name || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {member.username || member.name || 'Member'}
                                {currentUser && member.id === currentUser.id && (
                                  <span className="ml-2 text-xs text-green-600 font-normal">(You)</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{member.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Right Column - File Viewer */}
              {selectedEvent.images && selectedEvent.images.length > 0 && (
                <div className="w-full lg:w-[500px] border-t lg:border-t-0 lg:border-l border-gray-100 bg-gray-50 flex flex-col">
                  {/* File Header */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Files ({selectedEvent.images.length})</span>
                    </div>
                    {selectedEvent.images.length > 1 && (
                      <span className="text-xs text-gray-500">{currentFileIndex + 1} of {selectedEvent.images.length}</span>
                    )}
                  </div>

                  {/* File Viewer - Fixed Height */}
                  <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    {selectedEvent.images[currentFileIndex] && (
                      <div className="relative bg-white flex-1 flex items-center justify-center group overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center p-2">
                          {selectedEvent.images[currentFileIndex].original_filename?.toLowerCase().endsWith('.pdf') ? (
                            <div className="w-full h-full border border-gray-200 rounded overflow-hidden">
                              <iframe
                                src={selectedEvent.images[currentFileIndex].url}
                                className="w-full h-full"
                                title={selectedEvent.images[currentFileIndex].original_filename}
                              />
                            </div>
                          ) : (
                            <img
                              src={selectedEvent.images[currentFileIndex].url}
                              alt={selectedEvent.images[currentFileIndex].original_filename}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          )}
                          <div className="hidden flex-col items-center justify-center text-gray-500 bg-gray-100 rounded p-8 w-full h-full">
                            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <p className="text-sm font-medium">Failed to load</p>
                          </div>
                        </div>

                        {/* Navigation Buttons */}
                        {selectedEvent.images.length > 1 && (
                          <>
                            <button
                              onClick={prevFile}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded transition-all opacity-0 group-hover:opacity-100"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={nextFile}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded transition-all opacity-0 group-hover:opacity-100"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Thumbnail Strip */}
                    {selectedEvent.images.length > 1 && (
                      <div className="px-2 py-2 border-t border-gray-100 bg-white flex gap-1 overflow-x-auto flex-shrink-0">
                        {selectedEvent.images.map((file, index) => (
                          <button
                            key={index}
                            onClick={() => goToFile(index)}
                            className={`flex-shrink-0 w-12 h-12 rounded border-2 transition-all ${index === currentFileIndex
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            title={file.original_filename}
                          >
                            {file.original_filename?.toLowerCase().endsWith('.pdf') ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                            ) : (
                              <img
                                src={file.url}
                                alt={file.original_filename}
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            )}
                            <div className="hidden w-full h-full items-center justify-center">
                              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </button>
                        ))}
                      </div>
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
