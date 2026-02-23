import { useState } from 'react';

export default function Calendar({ events, onDateSelect, highlightedDate }) {
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

      // Check if this date has ACADEMIC CALENDAR events (for green highlighting)
      const hasAcademicEvents = isCurrentMonth && dayEvents.some(event => event.is_academic_calendar === true);

      days.push(
        <div
          key={`${cellYear}-${cellMonth}-${cellDay}`}
          onClick={() => {
            if (isCurrentMonth) {
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
              ? `cursor-pointer ${isCurrentDay
                  ? 'bg-green-100 border-2 border-green-600 shadow-sm'
                  : hasAcademicEvents
                    ? 'bg-green-50 border border-green-300 hover:border-green-500 hover:shadow-md hover:bg-green-100'
                    : 'bg-white border border-gray-200 hover:border-green-400 hover:shadow-md'
                }`
              : 'bg-gray-50/30 border border-gray-100 cursor-default'
            }
            ${selected ? 'ring-2 ring-green-500 ring-offset-1' : ''}
            ${highlighted ? 'ring-4 ring-green-400 ring-offset-2 animate-pulse bg-green-50' : ''}
            ${isPast && isCurrentMonth ? 'opacity-40' : ''}
            ${isOtherMonth ? 'opacity-30' : ''}
          `}
        >
          <div className={`
            text-sm font-semibold flex-shrink-0
            ${isCurrentMonth 
              ? (isCurrentDay 
                  ? 'text-green-800' 
                  : hasAcademicEvents 
                    ? 'text-green-700' 
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

          {eventCount > 0 && (
            <div className="mt-1 flex flex-wrap gap-1 flex-1">
              {dayEvents.slice(0, 2).map((event, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    event.has_pending_reschedule_requests 
                      ? 'bg-orange-500' 
                      : (event.is_open 
                          ? 'bg-blue-500' 
                          : (idx === 0 ? 'bg-green-600' : 'bg-green-500')
                        )
                  }`}
                  title={event.title}
                />
              ))}
              {eventCount > 2 && (
                <span className="text-[10px] text-gray-500 font-medium">+{eventCount - 2}</span>
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
    </div>
  );
}
