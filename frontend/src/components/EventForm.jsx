import { useState, useEffect } from 'react';
import api from '../services/api';

export default function EventForm({ members, onEventCreated, editingEvent, onCancelEdit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const departments = ['HR', 'IT', 'Finance', 'Operations', 'Marketing'];

  useEffect(() => {
    // Set default date and time
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    if (!date) setDate(today);
    if (!time) setTime(currentTime);
  }, []);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || '');
      setDepartment(editingEvent.department || '');
      setLocation(editingEvent.location || '');
      setDate(editingEvent.date);
      setTime(editingEvent.time);
      setSelectedMembers(editingEvent.members.map(m => m.id));
      setIsOpen(editingEvent.is_open);
    }
  }, [editingEvent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        title,
        description,
        department,
        location,
        date,
        time,
        member_ids: selectedMembers,
        is_open: isOpen,
      };

      if (editingEvent) {
        await api.put(`/events/${editingEvent.id}`, payload);
        setSuccess('Event updated successfully');
      } else {
        await api.post('/events', payload);
        setSuccess('Event created successfully');
        resetForm();
      }

      onEventCreated();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDepartment('');
    setLocation('');
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().slice(0, 5));
    setSelectedMembers([]);
    setIsOpen(false);
  };

  const handleCancel = () => {
    resetForm();
    onCancelEdit();
    setError('');
    setSuccess('');
  };

  const toggleMember = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {editingEvent ? 'Edit Event' : 'Create Event / Invite Members'}
      </h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Event details..."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">-- Select Department --</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Conference Room A, Building 1"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Members</label>
          <div className="border border-gray-300 rounded-md p-3 bg-gray-50 max-h-40 overflow-y-auto">
            {members.length === 0 ? (
              <p className="text-sm text-gray-500">No members available</p>
            ) : (
              <div className="space-y-2">
                {members.map(member => (
                  <label
                    key={member.id}
                    className="flex items-center p-2 hover:bg-blue-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => toggleMember(member.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {member.username} ({member.email})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isOpen}
              onChange={(e) => setIsOpen(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Open Event (everyone can join)
            </span>
          </label>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
          </button>
          {editingEvent && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
