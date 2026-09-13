import React from 'react';
import { AppScreen } from '../types';

interface LandingPageProps {
  onNavigateScreen: (screen: AppScreen) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateScreen }) => {
  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface font-body antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 pt-safe transition-shadow duration-200">
        <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigateScreen('landing')}>
            <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
              <span className="material-symbols-outlined text-[20px]">local_hospital</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps uppercase tracking-wider text-primary font-bold text-[11px]">
                MEDINEXUS AI
              </span>
              <span className="font-headline-md text-[15px] leading-tight font-semibold text-on-surface truncate">
                Healthcare, Connected
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateScreen('login')}
            className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold font-mono transition-all cursor-pointer shadow-2xs"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Main App Container */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-24 pb-12 space-y-6 flex flex-col justify-center animate-in fade-in duration-200">
        {/* Main Hero Registration Card */}
        <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 shadow-2xs space-y-5 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-clinical-light text-primary text-[11px] font-mono font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[16px]">domain</span>
            <span>Unified Healthcare Network</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight leading-snug font-headline-md">
            Connecting Patients, Doctors, and Hospitals into One AI Network
          </h1>

          <p className="text-xs text-on-surface-variant leading-relaxed max-w-md mx-auto font-medium">
            MediNexus AI unifies patient symptom triage, emergency ER bed reservation, physician clinical queues, and hospital department management.
          </p>

          {/* Registration & Login Pathways */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => onNavigateScreen('patient_register')}
              className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-container active:scale-[0.98] text-on-primary text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Register as Patient</span>
            </button>

            <button
              onClick={() => onNavigateScreen('doctor_register')}
              className="w-full py-3.5 px-4 rounded-xl bg-clinical hover:bg-clinical-dark active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px]">stethoscope</span>
              <span>Register as Doctor</span>
            </button>

            <button
              onClick={() => onNavigateScreen('login')}
              className="w-full py-3 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/40 text-xs font-bold uppercase tracking-wider transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer font-mono min-h-[42px]"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>Sign In to Existing Account</span>
            </button>
          </div>
        </section>

        {/* Clean App Footer Note */}
        <div className="text-center text-[11px] text-on-surface-variant font-mono py-2">
          MediNexus AI • ABDM & ABHA Compliant Healthcare Network
        </div>
      </main>
    </div>
  );
};
