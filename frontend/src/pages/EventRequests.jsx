import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';

export default function EventRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [actioningRequest, setActioningRequest] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve', 'decline', 'revert'
  const [declineReason, setDeclineReason] = useState('');

  // Determine if user is an approver (Dean/Chairperson) or requester (Faculty/Staff)
  const isApprover = user && ['Dean', 'Chairperson', 'Admin'].includes(user.role);
  const isRequester = user && ['Faculty Member', 'Staff'].includes(user.role);

  useEffect(() => {
    // Only allow specific roles
    if (user && !['Dean', 'Chairperson', 'Admin', 'Faculty Member', 'Staff'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    
    fetchRequests();
  }, [user, navigate]);

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

  const handleApprove = async (requestId) => {
    try {
      await api.post(`/event-requests/${requestId}/approve`);
      setMessage({ type: 'success', text: 'Event request approved successfully' });
      await fetchRequests();
      setActioningRequest(null);
    } catch (error) {
      console.error('Error approving request:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to approve request' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleDecline = async (requestId, reason) => {
    try {
      await api.post(`/event-requests/${requestId}/decline`, { reason });
      setMessage({ type: 'success', text: 'Event request declined' });
      await fetchRequests();
      setActioningRequest(null);
      setDeclineReason('');
    } catch (error) {
      console.error('Error declining request:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to decline request' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleRevert = async (requestId) => {
    try {
      await api.post(`/event-requests/${requestId}/revert`);
      setMessage({ type: 'success', text: 'Approval/Decline reverted successfully' });
      await fetchRequests();
      setActioningRequest(null);
    } catch (error) {
      console.error('Error reverting action:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to revert action' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const getStatusBadge = (request) => {
    // For Faculty/Staff view - show overall status
    if (isRequester) {
      // Check if both have taken action
      const deanActioned = request.dean_approved_at;
      const chairActioned = request.chair_approved_at;
      const deanApproved = deanActioned && !request.dean_decline_reason;
      const chairApproved = chairActioned && !request.chair_decline_reason;
      const deanDeclined = request.dean_decline_reason;
      const chairDeclined = request.chair_decline_reason;
      
      // Both approved
      if (deanApproved && chairApproved) {
        return <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Fully Approved</span>;
      }
      
      // At least one declined
      if (deanDeclined || chairDeclined) {
        if (deanDeclined && chairDeclined) {
          return <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">Declined by Both</span>;
        } else if (deanDeclined && chairApproved) {
          return <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">Dean Declined, Chair Approved</span>;
        } else if (chairDeclined && deanApproved) {
          return <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">Chair Declined, Dean Approved</span>;
        } else if (deanDeclined) {
          return <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">Dean Declined</span>;
        } else {
          return <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">Chair Declined</span>;
        }
      }
      
      // Partial approval
      if (deanApproved && !chairActioned) {
        return <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Dean Approved - Awaiting Chairperson</span>;
      }
      if (chairApproved && !deanActioned) {
        return <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Chairperson Approved - Awaiting Dean</span>;
      }
      
      return <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Pending Approval</span>;
    }

    // For Dean/Chairperson view - show their specific status
    const isDean = user.role === 'Dean';
    const hasApproved = isDean ? request.dean_approved_at : request.chair_approved_at;
    const hasDeclined = isDean ? request.dean_decline_reason : request.chair_decline_reason;
    
    if (hasDeclined) {
      return <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">You Declined</span>;
    }
    
    if (hasApproved) {
      return <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">You Approved</span>;
    }
    
    return <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Awaiting Your Action</span>;
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
        <Navbar isLoading={loading} />
        <main className="w-full py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 animate-pulse">
              <div className="h-10 w-64 bg-gray-300 rounded mb-2"></div>
              <div className="h-6 w-96 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
                  <div className="h-8 w-3/4 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
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
      <Navbar isLoading={loading} />

      <main className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Event Requests</h2>
            <p className="text-lg text-gray-600 font-medium">
              {isApprover ? 'Review and approve event requests from Faculty and Staff' : 'Track the status of your event requests'}
            </p>
          </div>

          {/* Messages */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
              message.type === 'success'
                ? 'bg-green-50/80 text-green-800 border-green-300'
                : 'bg-red-50/80 text-red-800 border-red-300'
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
              <p className="text-gray-600">
                {isApprover ? 'There are currently no event requests to review.' : 'You have not submitted any event requests yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => {
                const isDean = user.role === 'Dean';
                const hasUserApproved = isDean ? request.dean_approved_at : request.chair_approved_at;
                const canApprove = isApprover && !hasUserApproved && request.status !== 'declined';
                // Can only revert if user has taken an action (approved or declined)
                const canRevert = isApprover && hasUserApproved;

                return (
                  <div key={request.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                      {/* Status Badge */}
                      <div className="flex justify-between items-start mb-4">
                        {getStatusBadge(request)}
                        {request.event_type && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {request.event_type === 'event' ? 'Event' : 'Meeting'}
                          </span>
                        )}
                      </div>

                      {/* Request Details */}
                      <div className="mb-4">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{request.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {request.requester?.name} ({request.requester?.role})
                          </span>
                          {request.department && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {request.department}
                            </span>
                          )}
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

                      {/* Content Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {request.description && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                            <p className="text-gray-700">{request.description}</p>
                          </div>
                        )}
                        {request.justification && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Justification</h4>
                            <p className="text-gray-700">{request.justification}</p>
                          </div>
                        )}
                      </div>

                      {/* Approval Status - Show for all users */}
                      {(request.dean_approved_at || request.chair_approved_at) && (
                        <div className={`border rounded-lg p-4 mb-4 ${
                          (request.dean_decline_reason || request.chair_decline_reason) 
                            ? 'bg-orange-50 border-orange-200' 
                            : 'bg-green-50 border-green-200'
                        }`}>
                          <h4 className={`font-semibold mb-2 ${
                            (request.dean_decline_reason || request.chair_decline_reason)
                              ? 'text-orange-900'
                              : 'text-green-900'
                          }`}>Approval Status</h4>
                          <div className="space-y-2">
                            {/* Dean's action */}
                            {request.dean_approved_at && request.dean_approver && (
                              <div className={`flex items-center text-sm ${
                                request.dean_decline_reason ? 'text-red-700' : 'text-green-700'
                              }`}>
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  {request.dean_decline_reason ? (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  ) : (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  )}
                                </svg>
                                <span>
                                  {request.dean_decline_reason ? 'Declined' : 'Approved'} by <strong>{request.dean_approver.name}</strong> (Dean) on {formatDate(request.dean_approved_at)}
                                </span>
                              </div>
                            )}
                            
                            {/* Chairperson's action */}
                            {request.chair_approved_at && request.chair_approver && (
                              <div className={`flex items-center text-sm ${
                                request.chair_decline_reason ? 'text-red-700' : 'text-green-700'
                              }`}>
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  {request.chair_decline_reason ? (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  ) : (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  )}
                                </svg>
                                <span>
                                  {request.chair_decline_reason ? 'Declined' : 'Approved'} by <strong>{request.chair_approver.name}</strong> (Chairperson) on {formatDate(request.chair_approved_at)}
                                </span>
                              </div>
                            )}
                            
                            {isRequester && request.all_approvals_received && !request.dean_decline_reason && !request.chair_decline_reason && (
                              <p className="mt-2 text-green-800 font-medium">
                                ✓ All approvals received! The event has been automatically created and posted to the calendar.
                              </p>
                            )}
                            
                            {isRequester && (request.dean_decline_reason || request.chair_decline_reason) && (
                              <p className="mt-2 text-orange-800 font-medium">
                                ⚠ Request has been declined by at least one approver. Both must approve for the event to proceed.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Decline Reason */}
                      {request.status === 'declined' && (request.dean_decline_reason || request.chair_decline_reason || request.decline_reason) && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-red-900 mb-3">Request Declined</h4>
                          
                          {/* Dean's decline reason */}
                          {request.dean_decline_reason && request.dean_approver && (
                            <div className="mb-3">
                              <div className="flex items-center mb-1">
                                <svg className="w-4 h-4 mr-2 text-red-700" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold text-red-900">
                                  Declined by {request.dean_approver.name} (Dean)
                                </span>
                              </div>
                              <p className="text-red-700 ml-6 bg-red-100 p-2 rounded">{request.dean_decline_reason}</p>
                            </div>
                          )}
                          
                          {/* Chairperson's decline reason */}
                          {request.chair_decline_reason && request.chair_approver && (
                            <div className="mb-3">
                              <div className="flex items-center mb-1">
                                <svg className="w-4 h-4 mr-2 text-red-700" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold text-red-900">
                                  Declined by {request.chair_approver.name} (Chairperson)
                                </span>
                              </div>
                              <p className="text-red-700 ml-6 bg-red-100 p-2 rounded">{request.chair_decline_reason}</p>
                            </div>
                          )}
                          
                          {/* Fallback to old decline_reason if no specific reasons */}
                          {!request.dean_decline_reason && !request.chair_decline_reason && request.decline_reason && (
                            <div>
                              <h4 className="font-semibold text-red-900 mb-2">Reason</h4>
                              <p className="text-red-700 bg-red-100 p-2 rounded">{request.decline_reason}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons for Dean/Chairperson */}
                      {isApprover && (
                        <div className="pt-4 border-t border-gray-200">
                          {(() => {
                            const isDean = user.role === 'Dean';
                            const hasApproved = isDean ? (request.dean_approved_at && !request.dean_decline_reason) : (request.chair_approved_at && !request.chair_decline_reason);
                            const hasDeclined = isDean ? request.dean_decline_reason : request.chair_decline_reason;
                            const hasActioned = hasApproved || hasDeclined;
                            
                            if (!hasActioned) {
                              // No action taken yet - show approve/decline buttons
                              return (
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => {
                                      setActioningRequest(request.id);
                                      setActionType('approve');
                                    }}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActioningRequest(request.id);
                                      setActionType('decline');
                                    }}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                  >
                                    Decline
                                  </button>
                                </div>
                              );
                            } else {
                              // Action taken - show revert button
                              return (
                                <button
                                  onClick={() => {
                                    setActioningRequest(request.id);
                                    setActionType('revert');
                                  }}
                                  className="w-full px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                                >
                                  Change My Decision
                                </button>
                              );
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Approve Confirmation Modal */}
      {actioningRequest && actionType === 'approve' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Approval</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to approve this event request?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActioningRequest(null);
                  setActionType('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(actioningRequest)}
                className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {actioningRequest && actionType === 'decline' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Decline Event Request</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for declining this request:
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
              placeholder="Enter decline reason..."
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setActioningRequest(null);
                  setActionType('');
                  setDeclineReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDecline(actioningRequest, declineReason)}
                disabled={!declineReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revert Confirmation Modal */}
      {actioningRequest && actionType === 'revert' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Revert Action</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to revert your approval/decline? This will reset the request to pending status.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActioningRequest(null);
                  setActionType('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRevert(actioningRequest)}
                className="flex-1 px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors"
              >
                Revert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
