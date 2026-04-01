import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { invalidateCache } from '../services/cache';
import DatePicker from './DatePicker';

export default function PersonalEventModal({ isOpen, onClose, onSuccess, editingEvent = null, selectedDate = '' }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: editingEvent?.title || '',
        description: editingEvent?.description || '',
        date: editingEvent?.date || selectedDate,
        time: editingEvent?.time || ''
      });
      setMessage({ type: '', text: '' });
      setIsDatePickerOpen(false);
    }
  }, [isOpen, editingEvent, selectedDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (message.type === 'error') {
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate date is selected
    if (!formData.date) {
      setMessage({ 
        type: 'error', 
        text: 'Please select a date for the event.' 
      });
      return;
    }
    
    setLoading(true);

    try {
      if (editingEvent) {
        await api.put(`/personal-events/${editingEvent.id}`, formData);
        setMessage({ 
          type: 'success', 
          text: 'Personal event updated successfully!' 
        });
      } else {
        await api.post('/personal-events', formData);
        setMessage({ 
          type: 'success', 
          text: 'Personal event created successfully!' 
        });
      }

      setTimeout(() => {
        invalidateCache(`dashboard:${user?.id}`);
        onSuccess?.();
        onClose();
      }, 1500);

    } catch (error) {
      console.error(`Error ${editingEvent ? 'updating' : 'creating'} personal event:`, error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || `Failed to ${editingEvent ? 'update' : 'create'} personal event. Please try again.` 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden ${isDatePickerOpen ? '' : 'overflow-y-auto'}`}>
        <div className="sticky top-0 bg-gradient-to-r from-green-700 via-green-600 to-green-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">
              {editingEvent ? 'Edit' : 'Create'} Personal Event
            </h3>
            <p className="text-green-200 text-sm mt-1">
              {editingEvent ? 'Update your' : 'Add a'} private event to your calendar. Only you can see this event.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {message.text && (
          <div className={`mx-6 mt-4 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
            message.type === 'success'
              ? 'bg-green-50/80 text-green-800 border-green-300 shadow-lg shadow-green-500/20'
              : 'bg-red-50/80 text-red-800 border-red-300 shadow-lg shadow-red-500/20'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-semibold">{message.text}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5" style={{ minHeight: '420px' }}>
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-300"
              placeholder="Enter event title"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-300"
              placeholder="Add notes or details about this event"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-semibold text-gray-900 mb-2">
                Date *
              </label>
              <DatePicker
                selectedDate={formData.date}
                onDateSelect={(date) => setFormData(prev => ({ ...prev, date }))}
                excludeSundays={false}
                size="medium"
                showQuickActions={false}
                onOpenChange={setIsDatePickerOpen}
                dropdownDirection="up"
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-semibold text-gray-900 mb-2">
                Time *
              </label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-300"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.date}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-700 to-green-800 text-white font-semibold rounded-lg hover:from-green-800 hover:to-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editingEvent ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingEvent ? 'Update Personal Event' : 'Create Personal Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
