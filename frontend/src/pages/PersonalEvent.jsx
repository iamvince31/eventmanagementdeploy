import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { invalidateCache } from '../services/cache';
import Navbar from '../components/Navbar';

export default function PersonalEvent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [userSchedules, setUserSchedules] = useState([]);
  const editingEvent = location.state?.event || null;
  const selectedDate = location.state?.selectedDate || '';
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: editingEvent?.title || '',
    description: editingEvent?.description || '',
    date: editingEvent?.date || selectedDate || today,
    time: editingEvent?.time || ''
  });

  useEffect(() => {
    if (user && !user.is_validated) { navigate('/account'); return; }
    api.get('/schedules').then(r => setUserSchedules(r.data.schedules || [])).catch(() => {});
  }, []);

  const parseMin = (t) => { if (!t) return null; const [h, m] = t.split(':'); return parseInt(h) * 60 + parseInt(m || 0); };
  const fmtTime = (t) => { if (!t) return ''; const [h, m] = t.split(':'); const hour = parseInt(h); return `${hour % 12 || 12}:${m || '00'} ${hour >= 12 ? 'PM' : 'AM'}`; };

  const conflictingSchedules = (() => {
    if (!formData.date || !formData.time) return [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const [year, month, day] = formData.date.split('-').map(Number);
    const dayName = dayNames[new Date(year, month - 1, day).getDay()];
    const evStart = parseMin(formData.time);
    if (evStart === null) return [];
    const evEnd = evStart + 60;
    return userSchedules.filter(s => {
      if (s.day !== dayName) return false;
      const sStart = parseMin(s.start_time);
      const sEnd = parseMin(s.end_time);
      if (sStart === null || sEnd === null) return false;
      return evStart < sEnd && sStart < evEnd;
    });
  })();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'date' && value) {
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (message.type === 'error') {
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingEvent) {
        // Update existing personal event
        await api.put(`/personal-events/${editingEvent.id}`, {
          title: formData.title,
          description: formData.description,
          date: formData.date,
          time: formData.time
        });

        setMessage({ 
          type: 'success', 
          text: 'Personal event updated successfully!' 
        });
      } else {
        // Create new personal event
        await api.post('/personal-events', {
          title: formData.title,
          description: formData.description,
          date: formData.date,
          time: formData.time
        });

        setMessage({ 
          type: 'success', 
          text: 'Personal event created successfully!' 
        });
      }

      setTimeout(() => {
        invalidateCache(`dashboard:${user?.id}`);
        navigate('/dashboard', { state: { refresh: Date.now() } });
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

    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50">
      <Navbar isLoading={loading} />

      {/* Main Content */}
      <main className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">{editingEvent ? 'Edit' : 'Create'} Personal Event</h2>
            <p className="text-lg text-gray-600 font-medium">
              {editingEvent ? 'Update your' : 'Add a'} private event to your calendar. Only you can see this event.
            </p>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
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

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 px-8 py-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Event Details
              </h3>
              <p className="text-green-200 text-sm mt-1">
                This event will only be visible to you
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
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

              {/* Schedule Conflict Banner */}
              {conflictingSchedules.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                  <div className="flex items-start gap-2.5">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-800 mb-1">Schedule Conflict — This personal event overlaps with your class</p>
                      <div className="space-y-1">
                        {conflictingSchedules.map((s, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-red-700">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color || '#f97316' }} />
                            <span className="font-medium">{s.description || s.title || 'Class'}</span>
                            <span className="text-red-400">·</span>
                            <span>{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-semibold text-gray-900 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    min={today}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-300"
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

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-700 to-green-800 text-white font-semibold rounded-lg hover:from-green-800 hover:to-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    editingEvent ? 'Update Personal Event' : 'Create Personal Event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
