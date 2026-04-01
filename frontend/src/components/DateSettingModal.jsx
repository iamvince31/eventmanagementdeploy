import { useState, useEffect } from 'react';
import DatePicker from './DatePicker';

export default function DateSettingModal({ 
  isOpen, 
  onClose, 
  onSave, 
  event, 
  initialStartDate, 
  initialEndDate,
  minDate,
  maxDate,
  schoolYear 
}) {
  const [startDate, setStartDate] = useState(initialStartDate || '');
  const [endDate, setEndDate] = useState(initialEndDate || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Calculate the initial month to show in date picker based on event's month
  const getEventMonth = () => {
    if (!event) return null;
    
    // If event has a date, use that
    if (initialStartDate) {
      return initialStartDate;
    }
    
    // Otherwise, use the event's designated month and school year
    if (event.month && schoolYear) {
      const [startYear, endYear] = schoolYear.split('-').map(Number);
      // Determine which year to use based on month
      // Sept-Dec (9-12) use start year, Jan-Aug (1-8) use end year
      const year = event.month >= 9 ? startYear : endYear;
      // Return first day of the event's month
      return `${year}-${String(event.month).padStart(2, '0')}-01`;
    }
    
    return null;
  };

  const eventMonth = getEventMonth();

  useEffect(() => {
    if (isOpen) {
      setStartDate(initialStartDate || '');
      setEndDate(initialEndDate || '');
      setError('');
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Unlock body scroll
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialStartDate, initialEndDate]);

  // Calculate duration
  const getDuration = () => {
    if (!startDate) return null;
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end
    
    // Count Sundays in range
    let sundayCount = 0;
    const current = new Date(start);
    while (current <= end) {
      if (current.getDay() === 0) sundayCount++;
      current.setDate(current.getDate() + 1);
    }
    
    return {
      totalDays: diffDays,
      sundayCount,
      workingDays: diffDays - sundayCount
    };
  };

  const duration = getDuration();

  // Format date range for display
  const formatDateRange = () => {
    if (!startDate) return '';
    
    const start = new Date(startDate);
    const startFormatted = start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    if (!endDate) return startFormatted;
    
    const end = new Date(endDate);
    const endFormatted = end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    // If same month and year, show abbreviated format
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}, ${end.getFullYear()}`;
    }
    
    return `${startFormatted} - ${endFormatted}`;
  };

  const handleSave = async () => {
    // Validation
    if (!startDate) {
      setError('Please select a start date');
      return;
    }

    if (endDate && endDate < startDate) {
      setError('End date must be on or after the start date');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave(startDate, endDate || null);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save date');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !saving) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 px-6 py-4 flex-shrink-0 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 id="modal-title" className="text-lg font-bold text-white mb-0.5">
                Set Date for Academic Event
              </h2>
              <p className="text-green-100 text-sm font-medium truncate">
                {event?.name || 'Event'}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={saving}
              className="ml-4 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 disabled:opacity-50 flex-shrink-0"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - With proper spacing for dropdowns */}
        <div className="p-6 space-y-4 flex-shrink-0" style={{ minHeight: '420px' }}>
          {/* Error Alert */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start space-x-2 animate-shake">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-semibold text-red-800 flex-1">{error}</p>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* School Year Info */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-600 text-white rounded-lg p-2 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900">Academic Year {schoolYear}</p>
                <p className="text-xs text-blue-700">
                  September {schoolYear.split('-')[0]} - August {schoolYear.split('-')[1]}
                </p>
              </div>
            </div>
          </div>

          {/* Date Inputs */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <DatePicker
                selectedDate={startDate}
                onDateSelect={setStartDate}
                minDate={minDate}
                maxDate={maxDate}
                excludeSundays={true}
                size="medium"
                showQuickActions={false}
                initialMonth={eventMonth}
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                End Date <span className="text-gray-400 font-normal text-xs">(Optional)</span>
              </label>
              <DatePicker
                selectedDate={endDate}
                onDateSelect={setEndDate}
                minDate={startDate || minDate}
                maxDate={maxDate}
                excludeSundays={true}
                size="medium"
                showQuickActions={false}
                initialMonth={startDate || eventMonth}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex gap-3 flex-shrink-0 rounded-b-2xl">
          <button
            onClick={handleClose}
            disabled={saving}
            className="flex-1 px-5 py-2.5 border border-gray-300 text-sm font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !startDate}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Save Date
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
