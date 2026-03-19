import { useState, useEffect, useRef } from 'react';

export default function DatePicker({ selectedDate, onDateSelect, minDate, maxDate, className = '', excludeSundays = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const datePickerRef = useRef(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date to YYYY-MM-DD without timezone conversion
  const formatDateString = (year, month, day) => {
    const yyyy = year;
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Check if a date is disabled
  const isDateDisable = (year, month, day) => {
    const dateString = formatDateString(year, month, day);

    if (minDate && dateString < minDate) return true;
    if (maxDate && dateString > maxDate) return true;

    if (excludeSundays) {
      const date = new Date(year, month, day);
      if (date.getDay() === 0) return true;
    }

    return false;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const day = currentDate.getDate();
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.toDateString() === new Date().toDateString();
      const dateString = formatDateString(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isSelected = dateString === selectedDate;
      const isDisabled = isDateDisable(currentDate.getFullYear(), currentDate.getMonth(), day);

      days.push({
        day,
        date: new Date(currentDate),
        dateString,
        isCurrentMonth,
        isToday,
        isSelected,
        isDisabled,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const handleDateClick = (dateString) => {
    onDateSelect(dateString);
    setIsOpen(false);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const days = generateCalendarDays();

  const getDisplayValue = () => {
    if (!selectedDate) return null;
    const date = new Date(selectedDate + 'T00:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className={`relative ${className}`} ref={datePickerRef}>
      {/* Date Input Field */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm text-left bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className={getDisplayValue() ? 'text-gray-900' : 'text-gray-400'}>
            {getDisplayValue() || 'Select date...'}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-full max-w-md">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h3 className="text-sm font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>

            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-xs font-medium text-gray-500 text-center py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((dayObj, index) => (
              <button
                key={index}
                type="button"
                onClick={() => !dayObj.isDisabled && dayObj.isCurrentMonth && handleDateClick(dayObj.dateString)}
                disabled={dayObj.isDisabled || !dayObj.isCurrentMonth}
                className={`
                  h-8 w-8 text-xs rounded transition-colors
                  ${dayObj.isCurrentMonth
                    ? dayObj.isDisabled
                      ? 'text-gray-300 cursor-not-allowed bg-gray-100'
                      : dayObj.isSelected
                        ? 'bg-green-600 text-white font-semibold'
                        : dayObj.isToday
                          ? 'bg-blue-100 text-blue-800 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                    : 'text-gray-300 cursor-default'
                  }
                `}
              >
                {dayObj.day}
              </button>
            ))}
          </div>

          {/* Today Button */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const todayString = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());
                if (!isDateDisable(today.getFullYear(), today.getMonth(), today.getDate())) {
                  handleDateClick(todayString);
                }
              }}
              disabled={(() => {
                const today = new Date();
                return isDateDisable(today.getFullYear(), today.getMonth(), today.getDate());
              })()}
              className="w-full px-3 py-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Today
            </button>
          </div>

          {/* Legend */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-100 rounded"></div>
                <span>{excludeSundays ? 'Unavailable dates' : 'Past dates unavailable'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
