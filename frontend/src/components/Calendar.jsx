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

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
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
              ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
              : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md'}
            ${selected ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
            ${highlighted ? 'ring-4 ring-green-400 ring-offset-2 animate-pulse bg-green-50' : ''}
            ${isPast ? 'opacity-40 cursor-default' : ''}
          `}
        >
          <div className={`
            text-sm font-semibold
            ${isCurrentDay ? 'text-blue-700' : 'text-gray-700'}
            ${selected ? 'text-blue-600' : ''}
          `}>
            {day}
          </div>

          {isCurrentDay && (
            <span className="absolute top-1.5 right-2 text-[10px] font-bold text-blue-500 uppercase tracking-wide">
              Today
            </span>
          )}

          {eventCount > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {dayEvents.slice(0, 3).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-green-500' : 'bg-amber-500'
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
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
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
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
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
