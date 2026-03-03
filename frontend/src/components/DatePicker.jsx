import { useState, useEffect } from 'react';

export default function DatePicker({ selectedDate, onDateSelect, minDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isDateDisabled = (day) => {
    const date = new Date(year, month, day);
    
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    // Check if date is Sunday (0 = Sunday)
    const isSunday = date.getDay() === 0;
    
    return date < today || isSunday;
  };

  const isDateSelected = (day) => {
    if (!selectedDate) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return selectedDate === dateStr;
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const handleDateClick = (day) => {
    if (isDateDisabled(day)) return;
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateSelect(dateStr);
    setIsOpen(false);
  };

  const formatDisplayDate = () => {
    if (!selectedDate) return 'Select date';
    const date = new Date(selectedDate + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderCalendarDays = () => {
    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const prevDay = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, prevDay);
      const isPrevSunday = prevDate.getDay() === 0;
      
      days.push(
        <div 
          key={`prev-${i}`} 
          className={`h-7 flex items-center justify-center text-xs ${
            isPrevSunday ? 'text-gray-200' : 'text-gray-300'
          }`}
        >
          {prevDay}
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isSunday = date.getDay() === 0;
      const disabled = isDateDisabled(day);
      const selected = isDateSelected(day);
      const today = isToday(day);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          disabled={disabled}
          title={isSunday ? 'Sundays are not available' : ''}
          className={`h-7 flex items-center justify-center text-xs rounded-md transition-all ${
            disabled
              ? 'text-gray-300 bg-gray-100 cursor-not-allowed'
              : selected
                ? 'bg-green-600 text-white font-bold shadow-sm'
                : today
                  ? 'bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200'
                  : 'text-gray-700 hover:bg-green-100 font-medium'
          }`}
        >
          {day}
        </button>
      );
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      const isNextSunday = nextDate.getDay() === 0;
      
      days.push(
        <div 
          key={`next-${day}`} 
          className={`h-7 flex items-center justify-center text-xs ${
            isNextSunday ? 'text-gray-200' : 'text-gray-300'
          }`}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.date-picker-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative date-picker-container">
      {/* Date Input Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg shadow-sm text-xs text-left focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-colors bg-white hover:bg-gray-50 flex items-center justify-between"
      >
        <span className={selectedDate ? 'text-gray-900' : 'text-gray-400'}>
          {formatDisplayDate()}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-64">
          {/* Legend */}
          <div className="mb-2 pb-2 border-b border-gray-200">
            <div className="flex items-center justify-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-green-600 rounded"></div>
                <span className="text-gray-600">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-gray-300 rounded"></div>
                <span className="text-gray-600">Unavailable</span>
              </div>
            </div>
            <div className="text-center mt-1 text-[10px] text-gray-500">
              Sundays are excluded
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-xs font-bold text-gray-900">
              {monthNames[month]} {year}
            </h3>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold py-1 text-gray-600"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {renderCalendarDays()}
          </div>
        </div>
      )}
    </div>
  );
}
