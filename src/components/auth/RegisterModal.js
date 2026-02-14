import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext-new';
import toast from 'react-hot-toast';

const RegisterModal = ({ onClose }) => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords must match.');
      return;
    }

    try {
      setError('');
      await register(form.email.trim(), form.password, form.firstName.trim(), form.lastName.trim(), form.phone.trim());
      toast.success('Account created successfully.');
      const redirect = sessionStorage.getItem('authRedirect');
      if (redirect) {
        sessionStorage.removeItem('authRedirect');
        navigate(redirect, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Unable to register at this time.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => { if (onClose) onClose(); }} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white/5 border border-white/10 p-6 shadow-2xl backdrop-blur-lg">
        <button onClick={() => { if (onClose) onClose(); }} className="absolute top-3 right-3 text-white">✕</button>
        <h2 className="text-xl font-semibold text-white mb-2">Create your account</h2>
        <p className="text-sm text-slate-300 mb-4">Join PropertyArk to track favorites, organize viewings, and keep everything in sync.</p>

        {error && (
          <div className="rounded-md border border-red-400/70 bg-red-500/10 px-3 py-2 text-sm text-red-200 mb-3">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <input value={form.firstName} onChange={handleChange('firstName')} placeholder="First name" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" />
            <input value={form.lastName} onChange={handleChange('lastName')} placeholder="Last name" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" />
          </div>
          <input type="email" value={form.email} onChange={handleChange('email')} placeholder="Email" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" />
          <input value={form.phone} onChange={handleChange('phone')} placeholder="Phone (optional)" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" />

          <div className="grid gap-3 md:grid-cols-2">
            <input type="password" value={form.password} onChange={handleChange('password')} placeholder="Password" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" />
            <input type="password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} placeholder="Confirm password" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" />
          </div>

          <div className="flex flex-col">
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-black font-semibold">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;
import React, { useEffect, useRef } from 'react';
import RegisterPage from '../../pages/auth/RegisterPage';

const RegisterModal = ({ onClose }) => {
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
      aria-label="Register"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div
        ref={containerRef}
        className="relative w-full max-w-3xl mx-4 sm:mx-auto bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md overflow-y-auto max-h-[90vh] transform transition duration-300 ease-out"
        style={{
          // mobile: slide up; desktop: scale in
        }}
        onClick={onPanelClick}
      >
        <button
          onClick={onClose}
          aria-label="Close register modal"
          className="absolute right-3 top-3 text-gray-700 dark:text-gray-200 text-2xl sm:text-3xl"
        >
          ✕
        </button>

        <div className="w-full">
          <RegisterPage isModal={true} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
