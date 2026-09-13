import React, { useState } from 'react';

interface HospitalAdminLoginProps {
  onLoginSuccess: (adminName: string) => void;
  onBackToRoles: () => void;
}

export const HospitalAdminLogin: React.FC<HospitalAdminLoginProps> = ({
  onLoginSuccess,
  onBackToRoles,
}) => {
  const [hospitalCode, setHospitalCode] = useState('HSP-001');
  const [adminEmail, setAdminEmail] = useState('admin@citycare.org');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [authStep, setAuthStep] = useState<'form' | 'authenticating' | 'success'>('form');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthStep('authenticating');

    setTimeout(() => {
      setAuthStep('success');
      setTimeout(() => {
        onLoginSuccess('Admin Rajesh Sharma');
      }, 800);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f4] text-[#1c2d27] flex flex-col justify-between antialiased font-body">
      {/* Top Header */}
      <header className="w-full pt-8 pb-3 px-6 flex flex-col items-center max-w-[440px] mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b3b32] text-[#e2f3eb] text-[11px] font-mono tracking-widest font-semibold uppercase mb-3 shadow-xs">
          <span className="material-symbols-outlined text-[14px] text-[#4edea3]">domain</span>
          <span>Hospital Operations Portal</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142620] flex items-center gap-2 justify-center font-headline-md">
          <span>CityCare Hospital</span>
          <span className="text-xs px-2 py-0.5 rounded bg-[#e1eee7] text-[#1b3b32] font-mono border border-[#c4ded3]">HSP-001</span>
        </h1>
        <p className="text-xs text-[#526860] mt-1 font-mono uppercase tracking-wider">
          Hospital Administration & Emergency Operations
        </p>
      </header>

      {/* Main Login Form Container */}
      <main className="w-full max-w-[420px] mx-auto px-5 py-2 flex-1 flex flex-col justify-center">
        {authStep === 'form' && (
          <section className="w-full bg-white border border-[#d2e2d8] rounded-2xl p-6 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#ebf2ee] pb-3.5 mb-5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#1b3b32] font-bold block">
                  Multi-Hospital Network
                </span>
                <h2 className="text-base font-bold text-gray-900 leading-tight">
                  Hospital Admin Sign In
                </h2>
              </div>
              <button
                onClick={onBackToRoles}
                className="text-xs text-[#526860] hover:text-[#1b3b32] flex items-center gap-1 font-medium py-1 px-2.5 rounded-lg bg-[#f0f6f2] border border-[#d2e2d8] active:bg-[#e4efe8] transition-colors cursor-pointer"
                type="button"
              >
                ← Back
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Hospital Identifier (Hospital ID)
                </label>
                <input
                  type="text"
                  required
                  value={hospitalCode}
                  onChange={(e) => setHospitalCode(e.target.value)}
                  className="w-full text-sm font-mono uppercase rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none font-medium"
                  placeholder="HSP-001"
                />
                <span className="text-[11px] text-[#637a71] mt-1 block">
                  Isolated portal for CityCare Hospital.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Admin Email / Official ID
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none"
                  placeholder="admin@citycare.org"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700">Admin Key / Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-[#1b3b32] font-bold hover:underline"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none"
                  placeholder="••••••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-3 px-4 rounded-xl bg-[#1b3b32] hover:bg-[#122822] active:scale-[0.98] text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In to Dashboard</span>
                <span>→</span>
              </button>
            </form>
          </section>
        )}

        {authStep !== 'form' && (
          <div className="w-full bg-white border border-[#d2e2d8] rounded-2xl p-6 shadow-md text-center transition-all animate-in fade-in duration-200">
            {authStep === 'authenticating' ? (
              <>
                <div className="w-12 h-12 mx-auto mb-3.5 text-[#1b3b32] flex items-center justify-center">
                  <svg className="animate-spin w-9 h-9" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  Authenticating CityCare Hospital Credentials...
                </h3>
                <p className="text-xs text-[#526860] leading-relaxed font-mono">
                  Loading isolated hospital node [HSP-001]...
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-[#e1eee7] text-[#1b3b32] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px] font-bold">verified</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900">Hospital Admin Authenticated</h3>
                <p className="text-[12px] font-mono text-[#526860]">
                  Redirecting to <span className="text-[#1b3b32] font-bold">CityCare Hospital Dashboard</span>...
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[420px] mx-auto px-5 pb-6 pt-2 flex flex-col gap-2 text-center">
        <div className="w-full bg-white/80 border border-[#d2e2d8] rounded-xl py-2 px-3 text-[11px] text-[#2c423a] flex items-center justify-center gap-2 shadow-2xs font-mono">
          <span className="material-symbols-outlined text-[#1b3b32] text-[16px]">security</span>
          <span>Multi-Hospital Isolation Policy Active • Node HSP-001</span>
        </div>
      </footer>
    </div>
  );
};
