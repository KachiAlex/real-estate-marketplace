import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext-new';
import AuthLayout from '../../components/layout/AuthLayout';
import StaticHeroBanner from '../../components/StaticHeroBanner';
import toast from 'react-hot-toast';
import getPostLoginRoute from '../../utils/getPostLoginRoute';
import { getApiUrl } from '../../utils/apiConfig';
import { uploadToCloudinaryDirect } from '../../utils/cloudinaryDirectUpload';
import { validatePasswordStrength, PASSWORD_REQUIREMENTS, getPasswordRequirementErrors } from '../../utils/passwordPolicy';

const PasswordRequirementsList = ({ passwordStrength }) => {
  if (!passwordStrength) return null;
  return (
    <div className="mt-3 rounded-xl bg-white/5 px-4 py-3 text-xs text-white/80">
      <p className="mb-2 font-semibold uppercase tracking-[0.2em] text-white/60">Password requirements</p>
      <ul className="space-y-1.5">
        {PASSWORD_REQUIREMENTS.map(({ key, label }) => (
          <li key={key} className="flex items-center gap-2">
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full ${passwordStrength.requirements[key] ? 'bg-emerald-400' : 'bg-white/30'}`}
            />
            <span className={passwordStrength.requirements[key] ? 'text-white' : 'text-white/60'}>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const RegisterPage = ({ isModal = false, onClose }) => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+234',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [roles, setRoles] = useState(['user']);
  const [vendorFiles, setVendorFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const formatBackendErrors = (details) => {
    if (!details) return null;
    if (Array.isArray(details) && details.length) {
      return details
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item?.msg) return `${item.msg}${item.param ? ` (${item.param})` : ''}`;
          if (item?.message) return item.message;
          return null;
        })
        .filter(Boolean)
        .join('\n');
    }
    if (typeof details === 'string') return details;
    if (details?.message) return details.message;
    return null;
  };

  const mapBackendFieldErrors = (details) => {
    if (!details) return null;
    const next = {};
    if (Array.isArray(details)) {
      details.forEach((item) => {
        if (!item) return;
        const message = item.msg || item.message || (typeof item === 'string' ? item : null);
        const param = item.param || item.field;
        if (param && message) {
          next[param] = message;
        }
      });
    }
    return Object.keys(next).length ? next : null;
  };

  const validatePhoneNumber = (value) => {
    if (!value) return 'Phone number is required.';
    const numeric = value.replace(/\s+/g, '');
    if (!/^\d{7,15}$/.test(numeric)) {
      return 'Phone number should contain 7-15 digits (numbers only).';
    }
    return null;
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
    if (field === 'password') {
      setPasswordStrength(value ? validatePasswordStrength(value) : null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const newFieldErrors = {};
    const requireField = (value, key, label) => {
      if (!value || !value.trim()) {
        newFieldErrors[key] = `${label} is required.`;
      }
    };

    requireField(form.firstName, 'firstName', 'First name');
    requireField(form.lastName, 'lastName', 'Last name');
    requireField(form.email, 'email', 'Email');
    requireField(form.password, 'password', 'Password');
    requireField(form.confirmPassword, 'confirmPassword', 'Confirm password');

    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords must match.';
    }

    const strength = validatePasswordStrength(form.password || '');
    if (!strength.isStrong) {
      const missing = getPasswordRequirementErrors(form.password);
      newFieldErrors.password = `Password must meet all requirements: ${missing.join(', ')}`;
    }

    const trimmedPhone = form.phoneNumber?.trim();
    const phoneError = validatePhoneNumber(trimmedPhone);
    if (phoneError) {
      newFieldErrors.phoneNumber = phoneError;
    }

    if (Object.keys(newFieldErrors).length) {
      setFieldErrors(newFieldErrors);
      setError('Please fix the highlighted fields.');
      return;
    }

    try {
      setError('');
      setFieldErrors({});
      const options = { roles };
      if (roles.includes('vendor') && vendorFiles.length) {
        options.vendorKycDocs = vendorFiles.map(f => ({ url: f.url, name: f.name, publicId: f.publicId }));
      }

      const payload = {
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        ...options
      };

      payload.countryCode = form.countryCode?.trim();
      payload.phoneNumber = trimmedPhone.replace(/\s+/g, '');

      await register(payload);
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
      const backendFieldErrors = mapBackendFieldErrors(submitError.details);
      if (backendFieldErrors) {
        setFieldErrors((prev) => ({ ...prev, ...backendFieldErrors }));
      }
      const formatted = formatBackendErrors(submitError.details);
      setError(formatted || submitError.message || 'Unable to register at this time.');
    }

};

const toggleRole
 = (r) => {
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
      // Safely parse JSON responses; if server returned HTML (404/500 page), capture text for debugging
      let uploaded = [];
      try {
        const text = await resp.text();
        let parsed = null;
        try { parsed = JSON.parse(text); } catch (e) { parsed = null; }
        if (!resp.ok) {
          const serverMsg = (parsed && (parsed.message || parsed.error)) || text || 'Upload failed';
          console.error('Upload failed response:', { status: resp.status, body: text });
          throw new Error(serverMsg);
        }
        const data = parsed || {};
        uploaded = (data.data && data.data.uploaded) || [];
      } catch (err) {
        console.error('Upload error parsing response', err);
        throw err;
      }
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
  <div className="mb-6 space-y-4">
    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
      <span className="h-px flex-1 bg-white/10" />
      <span>Complete the form</span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  </div>
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
              name="firstName"
              value={form.firstName}
              onChange={handleChange('firstName')}
              className={`mt-2 w-full h-11 min-h-[44px] rounded-2xl border px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 ${fieldErrors.firstName ? 'border-red-400 focus:border-red-400 focus:ring-red-400/50' : 'border-white/20 focus:border-white focus:ring-amber-400/70'} bg-white/10`}
              placeholder="Jane"
            />
            {fieldErrors.firstName && <p className="mt-1 text-xs text-red-300">{fieldErrors.firstName}</p>}
          </label>
          <label className="text-sm text-slate-200">
            <span className="font-medium">Last name</span>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange('lastName')}
              className={`mt-2 w-full h-11 min-h-[44px] rounded-2xl border px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 ${fieldErrors.lastName ? 'border-red-400 focus:border-red-400 focus:ring-red-400/50' : 'border-white/20 focus:border-white focus:ring-amber-400/70'} bg-white/10`}
              placeholder="Doe"
            />
            {fieldErrors.lastName && <p className="mt-1 text-xs text-red-300">{fieldErrors.lastName}</p>}
          </label>
        </div>

        <div className="text-sm text-slate-200">
          <span className="font-medium">Register as</span>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <label className="inline-flex min-h-[44px] items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
              <input type="checkbox" checked={roles.includes('user')} onChange={() => toggleRole('user')} className="w-4 h-4 cursor-pointer" />
              <span>Buyer</span>
            </label>
            <label className="inline-flex min-h-[44px] items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
              <input type="checkbox" checked={roles.includes('vendor')} onChange={() => toggleRole('vendor')} className="w-4 h-4 cursor-pointer" />
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
            name="email"
            value={form.email}
            onChange={handleChange('email')}
            className={`mt-2 w-full rounded-2xl border px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 ${fieldErrors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400/50' : 'border-white/20 focus:border-white focus:ring-amber-400/70'} bg-white/10`}
            placeholder="you@email.com"
          />
          {fieldErrors.email && <p className="mt-1 text-xs text-red-300">{fieldErrors.email}</p>}
        </label>

        <div className="grid gap-2 md:grid-cols-3 items-end">
          <label className="text-sm text-slate-200 md:col-span-1">
            <span className="font-medium">Country</span>
            <select
              value={form.countryCode}
              onChange={handleChange('countryCode')}
              className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
            >
              <option value="+234">🇳🇬 +234 (Nigeria)</option>
              <option value="+1">🇺🇸 +1 (United States)</option>
              <option value="+44">🇬🇧 +44 (United Kingdom)</option>
              <option value="+233">🇬🇭 +233 (Ghana)</option>
              <option value="+27">🇿🇦 +27 (South Africa)</option>
              <option value="+91">🇮🇳 +91 (India)</option>
              <option value="+61">🇦🇺 +61 (Australia)</option>
              <option value="+20">🇪🇬 +20 (Egypt)</option>
              <option value="+7">🇷🇺 +7 (Russia)</option>
              <option value="+49">🇩🇪 +49 (Germany)</option>
              <option value="+33">🇫🇷 +33 (France)</option>
              <option value="+82">🇰🇷 +82 (South Korea)</option>
              <option value="+86">🇨🇳 +86 (China)</option>
              <option value="+971">🇦🇪 +971 (UAE)</option>
              <option value="+234">Other (enter manually)</option>
            </select>
          </label>

          <label className="text-sm text-slate-200 md:col-span-2">
            <span className="font-medium">Phone number (no country code)</span>
            <input
              type="text"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange('phoneNumber')}
              className={`mt-2 w-full rounded-2xl border px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 ${fieldErrors.phoneNumber ? 'border-red-400 focus:border-red-400 focus:ring-red-400/50' : 'border-white/20 focus:border-white focus:ring-amber-400/70'} bg-white/10`}
              placeholder="8147704016"
            />
            {fieldErrors.phoneNumber && <p className="mt-1 text-xs text-red-300">{fieldErrors.phoneNumber}</p>}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-200">
            <span className="font-medium">Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange('password')}
              className={`mt-2 w-full h-11 min-h-[44px] rounded-2xl border px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 ${fieldErrors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400/50' : 'border-white/20 focus:border-white focus:ring-amber-400/70'} bg-white/10`}
              placeholder="Create a password"
            />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-300">{fieldErrors.password}</p>}
            <PasswordRequirementsList passwordStrength={passwordStrength} />
          </label>
          <label className="text-sm text-slate-200">
            <span className="font-medium">Confirm password</span>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              className={`mt-2 w-full h-11 min-h-[44px] rounded-2xl border px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 ${fieldErrors.confirmPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-400/50' : 'border-white/20 focus:border-white focus:ring-amber-400/70'} bg-white/10`}
              placeholder="Re-enter password"
            />
            {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-300">{fieldErrors.confirmPassword}</p>}
          </label>
        </div>


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
