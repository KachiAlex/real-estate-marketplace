import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext-new';
import AuthLayout from '../../components/layout/AuthLayout';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { login, loading, signInWithGooglePopup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
    } catch (submitError) {
      setError(submitError.message || 'Unexpected error while logging in.');
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to pick up where you left off — properties, alerts, and requests stay in sync across every device."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-2xl border border-red-400/70 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-200">Email</label>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
            placeholder="you@email.com"
            autoComplete="email"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-200">Password</label>
          <input
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-center text-base font-semibold text-slate-900 shadow-lg shadow-orange-500/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
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
            } catch (e) {
              // error already handled by context
            }
          }}
          className="w-full mt-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center text-base font-semibold text-white shadow-sm transition hover:brightness-95"
        >
          Sign in with Google
        </button>

        <div className="flex flex-wrap items-center justify-between text-sm text-slate-200">
          <Link to="/auth/forgot-password" className="text-amber-300 hover:text-amber-200">
            Forgot password?
          </Link>
          <Link to="/auth/register" className="text-slate-100 hover:text-white">
            Create account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
