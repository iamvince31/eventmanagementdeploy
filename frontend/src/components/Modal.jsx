import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, fullscreen = false, maxWidth = 'max-w-lg', noPadding = false, showCloseButton = true, closeOnBackdrop = true }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 lg:p-6 text-left">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={closeOnBackdrop ? onClose : undefined}
      ></div>

      {/* Modal Panel */}
      <div className={`relative transform rounded-xl sm:rounded-2xl bg-white shadow-2xl transition-all animate-fade-in-up flex flex-col ${fullscreen
          ? 'w-full h-full max-w-none max-h-none m-2 sm:m-4'
          : `w-full ${maxWidth} max-h-[95vh] sm:max-h-[90vh] lg:max-h-[85vh] mt-2 sm:mt-0`
        }`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b border-gray-100 shrink-0 ${noPadding ? 'p-3 sm:p-4' : 'p-4 sm:p-5 lg:p-6'}`}>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 pr-2">
            {title}
          </h3>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="rounded-full p-1.5 sm:p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 flex-shrink-0"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className={`${noPadding ? 'p-0' : 'p-4 sm:p-5 lg:p-6'} overflow-y-auto flex-1 overscroll-contain`}>
          {children}
        </div>

        {/* Bottom Spacing - matches header padding on laptop screens */}
        <div className="hidden lg:block flex-shrink-0 h-6"></div>
      </div>
    </div>
  );
}
