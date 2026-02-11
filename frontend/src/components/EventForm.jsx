import { useState, useEffect } from 'react';
import api from '../services/api';

export default function EventForm({ members, onEventCreated, editingEvent, onCancelEdit, defaultDate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [searchMember, setSearchMember] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    if (!date) setDate(defaultDate || today);
    if (!time) setTime(currentTime);
  }, [defaultDate]);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || '');
      setLocation(editingEvent.location || '');
      setImagePreviews(editingEvent.images || []);
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
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('location', location);
      formData.append('date', date);
      formData.append('time', time);
      formData.append('is_open', isOpen ? '1' : '0');

      images.forEach((image) => {
        formData.append('images[]', image);
      });

      selectedMembers.forEach(id => {
        formData.append('member_ids[]', id);
      });

      if (editingEvent) {
        await api.post(`/events/${editingEvent.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: { _method: 'PUT' }
        });
        setSuccess('Event updated successfully');
      } else {
        await api.post('/events', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
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
    setLocation('');
    setImages([]);
    setImagePreviews([]);
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    addImages(files);
  };

  const addImages = (files) => {
    if (files.length > 0) {
      setImages(prev => [...prev, ...files]);

      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );
    addImages(files);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const filteredMembers = filterDepartment === 'all'
    ? members
    : members.filter(member => member.department === filterDepartment);

  // Further filter by search term
  const searchFilteredMembers = filteredMembers.filter(member =>
    member.username.toLowerCase().includes(searchMember.toLowerCase()) ||
    member.email.toLowerCase().includes(searchMember.toLowerCase())
  );

  const availableDepartments = [...new Set(members.map(m => m.department).filter(Boolean))];

  return (
    <div className="animate-fade-in">

      {/* Error Alert */}
      {error && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-4 flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="mb-5 rounded-xl bg-green-50 border border-green-200 p-4 flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Event Details Box (1/3 width) */}
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-5">
              <div className="bg-blue-50 rounded-lg p-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">Event Details</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter event title"
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event details..."
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Conference Room A"
                    className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={isOpen}
                    onChange={(e) => setIsOpen(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2.5 text-sm text-gray-700 font-medium">
                    Open Event
                  </span>
                  <span className="ml-1 text-xs text-gray-400">(everyone can join)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Members and Images (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Members List Box */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="bg-purple-50 rounded-lg p-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Invite Members</h3>
                </div>
                {selectedMembers.length > 0 && (
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                    {selectedMembers.length} selected
                  </span>
                )}
              </div>

              

              {/* Search Bar */}
              <div className="mb-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search members by name or email..."
                    value={searchMember}
                    onChange={(e) => setSearchMember(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchMember && (
                    <button
                      type="button"
                      onClick={() => setSearchMember('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {/* Department Filter */}
              <div className="mb-3">
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                >
                  <option value="all">All Departments</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="border border-gray-200 rounded-lg bg-gray-50/50 h-48 overflow-y-auto">
                {searchFilteredMembers.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-gray-400">
                      {searchMember ? 'No members found' : 'No members available'}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {searchFilteredMembers.map(member => (
                      <label
                        key={member.id}
                        className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-colors ${selectedMembers.includes(member.id)
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-white border border-transparent'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => toggleMember(member.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2.5 text-sm text-gray-700 font-medium">
                          {member.username}
                          {member.department && (
                            <span className="ml-2 text-xs text-gray-400 font-normal">({member.department})</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Event Images Box */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-amber-50 rounded-lg p-2">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900">Event Images</h3>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-4 transition-all duration-200 ${isDragging
                    ? 'border-blue-400 bg-blue-50/50 scale-[1.01]'
                    : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                  }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />

                <div className="flex gap-3 overflow-x-auto pb-2">
                  {/* Add Image Button */}
                  <label
                    htmlFor="image-upload"
                    className="flex-shrink-0 w-28 h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 flex items-center justify-center group"
                  >
                    <div className="text-center">
                      <svg className="mx-auto h-7 w-7 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="mt-1 text-xs text-gray-400 group-hover:text-blue-500 font-medium">Add</span>
                    </div>
                  </label>

                  {/* Image Previews */}
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative flex-shrink-0 group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-28 h-28 object-cover rounded-xl border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {imagePreviews.length === 0 && (
                  <p className="text-center text-xs text-gray-400 mt-2">
                    Drag & drop or click + to add images
                  </p>
                )}
              </div>

              {imagePreviews.length > 0 && (
                <p className="mt-2 text-xs text-gray-400">
                  {imagePreviews.length} image{imagePreviews.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center px-5 py-3 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : editingEvent ? (
              <>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Event
              </>
            )}
          </button>
          {editingEvent && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-3 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
