import React from 'react';

export default function HierarchyWarning({ violations, approversNeeded, validating }) {
  if (validating) {
    return (
      <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div>
          <p className="text-sm font-medium text-blue-800">Validating hierarchy rules...</p>
        </div>
      </div>
    );
  }

  if (!violations || violations.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800 mb-2">Approval Required</h3>
          <p className="text-sm text-amber-700 mb-3">
            You are inviting higher-level roles to this event. Approval will be required from the following people before the event is created:
          </p>
          
          {approversNeeded && approversNeeded.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-amber-800 mb-2">Required Approvers:</h4>
              <div className="space-y-1">
                {approversNeeded.map((approver, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-amber-700 font-medium">{approver.name}</span>
                    <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                      {approver.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-amber-100 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-amber-800 mb-2">Hierarchy Violations:</h4>
            <div className="space-y-1">
              {violations.map((violation, index) => (
                <div key={index} className="text-xs text-amber-700">
                  <span className="font-medium">{violation.invitee_name}</span> 
                  <span className="text-amber-600"> ({violation.invitee_role})</span>
                  <span> has higher authority than your role </span>
                  <span className="font-medium">({violation.host_role})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 text-xs text-amber-600">
            <p>You can still submit this event, but it will be sent for approval instead of being created immediately.</p>
          </div>
        </div>
      </div>
    </div>
  );
}