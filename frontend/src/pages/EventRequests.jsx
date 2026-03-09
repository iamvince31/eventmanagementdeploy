import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';

export default function EventRequests() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [events, setEvents] = useState([]); // For NotificationBell
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
    fetchEvents(); // For NotificationBell
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

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleReview = async (requestId, status, reason = '') => {
    try {
      const payload = { status };
      
      // Only include rejection_reason if status is rejected
      if (status === 'rejected' && reason) {
        payload.rejection_reason = reason;
      }

      await api.post(`/event-requests/${requestId}/review`, payload);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50">
        {/* Navigation Bar Skeleton */}
        <nav className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 shadow-lg sticky top-0 z-20">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-white/20 rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-6 w-40 bg-white/20 rounded animate-pulse"></div>
                  <div className="h-3 w-32 bg-white/10 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-white/20 rounded-lg animate-pulse"></div>
                <div className="h-10 w-10 bg-white/20 rounded-lg animate-pulse"></div>
                <div className="h-10 w-10 bg-white/20 rounded-lg animate-pulse"></div>
                <div className="h-10 w-32 bg-white/20 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Skeleton */}
        <main className="w-full py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 animate-pulse">
              <div className="h-10 w-64 bg-gray-300 rounded mb-2"></div>
              <div className="h-6 w-96 bg-gray-200 rounded"></div>
            </div>

            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-6 w-32 bg-gray-200 rounded-full"></div>
                      <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="h-8 w-3/4 bg-gray-300 rounded mb-2"></div>
                    <div className="flex items-center space-x-4">
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      <div className="h-4 w-40 bg-gray-200 rounded"></div>
                      <div className="h-4 w-36 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="h-5 w-24 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                    </div>
                    <div>
                      <div className="h-5 w-24 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-100 to-gray-50">
      <Navbar showUpcomingEvents={true} isLoading={loading} />

      {/* Main Content */}
      <main className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Event Requests</h2>
            <p className="text-lg text-gray-600 font-medium">Review event requests from Faculty</p>
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
                <div key={request.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    {/* Request Status Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
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
                          {request.requester?.name} ({request.requester?.role})
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

                    {/* Request Content */}
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
                    </div>

                    {/* Action buttons based on status */}
                    {request.status === 'pending' && (
                      <div className="space-y-4 pt-4 border-t border-gray-200">
                        {/* Approval Status */}
                        {(request.dean_approver || request.chair_approver) && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-semibold text-green-900 mb-2">Approval Status</h4>
                            <div className="space-y-2">
                              {request.dean_approved_at && (
                                <div className="flex items-center text-sm text-green-700">
                                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span>Approved by Dean {request.dean_approver?.name} on {formatDate(request.dean_approved_at)}</span>
                                </div>
                              )}
                              {request.chair_approved_at && (
                                <div className="flex items-center text-sm text-green-700">
                                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span>Approved by Chairperson {request.chair_approver?.name} on {formatDate(request.chair_approved_at)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {request.can_approve && !request.has_approved && (
                          <div className="flex gap-3">
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
                          </div>
                        )}

                        {request.has_approved && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                            <p className="text-blue-800 font-medium">
                              ✓ You have approved this request. Waiting for other approvers.
                            </p>
                          </div>
                        )}

                        {!request.can_approve && !request.dean_approver && !request.chair_approver && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                            <p className="text-gray-600 font-medium">
                              Waiting for approvals from required approvers
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fully Approved Status */}
                    {request.status === 'approved' && request.all_approvals_received && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Fully Approved
                        </h4>
                        <div className="space-y-1 text-sm text-green-700">
                          {request.dean_approver && (
                            <p>✓ Dean: {request.dean_approver.name}</p>
                          )}
                          {request.chair_approver && (
                            <p>✓ Chairperson: {request.chair_approver.name}</p>
                          )}
                        </div>
                        <p className="mt-2 text-green-800 font-medium">
                          The requestor can now create this event.
                        </p>
                      </div>
                    )}

                    {/* Rejection reason display */}
                    {request.status === 'rejected' && request.rejection_reason && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-900 mb-2">Rejection Reason</h4>
                        <p className="text-red-700">{request.rejection_reason}</p>
                      </div>
                    )}

                    {/* Review timestamp */}
                    {request.reviewed_at && (
                      <div className="mt-4 text-sm text-gray-500">
                        Reviewed by {request.reviewer?.name} on {formatDate(request.reviewed_at)}
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
      {reviewingRequest && reviewAction === 'rejected' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Event Request</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this request:
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
                onClick={() => handleReview(reviewingRequest, 'rejected', rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}