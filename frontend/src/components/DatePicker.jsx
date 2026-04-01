import { useState, useEffect, useRef } from 'react';

export default function DatePicker({ 
  selectedDate, 
  onDateSelect, 
  minDate, 
  maxDate, 
  className = '', 
  excludeSundays = true,
  size = 'medium', // 'small', 'medium', 'large'
  showQuickActions = true,
  highlightedDates = [], // Array of {date: string, color: string, label: string}
  initialMonth = null, // Optional: Date object or date string to set initial month
  onOpenChange = null, // Optional: Callback when dropdown opens/closes
  dropdownDirection = 'down' // 'up' or 'down' - controls where the calendar appears
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize currentMonth based on initialMonth, selectedDate, or current date
  const getInitialMonth = () => {
    if (initialMonth) {
      return typeof initialMonth === 'string' ? new Date(initialMonth) : initialMonth;
    }
    if (selectedDate) {
      return new Date(selectedDate);
    }
    return new Date();
  };
  
  const [currentMonth, setCurrentMonth] = useState(getInitialMonth());
  const datePickerRef = useRef(null);
  const [focusedDate, setFocusedDate] = useState(null);

  // Notify parent when dropdown opens/closes
  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);

  // Update currentMonth when initialMonth changes
  useEffect(() => {
    if (initialMonth) {
      const month = typeof initialMonth === 'string' ? new Date(initialMonth) : initialMonth;
      setCurrentMonth(month);
    }
  }, [initialMonth]);

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

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || !focusedDate) return;

    const handleKeyDown = (e) => {
      const currentDate = new Date(focusedDate);
      let newDate = new Date(currentDate);

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          newDate.setDate(currentDate.getDate() - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newDate.setDate(currentDate.getDate() + 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newDate.setDate(currentDate.getDate() - 7);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newDate.setDate(currentDate.getDate() + 7);
          break;
        case 'Enter':
          e.preventDefault();
          const dateString = formatDateString(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
          if (!isDateDisable(newDate.getFullYear(), newDate.getMonth(), newDate.getDate())) {
            handleDateClick(dateString);
          }
          return;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          return;
        default:
          return;
      }

      // Update focused date and current month if needed
      setFocusedDate(formatDateString(newDate.getFullYear(), newDate.getMonth(), newDate.getDate()));
      if (newDate.getMonth() !== currentMonth.getMonth() || newDate.getFullYear() !== currentMonth.getFullYear()) {
        setCurrentMonth(newDate);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedDate, currentMonth]);

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
    setFocusedDate(dateString);
    setIsOpen(false);
  };

  // Initialize focused date when opening
  useEffect(() => {
    if (isOpen) {
      setFocusedDate(selectedDate || formatDateString(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
    }
  }, [isOpen]);

  // Check if date is highlighted
  const getHighlightInfo = (dateString) => {
    return highlightedDates.find(h => h.date === dateString);
  };

  // Get size-specific classes
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          cell: 'h-8 w-8 text-xs',
          calendar: 'max-w-xs',
          padding: 'p-3'
        };
      case 'large':
        return {
          cell: 'h-12 w-12 text-base',
          calendar: 'max-w-lg',
          padding: 'p-6'
        };
      default: // medium
        return {
          cell: 'h-10 w-10 text-sm',
          calendar: 'max-w-md',
          padding: 'p-4'
        };
    }
  };

  const sizeClasses = getSizeClasses();

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
        <div 
          className={`absolute z-50 ${dropdownDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 animate-fade-in`}
          role="dialog"
          aria-label="Date picker calendar"
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200"
              aria-label="Previous month"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h3 className="text-sm font-bold text-gray-900" aria-live="polite">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>

            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200"
              aria-label="Next month"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, idx) => (
              <div 
                key={day} 
                className={`text-xs font-bold text-center py-1 ${idx === 0 || idx === 6 ? 'text-amber-600' : 'text-gray-600'}`}
                aria-label={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][idx]}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid - Fixed 6 rows */}
          <div className="grid grid-cols-7 gap-1" role="grid">
            {days.map((dayObj, index) => {
              const highlight = getHighlightInfo(dayObj.dateString);
              const isFocused = focusedDate === dayObj.dateString;
              const isWeekend = dayObj.date.getDay() === 0 || dayObj.date.getDay() === 6;
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => !dayObj.isDisabled && dayObj.isCurrentMonth && handleDateClick(dayObj.dateString)}
                  disabled={dayObj.isDisabled || !dayObj.isCurrentMonth}
                  onMouseEnter={() => dayObj.isCurrentMonth && setFocusedDate(dayObj.dateString)}
                  className={`
                    h-9 w-9 text-xs rounded-lg transition-all duration-200 font-medium relative
                    ${dayObj.isCurrentMonth
                      ? dayObj.isDisabled
                        ? 'text-gray-300 cursor-not-allowed bg-gray-50 line-through'
                        : dayObj.isSelected
                          ? 'bg-green-600 text-white font-bold shadow-md ring-2 ring-green-300'
                          : dayObj.isToday
                            ? 'bg-blue-500 text-white font-bold shadow-sm ring-2 ring-blue-300'
                            : isFocused
                              ? 'bg-green-100 text-green-900 font-semibold ring-2 ring-green-400'
                              : isWeekend
                                ? 'text-gray-700 hover:bg-amber-50'
                                : 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-300 cursor-default'
                    }
                    ${highlight ? 'ring-2' : ''}
                  `}
                  style={highlight ? { backgroundColor: highlight.color + '40', borderColor: highlight.color } : {}}
                  aria-label={`${dayObj.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}${dayObj.isSelected ? ', selected' : ''}${dayObj.isToday ? ', today' : ''}${dayObj.isDisabled ? ', unavailable' : ''}`}
                  aria-selected={dayObj.isSelected}
                  role="gridcell"
                  tabIndex={isFocused ? 0 : -1}
                >
                  {dayObj.day}
                  {highlight && (
                    <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-current"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
