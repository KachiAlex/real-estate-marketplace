import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext-new';
import AuthLayout from '../../components/layout/AuthLayout';
import StaticHeroBanner from '../../components/StaticHeroBanner';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/apiConfig';
import { uploadToCloudinaryDirect } from '../../utils/cloudinaryDirectUpload';

const RegisterPage = ({ isModal = false, onClose }) => {
  const { register, loading, signInWithGooglePopup } = useAuth();
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
  const [roles, setRoles] = useState(['user']);
  const [vendorFiles, setVendorFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      const options = { roles };
      if (roles.includes('vendor') && vendorFiles.length) {
        options.vendorKycDocs = vendorFiles.map(f => ({ url: f.url, name: f.name, publicId: f.publicId }));
      }
      await register(form.email.trim(), form.password, form.firstName.trim(), form.lastName.trim(), form.phone.trim(), options);
      toast.success('Account created successfully.');
      // Redirect to intended destination if set (e.g., escrow flow)
      const redirect = sessionStorage.getItem('authRedirect');
      if (redirect) {
        sessionStorage.removeItem('authRedirect');
        navigate(redirect, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (submitError) {
      setError(submitError.message || 'Unable to register at this time.');
    }
  };

  const toggleRole = (r) => {
    setRoles(prev => {
      const s = new Set(prev || []);
      if (s.has(r)) s.delete(r); else s.add(r);
      // Ensure at least 'user' exists if none selected
      if (s.size === 0) s.add('user');
      return Array.from(s);
    });
  };

  const handleVendorFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      // Try to obtain signed upload params for direct client upload
      let signedResp = null;
      try {
        signedResp = await fetch(getApiUrl('/upload/vendor/kyc/signed'));
      } catch (err) {
        signedResp = null;
      }

      if (signedResp && signedResp.ok) {
        const signedJson = await signedResp.json().catch(() => null);
        const signedParams = signedJson && signedJson.data;
        if (signedParams) {
          const uploads = [];
          for (const f of files) {
            try {
              const upl = await uploadToCloudinaryDirect(f, signedParams);
              uploads.push(upl);
            } catch (err) {
              console.warn('Direct upload failed for file', f.name, err);
            }
          }
          if (uploads.length) {
            setVendorFiles(prev => [...prev, ...uploads]);
            toast.success('KYC documents uploaded');
            setUploading(false);
            return;
          }
          // if direct uploads failed, fall through to server upload
        }
      }

      // Fallback: upload to server endpoint which stores temp files
      const formData = new FormData();
      files.forEach(f => formData.append('documents', f));
      const resp = await fetch(getApiUrl('/upload/vendor/kyc'), { method: 'POST', body: formData });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Upload failed');
      const uploaded = (data.data && data.data.uploaded) || [];
      setVendorFiles(prev => [...prev, ...uploaded]);
      toast.success('KYC documents uploaded');
    } catch (err) {
      console.error('Upload error', err);
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Only show StaticHeroBanner if not in modal */}
      {!isModal && <StaticHeroBanner />}
      <AuthLayout
        title="Create your account"
        description="Join PropertyArk to track favorites, organize viewings, and keep every chat, document, and alert in sync."
        footer="We respect your privacy and never share your details without consent."
        isModal={isModal}
        onClose={onClose}
      >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-2xl border border-red-400/70 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-200">
            <span className="font-medium">First name</span>
            <input
              type="text"
              value={form.firstName}
              onChange={handleChange('firstName')}
              className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
              placeholder="Jane"
            />
          </label>
          <label className="text-sm text-slate-200">
            <span className="font-medium">Last name</span>
            <input
              type="text"
              value={form.lastName}
              onChange={handleChange('lastName')}
              className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
              placeholder="Doe"
            />
          </label>
        </div>

        <div className="text-sm text-slate-200">
          <span className="font-medium">Register as</span>
          <div className="mt-2 flex gap-3">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={roles.includes('user')} onChange={() => toggleRole('user')} />
              <span>Buyer</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={roles.includes('vendor')} onChange={() => toggleRole('vendor')} />
              <span>Vendor</span>
            </label>
          </div>
        </div>

        {roles.includes('vendor') && (
          <div>
            <label className="text-sm text-slate-200">
              <span className="font-medium">Upload NIN / KYC document (required for vendors)</span>
              <input type="file" onChange={handleVendorFiles} multiple className="mt-2 block w-full text-sm text-white/70" />
            </label>
            {uploading && <div className="text-sm text-amber-200">Uploading...</div>}
            {vendorFiles.length > 0 && (
              <ul className="mt-2 text-sm text-slate-200">
                {vendorFiles.map((f, i) => (
                  <li key={i}>{f.name || f.url}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <label className="text-sm text-slate-200">
          <span className="font-medium">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
            placeholder="you@email.com"
          />
        </label>

        <label className="text-sm text-slate-200">
          <span className="font-medium">Phone (optional)</span>
          <input
            type="text"
            value={form.phone}
            onChange={handleChange('phone')}
            className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
            placeholder="+1 234 567 8900"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-200">
            <span className="font-medium">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
              placeholder="Create a password"
            />
          </label>
          <label className="text-sm text-slate-200">
            <span className="font-medium">Confirm password</span>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
              placeholder="Re-enter password"
            />
          </label>
        </div>


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
            } catch (e) {}
          }}
          className="w-full mb-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white font-semibold hover:bg-white/20 transition"
        >
          Sign up with Google
        </button>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-center text-base font-semibold text-slate-900 shadow-lg shadow-orange-500/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <div className="text-sm text-slate-200">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-amber-300 hover:text-amber-200">
            Sign in
          </Link>
        </div>
      </form>
      </AuthLayout>
    </>
  );
};

export default RegisterPage;
