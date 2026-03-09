import React from 'react';

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.8h5.32c-.23 1.24-.93 2.29-1.98 3l3.19 2.48c1.86-1.73 2.94-4.27 2.94-7.32 0-.7-.06-1.37-.18-2H12z"
    />
    <path
      fill="#34A853"
      d="M6.56 14.32l-.73.55-2.54 1.98C4.8 19.9 8.16 22 12 22c2.43 0 4.47-.8 5.96-2.18l-3.19-2.48c-.86.58-1.95.94-2.77.94-2.14 0-3.96-1.44-4.61-3.39z"
    />
    <path
      fill="#4A90E2"
      d="M3.29 7.15A9.97 9.97 0 0 0 2 12c0 1.64.39 3.17 1.08 4.5l3.48-2.7A5.93 5.93 0 0 1 6.4 12c0-.58.1-1.15.28-1.68z"
    />
    <path
      fill="#FBBC05"
      d="M12 6.5c1.32 0 2.5.45 3.43 1.34l2.56-2.56C16.45 3.43 14.41 2.5 12 2.5 8.16 2.5 4.8 4.6 3.29 7.15l3.39 2.67C7.04 7.94 8.86 6.5 12 6.5z"
    />
  </svg>
);

const GoogleAuthButton = ({ label = 'Continue with Google', onClick, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full rounded-2xl border border-white/20 bg-white/90 px-4 py-3 text-center font-semibold text-slate-900 shadow-lg shadow-slate-900/10 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
  >
    <span className="flex items-center justify-center gap-3 text-sm">
      <GoogleIcon />
      <span>{label}</span>
    </span>
  </button>
);

export default GoogleAuthButton;
