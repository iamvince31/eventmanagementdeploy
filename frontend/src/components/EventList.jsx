import { useState, useEffect } from 'react';
import api from '../services/api';

export default function EventList({ events, currentUser, onEdit, onRefresh }) {
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState({});

  useEffect(() => {
    // Fetch availability for all members in all events
    events.forEach(event => {
      event.members.forEach(member => {
        fetchAvailability(event.id, member.id);
      });
    });
  }, [events]);

  const fetchAvailability = async (eventId, userId) => {
    const key = `${eventId}-${userId}`;
    setLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      const response = await api.get(`/events/${eventId}/users/${userId}/availability`);
      setAvailability(prev => ({
        ...prev,
        [key]: response.data.available,
      }));
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const getAvailabilityStatus = (eventId, userId) => {
    const key = `${eventId}-${userId}`;
    if (loading[key]) return 'checking...';
    if (availability[key] === undefined) return 'checking...';
    return availability[key] ? 'Available' : 'Busy';
  };

  const getAvailabilityClass = (eventId, userId) => {
    const key = `${eventId}-${userId}`;
    if (loading[key] || availability[key] === undefined) {
      return 'text-gray-500 italic';
    }
    return availability[key] ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Events / Calendar</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Refresh Events
        </button>
      </div>

      {events.length === 0 ? (
        <p className="text-gray-500">No events yet.</p>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <div
              key={event.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {event.title} — {event.date} {event.time}
                </h3>
                {currentUser && event.host.id === currentUser.id && (
                  <button
                    onClick={() => onEdit(event)}
                    className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                  >
                    Edit
                  </button>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {event.description && (
                  <p>
                    <span className="font-medium">Description:</span> {event.description}
                  </p>
                )}
                {event.department && (
                  <p>
                    <span className="font-medium">Department:</span> {event.department}
                  </p>
                )}
                {event.location && (
                  <p>
                    <span className="font-medium">Location:</span> {event.location}
                  </p>
                )}
                {event.is_open && (
                  <p className="text-green-600 font-medium">
                    Open Event - Everyone can join
                  </p>
                )}
                <p>
                  <span className="font-medium">Host:</span> {event.host.username} ({event.host.email})
                </p>
              </div>

              <div className="mt-4">
                <p className="font-medium text-sm mb-2">Members:</p>
                <ul className="list-disc list-inside space-y-1">
                  {event.members.map(member => (
                    <li
                      key={member.id}
                      className={`text-sm ${getAvailabilityClass(event.id, member.id)}`}
                    >
                      {member.username} — {getAvailabilityStatus(event.id, member.id)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
