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

  // Check if we're at the boundaries of 2026
  const isAtStartOf2026 = year === 2026 && month === 0; // January 2026
  const isAtEndOf2026 = year === 2026 && month === 11; // December 2026

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    // Restrict to 2026 only - don't go before January 2026
    if (newDate.getFullYear() >= 2026) {
      setCurrentDate(newDate);
    }
  };

  const nextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    // Restrict to 2026 only - don't go after December 2026
    if (newDate.getFullYear() <= 2026) {
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

    // Empty cells before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[72px] bg-gray-50/50 rounded-lg"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDate(day);
      const isCurrentDay = isToday(day);
      const selected = isSelected(day);
      const highlighted = isHighlighted(day);

      const cellDate = new Date(year, month, day);
      cellDate.setHours(0, 0, 0, 0);
      const isPast = cellDate < today;

      const eventCount = !isPast ? dayEvents.length : 0;

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`
            min-h-[72px] p-2 rounded-lg cursor-pointer transition-all duration-200 relative group
            ${isCurrentDay
              ? 'bg-green-100 border-2 border-green-600 shadow-sm'
              : 'bg-white border border-gray-200 hover:border-green-400 hover:shadow-md'}
            ${selected ? 'ring-2 ring-green-500 ring-offset-1' : ''}
            ${highlighted ? 'ring-4 ring-green-400 ring-offset-2 animate-pulse bg-green-50' : ''}
            ${isPast ? 'opacity-40 cursor-default' : ''}
          `}
        >
          <div className={`
            text-sm font-semibold
            ${isCurrentDay ? 'text-green-800' : 'text-gray-700'}
            ${selected ? 'text-green-700' : ''}
          `}>
            {day}
          </div>

          {isCurrentDay && (
            <span className="absolute top-1.5 right-2 text-[10px] font-bold text-green-600 uppercase tracking-wide">
              Today
            </span>
          )}

          {eventCount > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {dayEvents.slice(0, 3).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-green-600' : idx === 1 ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                />
              ))}
              {eventCount > 3 && (
                <span className="text-[10px] text-gray-500 font-medium">+{eventCount - 3}</span>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full">
      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-5">
        <button
          onClick={prevMonth}
          disabled={isAtStartOf2026}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
            isAtStartOf2026
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
          disabled={isAtEndOf2026}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
            isAtEndOf2026
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
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {renderCalendarDays()}
      </div>
    </div>
  );
}
