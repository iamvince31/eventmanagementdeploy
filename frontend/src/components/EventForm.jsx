import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import DatePicker from './DatePicker';

const SELECT_ALL_THRESHOLD = 10; // show confirmation if selecting more than this many

export default function EventForm({ members, onEventCreated, editingEvent, onCancelEdit, defaultDate, currentUser }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState('event');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [date, setDate] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [time, setTime] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [searchMember, setSearchMember] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState('');
  // Select All undo toast
  const [undoToast, setUndoToast] = useState(null); // { prevSelection, count, timerId }
  // Select All confirmation (for large lists)
  const [selectAllConfirm, setSelectAllConfirm] = useState(null); // { ids } | null
  const undoTimerRef = useRef(null);

  // Calculate school year based on date
  const getSchoolYearFromDate = (dateString) => {
    if (!dateString) return '';
    
    const dateObj = new Date(dateString);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // 1-12
    
    // If we're in Sept-Dec, school year is current-next
    // If we're in Jan-Aug, school year is previous-current
    if (month >= 9) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };

  // Auto-update school year when date changes
  useEffect(() => {
    if (date) {
      const calculatedSchoolYear = getSchoolYearFromDate(date);
      setSchoolYear(calculatedSchoolYear);
    }
  }, [date]);

  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    if (!date) {
      setDate(defaultDate || today);
      const initialSchoolYear = getSchoolYearFromDate(defaultDate || today);
      setSchoolYear(initialSchoolYear);
    }
    if (!time) setTime(currentTime);
  }, [defaultDate]);

  const validateDateTime = () => {
    const now = new Date();
    const selectedDateTime = new Date(`${date}T${time}`);
    
    if (selectedDateTime < now) {
      setError('Cannot set event date/time in the past');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  const handleTimeChange = (newTime) => {
    setTime(newTime);
  };

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || '');
      setLocation(editingEvent.location || '');
      setEventType(editingEvent.event_type || 'event');
      setImagePreviews(editingEvent.images || []);
      setDate(editingEvent.date);
      setTime(editingEvent.time);
      setSchoolYear(editingEvent.school_year || getSchoolYearFromDate(editingEvent.date));
      setSelectedMembers(editingEvent.members.map(m => m.id));
      setIsUrgent(editingEvent.is_urgent ?? false);
    }
  }, [editingEvent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateDateTime()) return;

    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('location', location);
    formData.append('event_type', eventType);
    formData.append('date', date);
    formData.append('time', time);
    formData.append('school_year', getSchoolYearFromDate(date));
    formData.append('is_urgent', isUrgent ? '1' : '0');
    images.forEach((image) => formData.append('images[]', image));
    selectedMembers.forEach(id => formData.append('member_ids[]', id));

    try {
      if (editingEvent) {
        await api.post(`/events/${editingEvent.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: { _method: 'PUT' }
        });
        setSuccess('Event updated successfully');
      } else {
        try {
          await api.post('/events', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (err) {
          if (err.response?.status === 409 && err.response?.data?.warning === 'schedule_conflict') {
            formData.append('ignore_conflicts', 'true');
            await api.post('/events', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          } else {
            throw err;
          }
        }
        setSuccess('Event created successfully');
        resetForm();
      }
      onEventCreated();
    } catch (err) {
      console.error('Error saving event:', err.response?.data);
      setError(err.response?.data?.error || err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setEventType('event');
    setImages([]);
    setImagePreviews([]);
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().slice(0, 5));
    setSelectedMembers([]);
    setIsUrgent(false);
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

  const handleSelectAll = () => {
    const allFilteredIds = searchFilteredMembers.map(m => m.id);
    const allSelected = allFilteredIds.every(id => selectedMembers.includes(id));

    if (allSelected) {
      // Deselect all — no confirmation needed, just do it
      const prev = [...selectedMembers];
      setSelectedMembers(prev.filter(id => !allFilteredIds.includes(id)));
      return;
    }

    const newIds = allFilteredIds.filter(id => !selectedMembers.includes(id));

    // Option 3: show confirmation if adding more than threshold
    if (newIds.length > SELECT_ALL_THRESHOLD) {
      setSelectAllConfirm({ ids: newIds });
      return;
    }

    // Option 2: do it immediately + show undo toast
    doSelectAll(newIds);
  };

  const doSelectAll = (newIds) => {
    const prevSelection = [...selectedMembers];
    setSelectedMembers(prev => [...prev, ...newIds]);

    // Clear any existing undo timer
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    const timerId = setTimeout(() => {
      setUndoToast(null);
    }, 4000);
    undoTimerRef.current = timerId;

    setUndoToast({ prevSelection, count: newIds.length, timerId });
  };

  const handleUndoSelectAll = () => {
    if (!undoToast) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setSelectedMembers(undoToast.prevSelection);
    setUndoToast(null);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    validateAndAddImages(files);
  };

  const validateAndAddImages = (files) => {
    setFileError('');

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    const maxSize = 25 * 1024 * 1024; // 25MB
    const maxFiles = 5;

    // Check if adding these files would exceed the limit
    if (images.length + files.length > maxFiles) {
      setFileError(`Maximum ${maxFiles} files allowed. You can only add ${maxFiles - images.length} more.`);
      return;
    }

    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      // Check file type
      if (!validTypes.includes(file.type)) {
        errors.push(`"${file.name}" is not a valid file. Only JPG, PNG, GIF, WebP, and PDF are allowed.`);
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        errors.push(`"${file.name}" is too large (${sizeMB}MB). Maximum size is 25MB.`);
        return;
      }

      validFiles.push(file);
    });

    // Show errors if any
    if (errors.length > 0) {
      setFileError(errors.join(' '));

      // Clear error after 5 seconds
      setTimeout(() => setFileError(''), 5000);
    }

    // Add valid files
    if (validFiles.length > 0) {
      addImages(validFiles);
    }
  };

  const addImages = (files) => {
    if (files.length > 0) {
      setImages(prev => [...prev, ...files]);

      files.forEach(file => {
        // For PDFs, create a special preview
        if (file.type === 'application/pdf') {
          setImagePreviews(prev => [...prev, { type: 'pdf', name: file.name }]);
        } else {
          // For images, create data URL preview
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreviews(prev => [...prev, { type: 'image', url: reader.result }]);
          };
          reader.readAsDataURL(file);
        }
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

    const files = Array.from(e.dataTransfer.files);
    validateAndAddImages(files);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const filteredMembers = members.filter(member => {
    // Exclude current user (host)
    if (member.id === currentUser?.id) return false;
    
    // Always show selected members regardless of filters
    if (selectedMembers.includes(member.id)) return true;
    
    // Filter by department
    if (filterDepartment !== 'all' && member.department !== filterDepartment) return false;
    
    // Filter by role
    if (filterRole !== 'all' && member.role !== filterRole) return false;
    
    return true;
  });

  // Further filter by search term and sort selected members first
  const searchFilteredMembers = filteredMembers
    .filter(member =>
      member.username.toLowerCase().includes(searchMember.toLowerCase()) ||
      member.email.toLowerCase().includes(searchMember.toLowerCase())
    )
    .sort((a, b) => {
      // Sort selected members first
      const aSelected = selectedMembers.includes(a.id);
      const bSelected = selectedMembers.includes(b.id);
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      
      // If both selected or both not selected, sort alphabetically
      return a.username.localeCompare(b.username);
    });

  const availableDepartments = [...new Set(members.map(m => m.department).filter(Boolean))];
  const availableRoles = [...new Set(members.map(m => m.role).filter(Boolean))];

  return (
    <div className="animate-fade-in">

      {/* Undo Toast — Option 2 */}
      {undoToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl animate-fade-in">
          <span>{undoToast.count} member{undoToast.count !== 1 ? 's' : ''} selected</span>
          <button
            type="button"
            onClick={handleUndoSelectAll}
            className="font-semibold text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors"
          >
            Undo
          </button>
          <button type="button" onClick={() => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); setUndoToast(null); }} className="text-gray-400 hover:text-white ml-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Confirmation Dialog — Option 3 (large selections) */}
      {selectAllConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h4 className="text-base font-bold text-gray-900 mb-2">Select all members?</h4>
            <p className="text-sm text-gray-600 mb-5">
              This will add <span className="font-semibold text-gray-900">{selectAllConfirm.ids.length}</span> more member{selectAllConfirm.ids.length !== 1 ? 's' : ''} to your invite list.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { doSelectAll(selectAllConfirm.ids); setSelectAllConfirm(null); }}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setSelectAllConfirm(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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

      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left Column - Event Details (1/2 width) */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center space-x-2 mb-5">
              <div className="bg-green-100 rounded-lg p-2">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event details..."
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-colors resize-none"
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
                    className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-colors"
                  />
                </div>
              </div>

              {/* Event Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="eventType"
                      value="event"
                      checked={eventType === 'event'}
                      onChange={(e) => setEventType(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700 font-medium">Event</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="eventType"
                      value="meeting"
                      checked={eventType === 'meeting'}
                      onChange={(e) => setEventType(e.target.value)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700 font-medium">Meeting</span>
                  </label>
                </div>
              </div>

              {/* ── Date & Time ── */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Schedule</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                    <DatePicker
                      selectedDate={date}
                      onDateSelect={handleDateChange}
                      minDate={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Time <span className="text-red-500">*</span></label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="block w-full px-2 py-2 border border-gray-300 rounded-lg shadow-sm text-xs focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* ── Urgent toggle — meetings only ── */}
              {eventType === 'meeting' && (
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-red-700">Mark as Urgent</span>
                    <p className="text-xs text-gray-500 mt-0.5">Recipients are notified but cannot accept or decline — announcement only</p>
                  </div>
                </label>
              )}

              {/* ── Event Files ── */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Event Files</p>
                  <span className="text-xs text-gray-400">Max 5 · 25 MB each</span>
                </div>

                {fileError && (
                  <div className="mb-2 rounded-lg bg-red-50 border border-red-200 p-2 flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs text-red-700 flex-1">{fileError}</p>
                    <button type="button" onClick={() => setFileError('')} className="text-red-400 hover:text-red-600">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-3 transition-all duration-200 ${
                    isDragging ? 'border-green-500 bg-green-50' :
                    fileError ? 'border-red-300 bg-red-50/30' :
                    'border-gray-200 bg-gray-50/50 hover:border-green-300'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />

                  {imagePreviews.length === 0 ? (
                    <label htmlFor="image-upload" className="flex flex-col items-center justify-center py-4 cursor-pointer">
                      <svg className="w-8 h-8 text-gray-300 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs font-medium text-gray-500">Drop files or <span className="text-green-600 underline">browse</span></p>
                      <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, GIF, WebP, PDF</p>
                    </label>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {images.length < 5 && (
                        <label
                          htmlFor="image-upload"
                          className="flex-shrink-0 w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all flex items-center justify-center"
                        >
                          <div className="text-center">
                            <svg className="mx-auto h-4 w-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-xs text-gray-400">Add</span>
                          </div>
                        </label>
                      )}
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative flex-shrink-0 group">
                          {preview.type === 'pdf' ? (
                            <div className="w-16 h-16 flex flex-col items-center justify-center bg-red-50 border-2 border-red-200 rounded-lg p-1">
                              <svg className="w-5 h-5 text-red-600 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <span className="text-xs text-red-700 font-medium truncate w-full text-center px-1" title={preview.name}>
                                {preview.name.length > 8 ? preview.name.substring(0, 8) + '…' : preview.name}
                              </span>
                            </div>
                          ) : (
                            <img src={preview.url || preview} alt={`Preview ${index + 1}`} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-sm"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {imagePreviews.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    {imagePreviews.length} / 5 file{imagePreviews.length !== 1 ? 's' : ''} selected
                    {images.length >= 5 && <span className="text-amber-600 font-medium ml-2">· Maximum reached</span>}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Members (1/2 width) */}
          <div className="flex flex-col">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="bg-green-50 rounded-lg p-2">
                    <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Invite Members</h3>
                </div>
                {selectedMembers.length > 0 && (
                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-colors"
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
              
              {/* Department and Role Filters with Select All */}
              <div className="mb-3 flex gap-2">
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-colors"
                >
                  <option value="all">All Departments</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-colors"
                >
                  <option value="all">All Roles</option>
                  {availableRoles
                    .filter(role => !(currentUser?.role === 'Dean' && role === 'Dean'))
                    .map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                </select>
                
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={searchFilteredMembers.length === 0}
                  className="px-4 py-2.5 border border-green-600 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {searchFilteredMembers.length > 0 && searchFilteredMembers.every(m => selectedMembers.includes(m.id)) ? (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Deselect All
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Select All
                    </span>
                  )}
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg bg-gray-50/50 flex-1 overflow-y-auto">
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
                          ? 'bg-green-100 border border-green-300'
                          : 'hover:bg-white border border-transparent'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => toggleMember(member.id)}
                          className="h-4 w-4 text-green-700 focus:ring-green-600 border-gray-300 rounded"
                        />
                        <span className="ml-2.5 text-sm text-gray-700 font-medium">
                          {member.username}
                          <div className="flex items-center gap-2 mt-0.5">
                            {member.role && (
                              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                {member.role}
                              </span>
                            )}
                            {member.department && (
                              <span className="text-xs text-gray-500 font-normal">
                                {member.department}
                              </span>
                            )}
                          </div>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center px-5 py-3 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
