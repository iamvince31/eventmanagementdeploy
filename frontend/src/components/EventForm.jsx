import { useState, useEffect } from 'react';
import api from '../services/api';
import DatePicker from './DatePicker';

export default function EventForm({ members, onEventCreated, editingEvent, onCancelEdit, defaultDate, currentUser }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState('event');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [date, setDate] = useState('');
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
  const [membersPage, setMembersPage] = useState(1);
  const MEMBERS_PER_PAGE = 6;
  const [showInvitedModal, setShowInvitedModal] = useState(false);
  const [invitedSearch, setInvitedSearch] = useState('');
  const [invitedPage, setInvitedPage] = useState(1);
  const INVITED_PER_PAGE = 8;

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
      console.log('School year calculated:', calculatedSchoolYear, 'for date:', date);
    }
  }, [date]);

  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    if (!date) {
      setDate(defaultDate || today);
      // Calculate school year for initial date
      const initialSchoolYear = getSchoolYearFromDate(defaultDate || today);
      setSchoolYear(initialSchoolYear);
      console.log('Initial school year:', initialSchoolYear);
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
      setSelectedMembers(editingEvent.members.map(m => m.id));
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
    formData.append('school_year', schoolYear);

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
        await api.post('/events', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Event created successfully');
        resetForm();
      }

      onEventCreated();
    } catch (err) {
      console.error('Error saving event:', err.response?.data);

      // Schedule conflict — auto-retry with ignore flag
      if (err.response?.status === 409 && err.response?.data?.warning === 'schedule_conflict') {
        formData.append('ignore_conflicts', 'true');
        try {
          await api.post('/events', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setSuccess('Event created successfully');
          resetForm();
          onEventCreated();
        } catch (retryErr) {
          setError(retryErr.response?.data?.error || retryErr.response?.data?.message || 'Operation failed');
        }
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Operation failed');
      }
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
      // Deselect all filtered members
      setSelectedMembers(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      // Select all filtered members
      setSelectedMembers(prev => {
        const newIds = allFilteredIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
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

    // Filter by department
    if (filterDepartment !== 'all' && member.department !== filterDepartment) return false;

    // Filter by role
    if (filterRole !== 'all' && member.role !== filterRole) return false;

    return true;
  });

  // Further filter by search term, sorted alphabetically only
  const searchFilteredMembers = filteredMembers
    .filter(member =>
      member.username.toLowerCase().includes(searchMember.toLowerCase()) ||
      member.email.toLowerCase().includes(searchMember.toLowerCase())
    )
    .sort((a, b) => a.username.localeCompare(b.username));

  // Members that have been invited (for the modal)
  const invitedMembers = members.filter(m => selectedMembers.includes(m.id));
  const filteredInvitedMembers = invitedMembers.filter(m =>
    m.username.toLowerCase().includes(invitedSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(invitedSearch.toLowerCase())
  );
  const totalInvitedPages = Math.ceil(filteredInvitedMembers.length / INVITED_PER_PAGE);
  const pagedInvitedMembers = filteredInvitedMembers.slice(
    (invitedPage - 1) * INVITED_PER_PAGE,
    invitedPage * INVITED_PER_PAGE
  );

  const CEIT_DEPARTMENT = 'College of Engineering and Information Technology';

  const CEIT_ROLES = ['Dean', 'CEIT Official', 'Coordinator', 'Faculty Member'];
  const OTHER_DEPT_ROLES = ['Chairperson', 'GAD Coordinator', 'Extension Coordinator', 'Research Coordinator', 'Faculty Member'];

  const availableDepartments = [...new Set(members.map(m => m.department).filter(Boolean))];

  // Compute role options based on selected department
  const availableRoles = (() => {
    const allRoles = [...new Set(members.map(m => m.role).filter(Boolean))];

    if (filterDepartment === CEIT_DEPARTMENT) {
      return allRoles.filter(r => CEIT_ROLES.includes(r));
    }
    if (filterDepartment !== 'all') {
      return allRoles.filter(r => OTHER_DEPT_ROLES.includes(r));
    }
    return allRoles;
  })()
    // Always hide Dean option from the dropdown when current user is Dean
    .filter(role => !(currentUser?.role === 'Dean' && role === 'Dean'));

  // Reset to page 1 whenever filters or search change
  // Also reset role filter if it's no longer valid for the selected department
  useEffect(() => {
    setMembersPage(1);
    if (filterRole !== 'all' && !availableRoles.includes(filterRole)) {
      setFilterRole('all');
    }
  }, [searchMember, filterDepartment, filterRole]);

  const totalMembersPages = Math.ceil(searchFilteredMembers.length / MEMBERS_PER_PAGE);
  const pagedMembers = searchFilteredMembers.slice(
    (membersPage - 1) * MEMBERS_PER_PAGE,
    membersPage * MEMBERS_PER_PAGE
  );

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

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                    <DatePicker
                      selectedDate={date}
                      onDateSelect={handleDateChange}
                      minDate={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="block w-full px-2 py-1.5 border border-gray-300 rounded-lg shadow-sm text-xs focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Event Files Section - Moved here */}
              <div className="mt-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="bg-green-50 rounded-lg p-1.5">
                    <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Event Files</h3>
                  <span className="text-xs text-gray-400">(Max 5, 25MB each)</span>
                </div>

                {/* File Error Alert */}
                {fileError && (
                  <div className="mb-3 rounded-lg bg-red-50 border border-red-200 p-2 flex items-start space-x-2 animate-shake">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-red-800">Invalid File</p>
                      <p className="text-xs text-red-700 mt-0.5">{fileError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFileError('')}
                      className="flex-shrink-0 text-red-400 hover:text-red-600"
                    >
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
                  className={`border-2 border-dashed rounded-lg p-3 transition-all duration-200 ${isDragging
                    ? 'border-green-500 bg-green-100/50 scale-[1.01]'
                    : fileError
                      ? 'border-red-300 bg-red-50/30'
                      : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
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

                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {/* Add Image Button */}
                    <label
                      htmlFor="image-upload"
                      className={`flex-shrink-0 w-20 h-20 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center group ${images.length >= 5
                        ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                        : 'border-gray-300 hover:border-green-500 hover:bg-green-100/50'
                        }`}
                    >
                      <div className="text-center">
                        <svg className="mx-auto h-5 w-5 text-gray-300 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="mt-0.5 text-xs text-gray-400 group-hover:text-green-600 font-medium">
                          {images.length >= 5 ? 'Full' : 'Add'}
                        </span>
                      </div>
                    </label>

                    {/* Image Previews */}
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative flex-shrink-0 group">
                        {preview.type === 'pdf' ? (
                          <div className="w-20 h-20 flex flex-col items-center justify-center bg-red-50 border-2 border-red-200 rounded-lg p-1 relative">
                            <svg className="w-6 h-6 text-red-600 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs text-red-700 font-medium truncate w-full text-center px-1" title={preview.name}>
                              {preview.name.length > 12 ? preview.name.substring(0, 12) + '...' : preview.name}
                            </span>
                          </div>
                        ) : (
                          <img
                            src={preview.url || preview}
                            alt={`Preview ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-sm"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      {imagePreviews.length} / 5 file{imagePreviews.length !== 1 ? 's' : ''} selected
                    </p>
                    {images.length >= 5 && (
                      <p className="text-xs text-amber-600 font-medium">
                        Maximum reached
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Members Only (2/3 width) - Maximized */}
          <div className="lg:col-span-2">
            {/* Members List Box - Now Full Height */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="bg-green-50 rounded-lg p-2">
                    <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Invite Members</h3>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowInvitedModal(true); setInvitedSearch(''); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    selectedMembers.length > 0
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-400 cursor-default'
                  }`}
                  disabled={selectedMembers.length === 0}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {selectedMembers.length} Invited
                </button>
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
              <div className="border border-gray-200 rounded-lg bg-gray-50/50 overflow-hidden">
                {searchFilteredMembers.length === 0 ? (
                  <div className="h-32 flex items-center justify-center">
                    <p className="text-sm text-gray-400">
                      {searchMember ? 'No members found' : 'No members available'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-2 space-y-1">
                      {pagedMembers.map(member => (
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
                    {totalMembersPages > 1 && (
                      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-white">
                        <span className="text-xs text-gray-400">
                          {(membersPage - 1) * MEMBERS_PER_PAGE + 1}–{Math.min(membersPage * MEMBERS_PER_PAGE, searchFilteredMembers.length)} of {searchFilteredMembers.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setMembersPage(p => Math.max(1, p - 1))}
                            disabled={membersPage === 1}
                            className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <span className="text-xs text-gray-600 px-1">{membersPage} / {totalMembersPages}</span>
                          <button
                            type="button"
                            onClick={() => setMembersPage(p => Math.min(totalMembersPages, p + 1))}
                            disabled={membersPage === totalMembersPages}
                            className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
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

      {/* Invited Members Modal */}
      {showInvitedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg h-[600px] flex flex-col">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Invited Members</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {invitedMembers.length} member{invitedMembers.length !== 1 ? 's' : ''} invited
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInvitedModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search + Clear All */}
            <div className="px-6 py-3 border-b border-gray-100 flex gap-2 flex-shrink-0">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search invited members..."
                  value={invitedSearch}
                  onChange={(e) => { setInvitedSearch(e.target.value); setInvitedPage(1); }}
                  className="block w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-colors"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {invitedSearch && (
                  <button type="button" onClick={() => { setInvitedSearch(''); setInvitedPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setSelectedMembers([]); setInvitedPage(1); }}
                disabled={invitedMembers.length === 0}
                className="px-3 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Clear All
              </button>
            </div>

            {/* List — fixed height, no scroll jump */}
            <div className="flex-1 overflow-y-auto">
              {invitedMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm">No members invited yet</p>
                </div>
              ) : filteredInvitedMembers.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  No results for "{invitedSearch}"
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {pagedInvitedMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-700 text-sm font-bold">
                            {member.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{member.username}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {member.role && (
                              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{member.role}</span>
                            )}
                            {member.department && (
                              <span className="text-xs text-gray-400 truncate">{member.department}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleMember(member.id)}
                        className="ml-3 flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={`Remove ${member.username}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination footer — always visible */}
            <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-white rounded-b-xl">
              <span className="text-xs text-gray-400">
                {filteredInvitedMembers.length === 0
                  ? '0 members'
                  : `${(invitedPage - 1) * INVITED_PER_PAGE + 1}–${Math.min(invitedPage * INVITED_PER_PAGE, filteredInvitedMembers.length)} of ${filteredInvitedMembers.length}`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setInvitedPage(p => Math.max(1, p - 1))}
                  disabled={invitedPage === 1 || totalInvitedPages === 0}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-gray-600 px-2 min-w-[60px] text-center">
                  {totalInvitedPages > 0 ? `${invitedPage} / ${totalInvitedPages}` : '—'}
                </span>
                <button
                  type="button"
                  onClick={() => setInvitedPage(p => Math.min(totalInvitedPages, p + 1))}
                  disabled={invitedPage === totalInvitedPages || totalInvitedPages === 0}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
