import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { getApiUrl } from '../../utils/apiConfig';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) {
      setError('Email is required.');
      return;
    }

    setError('');
    setStatus('loading');

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/forgot-password`, {
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
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Unexpected error.');
      setStatus('idle');
    }
  };

  return (
    <AuthLayout
      title="Reset access"
      description="Let us send you a fresh link so you can jump back into PropertyArk without missing a beat."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-2xl border border-red-400/70 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <label className="text-sm text-slate-200">
          <span className="font-medium">Email address</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
            placeholder="you@email.com"
          />
        </label>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-center text-base font-semibold text-slate-900 shadow-lg shadow-orange-500/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === 'loading' ? 'Sending link…' : status === 'sent' ? 'Link sent' : 'Send reset link'}
        </button>

        <div className="flex items-center justify-between text-sm text-slate-200">
          <button
            type="button"
            onClick={() => navigate('/auth/login')}
            className="text-amber-300 hover:text-amber-200"
          >
            Back to sign in
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
