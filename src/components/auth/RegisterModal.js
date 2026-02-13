import React from 'react';
import RegisterPage from '../../pages/auth/RegisterPage';

const RegisterModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white/5 border border-white/10 p-6 shadow-2xl backdrop-blur-lg">
        <button onClick={onClose} className="absolute top-3 right-3 text-white text-2xl">✕</button>
        <RegisterPage isModal={true} onClose={onClose} />
      </div>
    </div>
  );
};

export default RegisterModal;import React, { useState } from 'react';
import RegisterPage from '../../pages/auth/RegisterPage';

const RegisterModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => { if (onClose) onClose(); }} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white/5 border border-white/10 p-6 shadow-2xl backdrop-blur-lg">
        <button onClick={() => { if (onClose) onClose(); }} className="absolute top-3 right-3 text-white">✕</button>
        <div className="overflow-y-auto max-h-[80vh]">
          <RegisterPage isModal={true} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
