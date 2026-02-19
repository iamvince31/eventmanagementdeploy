export default function EventDetails({ date, events, members, currentUser, onEdit, onDelete, onView }) {
  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!date || events.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 h-full flex flex-col">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Events</h2>
        <p className="text-xs text-gray-400 mb-6">
          {date ? formatDate(date) : 'No date selected'}
        </p>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="bg-gray-50 rounded-full p-4 mb-4">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400 font-medium">
            {date ? 'No events on this date' : 'Select a date to view events'}
          </p>
          <p className="text-xs text-gray-300 mt-1">
            Click any date on the calendar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Events</h2>
          <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{formatDate(date)}</p>
      </div>

      {/* Event List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {events.map((event, idx) => (
          <div
            key={event.id || idx}
            onClick={() => onView && onView(event)}
            className={`border rounded-xl p-4 transition-all duration-200 group cursor-pointer ${event.has_pending_reschedule_requests
              ? 'bg-orange-50 border-orange-400 hover:bg-orange-100 ring-1 ring-orange-200'
              : event.is_open
                ? 'bg-blue-50 border-blue-500 hover:bg-blue-100'
                : 'bg-gray-50 border-gray-100 hover:bg-green-100/50 hover:border-green-300'
              }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {event.title}
                  </p>
                  {event.has_pending_reschedule_requests && (
                    <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 animate-pulse">
                      Reschedule
                    </span>
                  )}
                </div>
                <div className="flex items-center mt-1.5 space-x-3">
                  <span className="inline-flex items-center text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {event.time}
                  </span>
                  {event.location && (
                    <span className="inline-flex items-center text-xs text-gray-500">
                      <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {currentUser && event.host.id === currentUser.id && (
              <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-200/60">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(event);
                  }}
                  className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-green-800 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(event);
                  }}
                  className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
