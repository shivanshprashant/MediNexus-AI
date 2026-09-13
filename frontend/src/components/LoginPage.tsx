import React, { useState } from 'react';
import { AppScreen } from '../types';

interface LoginPageProps {
  onLoginSuccess: (role: 'doctor' | 'patient', userName: string) => void;
  onNavigateScreen: (screen: AppScreen) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateScreen,
}) => {
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor'>('patient');
  const [emailOrPhone, setEmailOrPhone] = useState('ananya.sharma@example.com');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    setTimeout(() => {
      setIsAuthenticating(false);
      const nameMap = {
        patient: 'Ananya Sharma',
        doctor: 'Dr. Shiv Gupta',
      };
      onLoginSuccess(selectedRole, nameMap[selectedRole]);
    }, 900);
  };

  const handleDemoSignIn = (role: 'patient' | 'doctor') => {
    setSelectedRole(role);
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      const nameMap = {
        patient: 'Ananya Sharma',
        doctor: 'Dr. Shiv Gupta',
      };
      onLoginSuccess(role, nameMap[role]);
    }, 700);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface font-body antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 pt-safe transition-shadow duration-200">
        <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-lg mx-auto">
          <button
            onClick={() => onNavigateScreen('landing')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
              <span className="material-symbols-outlined text-[20px]">local_hospital</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-label-caps uppercase tracking-wider text-primary font-bold text-[11px]">
                MEDINEXUS AI
              </span>
              <span className="font-headline-md text-[15px] leading-tight font-semibold text-on-surface">
                Unified Portal Authentication
              </span>
            </div>
          </button>

          <button
            onClick={() => onNavigateScreen('landing')}
            className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold font-mono transition-all cursor-pointer border border-outline-variant/40"
          >
            ← Back to Home
          </button>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="w-full max-w-md mx-auto px-4 pt-20 pb-24 flex-1 flex flex-col justify-center">
        <div className="bg-white border border-[#d2e2d8] rounded-2xl p-6 md:p-8 shadow-2xs space-y-5 animate-in fade-in duration-200">
          <div className="text-center border-b border-gray-100 pb-4">
            <h1 className="text-xl font-bold text-[#142620] font-headline-md">
              Sign In to MediNexus AI
            </h1>
            <p className="text-xs text-[#526860] mt-0.5">
              Access your patient portal or clinical physician queue
            </p>
          </div>

          {/* Role Selector */}
          <div className="flex flex-col gap-2 p-1.5 bg-[#f0f6f2] rounded-xl border border-[#d2e2d8]">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('patient');
                setEmailOrPhone('ananya.sharma@example.com');
              }}
              className={`w-full py-2.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-between ${
                selectedRole === 'patient'
                  ? 'bg-white text-[#1b3b32] shadow-2xs border border-[#c4ded3]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">person</span>
                <span>Patient Account</span>
              </div>
              {selectedRole === 'patient' && <span className="text-[10px] font-mono font-bold text-[#2b8a66]">ACTIVE</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('doctor');
                setEmailOrPhone('dr.shiv@citycare.org');
              }}
              className={`w-full py-2.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-between ${
                selectedRole === 'doctor'
                  ? 'bg-white text-[#1b3b32] shadow-2xs border border-[#c4ded3]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">stethoscope</span>
                <span>Doctor / Physician</span>
              </div>
              {selectedRole === 'doctor' && <span className="text-[10px] font-mono font-bold text-[#2b8a66]">ACTIVE</span>}
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address or Phone Number
              </label>
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none font-medium"
                placeholder="email@example.com or +91..."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-[#2b8a66] font-bold hover:underline"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none"
                placeholder="••••••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-[#526860]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#1b3b32]"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => alert('Password reset link sent to registered email.')}
                className="text-[#2b8a66] hover:underline font-semibold"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 px-4 rounded-xl bg-[#1b3b32] hover:bg-[#122822] active:scale-[0.98] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 min-h-[44px]"
            >
              {isAuthenticating ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In as {selectedRole === 'patient' ? 'Patient' : 'Doctor'}</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Sign-Ins */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <span className="text-[10px] font-mono uppercase text-gray-400 block text-center font-bold">
              Instant Fast-Track Demo Access
            </span>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleDemoSignIn('patient')}
                className="w-full py-2.5 px-3 rounded-xl bg-[#fafdfb] hover:bg-[#e1eee7] border border-gray-200 text-xs font-mono text-gray-700 font-semibold cursor-pointer flex items-center justify-between"
              >
                <span>Demo Patient (Ananya Sharma)</span>
                <span>→</span>
              </button>
              <button
                onClick={() => handleDemoSignIn('doctor')}
                className="w-full py-2.5 px-3 rounded-xl bg-[#fafdfb] hover:bg-[#e1eee7] border border-gray-200 text-xs font-mono text-gray-700 font-semibold cursor-pointer flex items-center justify-between"
              >
                <span>Demo Doctor (Dr. Shiv Gupta)</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Registration Options Footer */}
          <div className="border-t border-gray-100 pt-4 space-y-2.5">
            <span className="text-xs text-[#526860] font-medium block text-center">New User? Register Your Account:</span>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onNavigateScreen('patient_register')}
                className="w-full py-3 px-3 rounded-xl bg-[#e1eee7] hover:bg-[#d4ebd9] text-[#1b3b32] font-bold text-xs transition-all cursor-pointer border border-[#c4ded3] text-center flex items-center justify-center gap-2 min-h-[44px]"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Register as Patient</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateScreen('doctor_register')}
                className="w-full py-3 px-3 rounded-xl bg-[#258360] hover:bg-[#1c664a] text-white font-bold text-xs transition-all cursor-pointer shadow-2xs text-center flex items-center justify-center gap-2 min-h-[44px]"
              >
                <span className="material-symbols-outlined text-[18px]">stethoscope</span>
                <span>Register as Doctor</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-4 text-center text-xs font-mono text-[#526860] border-t border-[#d2e2d8]">
        ABDM (Ayushman Bharat) & ABHA Compliant Authentication Node
      </footer>
    </div>
  );
};
