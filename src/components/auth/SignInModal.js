import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext-new';
import toast from 'react-hot-toast';
import RegisterModal from './RegisterModal';
import ForgotPasswordModal from './ForgotPasswordModal';

const SignInModal = ({ onClose }) => {
  const { login, loading, signInWithGooglePopup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [showRegister, setShowRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Both fields are required.');
      return;
    }
    try {
      setError('');
      await login(email.trim(), password);
      toast.success('Welcome back!');
      const redirect = sessionStorage.getItem('authRedirect');
      if (redirect) {
        sessionStorage.removeItem('authRedirect');
        navigate(redirect, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      if (onClose) onClose();
    } catch (submitError) {
      setError(submitError.message || 'Unexpected error while logging in.');
    }
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => { if (onClose) onClose(); }} />
      <div className="relative w-full max-w-md rounded-2xl bg-white/5 border border-white/10 p-6 shadow-2xl backdrop-blur-lg">
        <button onClick={() => { if (onClose) onClose(); }} className="absolute top-3 right-3 text-white">✕</button>
        <h2 className="text-xl font-semibold text-white mb-2">Welcome back</h2>
        <p className="text-sm text-slate-300 mb-4">Sign in to pick up where you left off — properties, alerts, and requests stay in sync across every device.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-400/70 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm text-white/90">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/60 focus:outline-none"
              placeholder="you@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm text-white/90">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/60 focus:outline-none"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <div className="flex flex-col">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-black font-semibold shadow-md disabled:opacity-70"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <button
              type="button"
              onClick={async () => {
                try {
                  await signInWithGooglePopup();
                  const redirect = sessionStorage.getItem('authRedirect');
                  if (redirect) {
                    sessionStorage.removeItem('authRedirect');
                    navigate(redirect, { replace: true });
                  } else {
                    navigate('/dashboard', { replace: true });
                  }
                  if (onClose) onClose();
                } catch (e) {}
              }}
              className="w-full mt-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
            >
              Sign in with Google
            </button>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-300">
            <button type="button" onClick={() => { setShowForgot(true); }} className="text-amber-300">Forgot password?</button>
            <button type="button" onClick={() => { setShowRegister(true); }} className="text-slate-100">Create account</button>
          </div>
        </form>
      </div>
    </div>
    {showRegister && (
      <RegisterModal onClose={() => setShowRegister(false)} />
    )}
    {showForgot && (
      <ForgotPasswordModal onClose={() => setShowForgot(false)} />
    )}
    </>
  );
};

export default SignInModal;

