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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Events</h2>
          <p className="text-sm text-gray-500 mt-1">
            {date ? formatDate(date) : 'No date selected'}
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
          <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-600 font-medium">
            {date ? 'No events on this date' : 'Select a date to view events'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Events</h2>
            <p className="text-sm text-gray-500 mt-1">{formatDate(date)}</p>
          </div>
          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {events.length}
          </span>
        </div>
      </div>

      {/* Event List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {events.map((event, idx) => (
            <div
              key={event.id || idx}
              onClick={() => onView && onView(event)}
              className={`px-6 py-4 transition-colors ${event.is_default_event ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'} ${
                event.has_pending_reschedule_requests
                  ? 'bg-orange-50/50'
                  : event.is_open
                    ? 'bg-blue-50/30'
                    : event.is_default_event
                      ? 'bg-blue-50/20'
                      : ''
              }`}
            >
              {/* Title and Badges */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-medium text-gray-900 text-sm flex-1 truncate">
                  {event.title}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {currentUser && event.host.id === currentUser.id && !event.is_default_event && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      Owner
                    </span>
                  )}
                  {event.is_default_event && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      Academic
                    </span>
                  )}
                  {event.has_pending_reschedule_requests && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 animate-pulse">
                      Reschedule
                    </span>
                  )}
                </div>
              </div>

              {/* Meta Information */}
              <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {event.time}
                </span>
                {event.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location}
                  </span>
                )}
              </div>

              {/* Date Range for Academic Events */}
              {event.is_default_event && event.end_date && (
                <div className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded mb-3">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              )}

              {/* Action Buttons */}
              {currentUser && event.host.id === currentUser.id && !event.is_default_event && (
                <div className="flex gap-2 pt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(event);
                    }}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors"
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
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
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
    </div>
  );
}
