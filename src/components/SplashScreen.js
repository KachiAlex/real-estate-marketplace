import React from 'react';

/**
 * Branded full-screen loading splash.
 * Used for app initialization, auth hydration, and route loading states.
 */
const SplashScreen = ({ label = 'Loading…' }) => {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen w-full"
      style={{ background: '#0f172a', fontFamily: "'Inter', Arial, sans-serif" }}
    >
      <img
        src={`${process.env.PUBLIC_URL}/logo.png`}
        alt="PropertyArk"
        className="w-[72px] h-[72px] mb-5"
        style={{ animation: 'splash-pulse 1.4s ease-in-out infinite' }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      <h1 className="text-2xl font-bold text-orange-500 mb-3.5 tracking-tight">
        PropertyArk
      </h1>
      <div
        className="w-9 h-9 rounded-full"
        style={{
          border: '3px solid rgba(249,115,22,0.2)',
          borderTopColor: '#f97316',
          animation: 'splash-spin 0.8s linear infinite'
        }}
      />
      <p className="mt-4 text-sm text-slate-400">{label}</p>
    </div>
  );
};

export default SplashScreen;
