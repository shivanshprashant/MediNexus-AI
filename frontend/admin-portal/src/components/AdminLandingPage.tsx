import React from 'react';

interface AdminLandingPageProps {
  onNavigateScreen: (screen: 'landing' | 'login' | 'register' | 'dashboard') => void;
  hospitalName?: string;
  hospitalCode?: string;
}

export const AdminLandingPage: React.FC<AdminLandingPageProps> = ({
  onNavigateScreen,
  hospitalName = 'CityCare Hospital',
  hospitalCode = 'HSP-001',
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface font-body antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 pt-safe transition-shadow duration-200">
        <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigateScreen('landing')}>
            <div className="w-9 h-9 rounded-lg bg-[#1b3b32] flex items-center justify-center text-[#4edea3] shadow-sm">
              <span className="material-symbols-outlined text-[20px]">domain</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps uppercase tracking-wider text-[#1b3b32] font-bold text-[11px]">
                MEDINEXUS ADMIN
              </span>
              <span className="font-headline-md text-[15px] leading-tight font-semibold text-on-surface truncate">
                Hospital OS Platform
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateScreen('login')}
            className="px-4 py-1.5 rounded-xl bg-[#1b3b32] hover:bg-[#122822] text-white text-xs font-bold font-mono transition-all cursor-pointer shadow-2xs"
          >
            Admin Sign In
          </button>
        </div>
      </header>

      {/* Main App Container */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-24 pb-12 space-y-6 flex flex-col justify-center animate-in fade-in duration-200">
        {/* Main Hero Card */}
        <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 shadow-2xs space-y-5 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e1eee7] text-[#1b3b32] text-[11px] font-mono font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[16px] text-[#2b8a66]">domain_add</span>
            <span>Hospital Network Management</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight leading-snug font-headline-md">
            Dedicated Multi-Hospital Operations & Triage Platform
          </h1>

          <p className="text-xs text-on-surface-variant leading-relaxed max-w-md mx-auto font-medium">
            Manage hospital departments, bed availability (General, ICU, ER), physician shifts, and incoming emergency triage requests with isolated hospital nodes.
          </p>

          {/* Registration & Login Pathways */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => onNavigateScreen('register')}
              className="w-full py-3.5 px-4 rounded-xl bg-[#2b8a66] hover:bg-[#20694e] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px]">domain_add</span>
              <span>Register & Onboard New Hospital</span>
            </button>

            <button
              onClick={() => onNavigateScreen('login')}
              className="w-full py-3.5 px-4 rounded-xl bg-[#1b3b32] hover:bg-[#122822] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>Sign In with Hospital ID</span>
            </button>

            <button
              onClick={() => onNavigateScreen('dashboard')}
              className="w-full py-3 px-4 rounded-xl bg-[#f0f6f2] hover:bg-[#e2f0e8] text-[#1b3b32] border border-[#c4ded3] text-xs font-bold uppercase tracking-wider transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer font-mono min-h-[42px]"
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              <span>View Demo Dashboard ({hospitalName})</span>
            </button>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-[#d2e2d8] text-center space-y-1">
            <span className="material-symbols-outlined text-[#2b8a66] text-[22px]">single_bed</span>
            <h3 className="text-xs font-bold text-gray-900">Bed Control</h3>
            <p className="text-[11px] text-[#526860]">Real-time ward & ICU bed capacity tracking</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#d2e2d8] text-center space-y-1">
            <span className="material-symbols-outlined text-[#c92a2a] text-[22px]">emergency</span>
            <h3 className="text-xs font-bold text-gray-900">ER Triage</h3>
            <p className="text-[11px] text-[#526860]">Instant emergency intakes & AI clinical summaries</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#d2e2d8] text-center space-y-1">
            <span className="material-symbols-outlined text-[#1971c2] text-[22px]">stethoscope</span>
            <h3 className="text-xs font-bold text-gray-900">Doctor Roster</h3>
            <p className="text-[11px] text-[#526860]">Department shift schedules & duty status</p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-[11px] text-on-surface-variant font-mono py-2">
          MediNexus AI Admin • Multi-Hospital Node Isolation Protocol Active
        </div>
      </main>
    </div>
  );
};
