import React, { useState } from 'react';
import { getApiUrl } from '../../utils/apiConfig';
import toast from 'react-hot-toast';

const ForgotPasswordModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required.');
      return;
    }

    setError('');
    setStatus('loading');

    try {
      const response = await fetch(getApiUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Unable to send reset link.');
      }

      setStatus('sent');
      toast.success('If that email exists, you will find a reset link in your inbox.');
      if (onClose) onClose();
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Unexpected error.');
      setStatus('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center mt-[80px]">
      <div className="absolute inset-0 bg-black/50" onClick={() => { if (onClose) onClose(); }} />
      <div className="relative w-full max-w-md rounded-2xl bg-white/5 border border-white/10 p-6 shadow-2xl backdrop-blur-lg">
        <button onClick={() => { if (onClose) onClose(); }} className="absolute top-3 right-3 text-white">✕</button>
        <h2 className="text-xl font-semibold text-white mb-2">Reset access</h2>
        <p className="text-sm text-slate-300 mb-4">Let us send you a fresh link so you can jump back into PropertyArk without missing a beat.</p>

        {error && (
          <div className="rounded-md border border-red-400/70 bg-red-500/10 px-3 py-2 text-sm text-red-200 mb-3">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
          />

          <div className="flex items-center justify-between">
            <button type="submit" disabled={status === 'loading'} className="rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-black font-semibold">
              {status === 'loading' ? 'Sending link…' : status === 'sent' ? 'Link sent' : 'Send reset link'}
            </button>
            <button type="button" onClick={() => { if (onClose) onClose(); }} className="text-amber-300">Back to sign in</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
