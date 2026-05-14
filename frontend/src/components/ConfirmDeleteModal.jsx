import { useEffect, useState } from 'react';

export default function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  eventTitle, 
  eventType = 'Event',
  isDeleting = false,
  event = null // Pass the full event object to check if Dean-created
}) {
  const [showWarning, setShowWarning] = useState(false);
  const [canProceed, setCanProceed] = useState(false);

  const isDeanCreated = event?.host?.designation === 'Dean';

  useEffect(() => {
    if (isOpen && isDeanCreated) {
      // Show warning for 2 seconds before allowing deletion
      setShowWarning(true);
      setCanProceed(false);
      
      const timer = setTimeout(() => {
        setShowWarning(false);
        setCanProceed(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else if (isOpen) {
      // Non-Dean events can proceed immediately
      setShowWarning(false);
      setCanProceed(true);
    }
  }, [isOpen, isDeanCreated]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 text-left">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={!isDeleting ? onClose : undefined}
      ></div>

      {/* Modal Panel */}
      <div className="relative transform rounded-2xl bg-white shadow-2xl transition-all animate-fade-in-up flex flex-col w-full max-w-md max-h-[85vh] overflow-hidden">
        {/* Red Header */}
        <div className={`flex items-center justify-between p-6 shrink-0 ${isDeanCreated ? 'bg-orange-600' : 'bg-red-600'}`}>
          <h3 className="text-xl font-bold text-white">
            {isDeanCreated ? 'Warning: Dean-Created Event' : 'Confirm Deletion'}
          </h3>
          {!isDeleting && (
            <button
              onClick={onClose}
              className={`rounded-full p-2 text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white ${isDeanCreated ? 'hover:bg-orange-700' : 'hover:bg-red-700'} hover:text-white`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Warning Icon */}
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDeanCreated ? 'bg-orange-100' : 'bg-red-100'}`}>
                <svg className={`w-8 h-8 ${isDeanCreated ? 'text-orange-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              {isDeanCreated && (
                <div className="mb-4 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm font-bold text-orange-800 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    This {eventType.toLowerCase()} was created by the Dean
                  </p>
                </div>
              )}
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete {eventType}?</h3>
              <p className="text-gray-600 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{eventTitle}"</span>?
              </p>
              <p className={`text-sm mt-2 ${isDeanCreated ? 'text-orange-600 font-semibold' : 'text-red-600'}`}>
                This action cannot be undone.
              </p>
              
              {showWarning && (
                <div className="mt-4 flex items-center justify-center gap-2 text-orange-600">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium">Please wait 2 seconds...</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting || !canProceed}
                className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  isDeanCreated 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isDeleting && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isDeleting ? 'Deleting...' : showWarning ? 'Please wait...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
