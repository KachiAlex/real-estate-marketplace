import React, { useEffect, useRef } from 'react';
import ForgotPasswordPage from '../../pages/auth/ForgotPasswordPage';

const ForgotPasswordModal = ({ onClose }) => {
  const containerRef = useRef(null);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Stop propagation when clicking inside modal panel
  const onPanelClick = (e) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Forgot Password"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div
        ref={containerRef}
        className="relative w-full max-w-md mx-4 sm:mx-auto bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md overflow-y-auto max-h-[90vh] transform transition duration-300 ease-out"
        onClick={onPanelClick}
      >
        <button
          onClick={onClose}
          aria-label="Close forgot password modal"
          className="absolute right-3 top-3 text-gray-700 dark:text-gray-200 text-2xl sm:text-3xl"
        >
          ✕
        </button>

        <div className="w-full">
          <ForgotPasswordPage isModal={true} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
