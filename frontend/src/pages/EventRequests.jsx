import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import logo from '../assets/CEIT-LOGO.png';

export default function EventRequests() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    // Only Dean, Chairperson, and Admin can access this page
    if (user && !['Dean', 'Chairperson', 'Admin'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    
    fetchRequests();
  }, [user, navigate]);

  // Close account dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAccountDropdownOpen && !event.target.closest('.account-dropdown-container')) {
        setIsAccountDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAccountDropdownOpen]);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/event-requests');
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setMessage({ type: 'error', text: 'Failed to load event requests' });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId, status, reason = '') => {
    try {
      await api.post(`/event-requests/${requestId}/review`, {
        status,
        rejection_reason: reason
      });

      setMessage({ 
        type: 'success', 
        text: `Event request ${status} successfully` 
      });

      // Refresh requests
      await fetchRequests();
      
      // Reset review state
      setReviewingRequest(null);
      setReviewAction('');
      setRejectionReason('');

    } catch (error) {
      console.error('Error reviewing request:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to review request' 
      });
    }

    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
  };

  const handleHierarchyApproval = async (approvalId, decision, reason = '') => {
    try {
      await api.post(`/hierarchy-approvals/${approvalId}/review`, {
        decision,
        reason
      });

      setMessage({ 
        type: 'success', 
        text: `Hierarchy approval ${decision} successfully` 
      });

      // Refresh requests
      await fetchRequests();
      
      // Reset review state
      setReviewingRequest(null);
      setReviewAction('');
      setRejectionReason('');

    } catch (error) {
      console.error('Error processing hierarchy approval:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to process approval' 
      });
    }

    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-green-300 border-t-green-700 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium text-lg">Loading event requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 shadow-lg sticky top-0 z-20" aria-label="Main navigation">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left corner - Logo and Title */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg transition-all hover:opacity-80 flex-shrink-0"
                aria-label="Go to dashboard"
              >
                <img
                  src={logo}
                  alt="CEIT Logo"
                  className="h-10 w-auto cursor-pointer"
                />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Event Management</h1>
                <p className="text-xs text-green-200 font-medium">Event Requests</p>
              </div>
            </div>

            {/* Right corner - Navigation and Account */}
            <div className="flex items-center space-x-4">
              {/* Home Icon */}
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                aria-label="Go to dashboard"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>

              {/* Account Dropdown */}
              <div className="relative account-dropdown-container">
                <button
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                  aria-label="Account menu"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-green-300 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white hidden sm:block">{user?.username}</span>
                  <svg
                    className={`w-4 h-4 text-white transition-transform duration-200 ${isAccountDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isAccountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          navigate('/account');
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Settings</span>
                      </button>

                      {/* Admin Panel Link - Only for admin users */}
                      {user?.role === 'Admin' && (
                        <>
                          <div className="border-t border-gray-100"></div>
                          <button
                            onClick={() => {
                              setIsAccountDropdownOpen(false);
                              navigate('/admin');
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center space-x-3"
                          >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="font-medium">Admin Panel</span>
                          </button>
                        </>
                      )}

                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={async () => {
                          setIsAccountDropdownOpen(false);
                          await logout();
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Event Requests</h2>
            <p className="text-lg text-gray-600 font-medium">Review and manage event requests from coordinators</p>
          </div>

          {/* Success/Error Messages */}
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

          {/* Requests List */}
          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Event Requests</h3>
              <p className="text-gray-600">There are currently no event requests to review.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
                <div key={`${request.type}-${request.id}`} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    {/* Request Type Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.type === 'coordinator_request' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {request.type === 'coordinator_request' ? 'Coordinator Request' : 'Hierarchy Approval'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{request.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {request.type === 'coordinator_request' ? request.requester?.name : request.host?.name}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(request.date)} at {formatTime(request.time)}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {request.location}
                        </span>
                      </div>
                    </div>

                    {/* Content based on request type */}
                    {request.type === 'coordinator_request' ? (
                      // Coordinator Request Content
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                          <p className="text-gray-700">{request.description}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Justification</h4>
                          <p className="text-gray-700">{request.justification}</p>
                        </div>
                        {request.expected_attendees && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Expected Attendees</h4>
                            <p className="text-gray-700">{request.expected_attendees}</p>
                          </div>
                        )}
                        {request.budget && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Budget</h4>
                            <p className="text-gray-700">{request.budget}</p>
                          </div>
                        )}
                        {request.resources && (
                          <div className="md:col-span-2">
                            <h4 className="font-semibold text-gray-900 mb-2">Required Resources</h4>
                            <p className="text-gray-700">{request.resources}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Hierarchy Approval Content
                      <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                            <p className="text-gray-700">{request.description}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Event Host</h4>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{request.host?.name}</span>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {request.host?.role}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {request.event_data?.member_ids && request.event_data.member_ids.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Invited Members</h4>
                            <p className="text-sm text-gray-600 mb-2">{request.event_data.member_ids.length} members invited</p>
                          </div>
                        )}

                        {request.all_approvers && request.all_approvers.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Approval Status</h4>
                            <div className="space-y-2">
                              {request.all_approvers.map((approver, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900">{approver.name}</span>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                      {approver.role}
                                    </span>
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(approver.status)}`}>
                                    {approver.status.charAt(0).toUpperCase() + approver.status.slice(1)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons based on request type and status */}
                    {request.status === 'pending' && (
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        {request.type === 'coordinator_request' ? (
                          <>
                            <button
                              onClick={() => handleReview(request.id, 'approved')}
                              className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setReviewingRequest(request.id);
                                setReviewAction('rejected');
                              }}
                              className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          // Hierarchy approval buttons - only show if user's approval is pending
                          request.approver_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleHierarchyApproval(request.id, 'approved')}
                                className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setReviewingRequest(request.id);
                                  setReviewAction('hierarchy_rejected');
                                }}
                                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )
                        )}
                      </div>
                    )}

                    {/* Rejection reason display */}
                    {request.status === 'rejected' && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-900 mb-2">Rejection Reason</h4>
                        <p className="text-red-700">
                          {request.type === 'coordinator_request' 
                            ? request.rejection_reason 
                            : request.approver_decision_reason || 'No reason provided'}
                        </p>
                      </div>
                    )}

                    {/* Review timestamp */}
                    {(request.reviewed_at || request.approver_decided_at) && (
                      <div className="mt-4 text-sm text-gray-500">
                        {request.type === 'coordinator_request' 
                          ? `Reviewed by ${request.reviewer?.name} on ${formatDate(request.reviewed_at)}`
                          : `You decided on ${formatDate(request.approver_decided_at)}`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Rejection Modal */}
      {reviewingRequest && (reviewAction === 'rejected' || reviewAction === 'hierarchy_rejected') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {reviewAction === 'rejected' ? 'Reject Event Request' : 'Reject Hierarchy Approval'}
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this {reviewAction === 'rejected' ? 'request' : 'approval'}:
            </p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
              placeholder="Enter rejection reason..."
            />
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setReviewingRequest(null);
                  setReviewAction('');
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (reviewAction === 'rejected') {
                    handleReview(reviewingRequest, 'rejected', rejectionReason);
                  } else {
                    handleHierarchyApproval(reviewingRequest, 'rejected', rejectionReason);
                  }
                }}
                disabled={!rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {reviewAction === 'rejected' ? 'Reject Request' : 'Reject Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}