import React, { useEffect, useRef } from 'react';
import RegisterPage from '../../pages/auth/RegisterPage';

const RegisterModal = ({ onClose }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onPanelClick = (e) => e.stopPropagation();

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center pt-16 sm:pt-0" role="dialog" aria-modal="true" aria-label="Register" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />

      <div
        ref={containerRef}
        className="relative w-full max-w-3xl mx-4 sm:mx-auto bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md overflow-y-auto max-h-[calc(100vh-5rem)] sm:max-h-[90vh] transform transition duration-300 ease-out"
        style={{}}
        onClick={onPanelClick}
      >
        <button onClick={onClose} aria-label="Close register modal" className="absolute right-3 top-3 text-gray-700 dark:text-gray-200 text-2xl sm:text-3xl z-10">✕</button>

        <div className="w-full">
          <RegisterPage isModal={true} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
 
