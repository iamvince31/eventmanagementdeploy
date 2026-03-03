import { useState } from 'react';

export default function Calendar({ events, defaultEvents = [], onDateSelect, highlightedDate, currentUser }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate date boundaries: 2 months in the past, 1 year in the future
  const today = new Date();
  const minDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const maxDate = new Date(today.getFullYear() + 1, today.getMonth(), 0); // Last day of same month next year

  // Check if we're at the boundaries
  const currentMonthDate = new Date(year, month, 1);
  const isAtMinDate = currentMonthDate <= minDate;
  const isAtMaxDate = currentMonthDate >= maxDate;

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    // Don't go before 2 months in the past
    if (newDate >= minDate) {
      setCurrentDate(newDate);
    }
  };

  const nextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    // Don't go beyond 1 year in the future
    if (newDate <= maxDate) {
      setCurrentDate(newDate);
    }
  };

  const getEventsForDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => event.date === dateStr);
  };

  // Check if a date falls within any default event's date range
  const isDateInDefaultEventRange = (dateStr) => {
    return defaultEvents.some(event => {
      if (!event.date) return false;
      
      const eventStartDate = new Date(event.date);
      const checkDate = new Date(dateStr);
      
      // If no end_date, check if it's the same day
      if (!event.end_date) {
        return eventStartDate.toDateString() === checkDate.toDateString();
      }
      
      // If end_date exists, check if date is within range
      const eventEndDate = new Date(event.end_date);
      const isInRange = checkDate >= eventStartDate && checkDate <= eventEndDate;
      
      // Exclude Sundays (0) for multi-day events
      if (isInRange) {
        const dayOfWeek = checkDate.getDay();
        return dayOfWeek !== 0;
      }
      
      return false;
    });
  };

  // Get default events for a specific date (including ranges)
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
      
      // Exclude Sundays (0) for multi-day events
      if (isInRange) {
        const dayOfWeek = checkDate.getDay();
        return dayOfWeek !== 0;
      }
      
      return false;
    });
  };

  const handleDateClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    if (onDateSelect) {
      onDateSelect(dateStr, getEventsForDate(day));
    }
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return selectedDate === dateStr;
  };

  const isHighlighted = (day) => {
    if (!highlightedDate) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return highlightedDate === dateStr;
  };

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate previous month info
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

    // Calculate next month info
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    // Always render exactly 42 cells (6 rows × 7 days)
    for (let i = 0; i < 42; i++) {
      let cellDay, cellMonth, cellYear, isCurrentMonth, isOtherMonth;

      if (i < firstDayOfMonth) {
        // Previous month days
        cellDay = daysInPrevMonth - (firstDayOfMonth - 1 - i);
        cellMonth = prevMonth;
        cellYear = prevYear;
        isCurrentMonth = false;
        isOtherMonth = true;
      } else if (i < firstDayOfMonth + daysInMonth) {
        // Current month days
        cellDay = i - firstDayOfMonth + 1;
        cellMonth = month;
        cellYear = year;
        isCurrentMonth = true;
        isOtherMonth = false;
      } else {
        // Next month days
        cellDay = i - firstDayOfMonth - daysInMonth + 1;
        cellMonth = nextMonth;
        cellYear = nextYear;
        isCurrentMonth = false;
        isOtherMonth = true;
      }

      const cellDate = new Date(cellYear, cellMonth, cellDay);
      cellDate.setHours(0, 0, 0, 0);
      const isPast = cellDate < today;
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
      const dayEvents = isCurrentMonth ? events.filter(event => event.date === dateStr) : [];
      const eventCount = !isPast && isCurrentMonth ? dayEvents.length : 0;
      const hasAcademicEvent = dayEvents.some(event => event.is_default_event);
      
      // Check if this date is within any default event range
      const isInDefaultEventRange = isCurrentMonth && isDateInDefaultEventRange(dateStr);
      const defaultEventsOnDate = isCurrentMonth ? getDefaultEventsForDate(dateStr) : [];

      days.push(
        <div
          key={`${cellYear}-${cellMonth}-${cellDay}`}
          onClick={() => {
            if (isCurrentMonth && !isSunday) {
              const dateStr = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(cellDay).padStart(2, '0')}`;
              setSelectedDate(dateStr);
              if (onDateSelect) {
                onDateSelect(dateStr, dayEvents);
              }
            }
          }}
          className={`
            h-16 p-2 rounded-lg transition-all duration-200 relative group flex flex-col
            ${isCurrentMonth 
              ? `${isSunday ? 'cursor-not-allowed opacity-40 bg-gray-100' : 'cursor-pointer'} ${isCurrentDay
                  ? 'bg-green-100 border-2 border-green-600 shadow-sm'
                  : isInDefaultEventRange
                    ? 'bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-400 hover:border-blue-500 hover:shadow-md'
                    : hasAcademicEvent
                      ? 'bg-green-700 border border-green-700 hover:border-green-600 hover:shadow-md'
                      : 'bg-white border border-gray-200 hover:border-green-400 hover:shadow-md'
                }`
              : 'bg-gray-50/30 border border-gray-100 cursor-default'
            }
            ${selected ? 'ring-2 ring-green-500 ring-offset-1' : ''}
            ${highlighted ? 'ring-4 ring-green-400 ring-offset-2 animate-pulse bg-green-50' : ''}
            ${isPast && isCurrentMonth ? 'opacity-40' : ''}
            ${isOtherMonth ? 'opacity-30' : ''}
          `}
          title={isSunday && isCurrentMonth ? 'Sundays are not available for events' : ''}
        >
          <div className={`
            text-sm font-semibold flex-shrink-0
            ${isCurrentMonth 
              ? (isCurrentDay 
                  ? 'text-green-800' 
                  : isInDefaultEventRange
                    ? 'text-blue-700'
                    : hasAcademicEvent
                      ? 'text-white'
                      : (selected ? 'text-green-700' : 'text-gray-700')
                )
              : 'text-gray-400'
            }
          `}>
            {cellDay}
          </div>

          {isCurrentDay && (
            <span className="absolute top-1.5 right-2 text-[10px] font-bold text-green-600 uppercase tracking-wide">
              Today
            </span>
          )}

          {/* Show default event indicator */}
          {isInDefaultEventRange && defaultEventsOnDate.length > 0 && (
            <div className="absolute top-1 right-1 group-hover:opacity-100 transition-opacity">
              <div className="relative">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {/* Tooltip on hover */}
                <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-10 w-48">
                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
                    {defaultEventsOnDate.map((evt, idx) => (
                      <div key={idx} className="mb-1 last:mb-0">
                        <div className="font-semibold">{evt.name}</div>
                        {evt.end_date && (
                          <div className="text-gray-300 text-[10px]">
                            {new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(evt.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {eventCount > 0 && (
            <div className="mt-1 flex flex-wrap gap-1 flex-1 items-start">
              {dayEvents.filter(event => !event.is_default_event).slice(0, 3).map((event, idx) => {
                const isHosted = currentUser && event.host && event.host.id === currentUser.id;
                return (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full ${
                      isHosted 
                        ? 'bg-red-500' 
                        : 'bg-green-500'
                    }`}
                    title={`${event.title} (${isHosted ? 'Hosting' : 'Invited'})`}
                  />
                );
              })}
              {dayEvents.filter(event => !event.is_default_event).length > 3 && (
                <span className="text-[10px] text-gray-600 font-semibold bg-gray-100 px-1.5 py-0.5 rounded-full">
                  +{dayEvents.filter(event => !event.is_default_event).length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full flex flex-col">
      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-5 flex-shrink-0">
        <button
          onClick={prevMonth}
          disabled={isAtMinDate}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
            isAtMinDate
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-gray-900">
          {monthNames[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          disabled={isAtMaxDate}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
            isAtMaxDate
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5 flex-shrink-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid - Fixed 6 rows */}
      <div className="grid grid-cols-7 grid-rows-6 gap-1.5 flex-1">
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
            <span className="text-gray-600 font-medium">Hosting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-gray-600 font-medium">Invited</span>
          </div>
        </div>
      </div>
    </div>
  );
}
