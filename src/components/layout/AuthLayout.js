import React from 'react';

const AuthLayout = ({
  title,
  description,
  footer,
  children
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative isolate min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#050B1E] to-[#11131F]" aria-hidden="true" />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
          <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-2xl">
              <div className="mb-8 space-y-2 text-white">
                <p className="text-xs uppercase tracking-[0.4em] text-amber-300/90">PropertyArk</p>
                <h1 className="text-3xl font-semibold leading-tight text-white">{title}</h1>
                <p className="text-base text-slate-200">{description}</p>
              </div>
              <div className="space-y-6">
                {children}
              </div>
              {footer && (
                <div className="mt-6 text-sm text-slate-300">
                  {footer}
                </div>
              )}
            </div>
            <div className="hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-orange-500/30 to-pink-500/30 p-8 text-white shadow-2xl backdrop-blur-2xl lg:flex lg:flex-col">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80">What you gain</p>
              <ul className="mt-6 space-y-4 text-base font-medium text-white">
                <li>• Save fresh listings so you never lose track of a favorite.</li>
                <li>• Build alerts that notify you when matching properties appear.</li>
                <li>• Chat with agents, request viewings, and manage inquiries in one place.</li>
                <li>• Securely manage documents and escrows without leaving the dashboard.</li>
              </ul>
              <p className="mt-8 text-sm leading-relaxed text-white/80">
                Designed for modern property discoverers — it’s calm, fast, and always ready when you are.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
