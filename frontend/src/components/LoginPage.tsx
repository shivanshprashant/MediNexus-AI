import React, { useState } from 'react';
import { AppScreen } from '../types';

import { loginUser, resetPasswordApi } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (role: 'doctor' | 'patient', userName: string) => void;
  onNavigateScreen: (screen: AppScreen) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateScreen,
}) => {
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor'>('patient');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Password Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setLoginError(null);

    try {
      const res = await loginUser({
        email: emailOrPhone,
        password: password,
        role: selectedRole,
      });
      setIsAuthenticating(false);
      onLoginSuccess(selectedRole, res.full_name || (selectedRole === 'patient' ? 'Patient' : 'Doctor'));
    } catch (err: any) {
      setIsAuthenticating(false);
      setLoginError(err.message || 'Invalid email or password. Please try again.');
    }
  };

  const handleDemoSignIn = async (role: 'patient' | 'doctor') => {
    setSelectedRole(role);
    setIsAuthenticating(true);
    setLoginError(null);

    const demoEmail = role === 'patient' ? 'ananya.sharma@example.com' : 'dr.shiv@citycare.org';
    try {
      const res = await loginUser({
        email: demoEmail,
        password: 'password123',
        role: role,
      });
      setIsAuthenticating(false);
      onLoginSuccess(role, res.full_name || (role === 'patient' ? 'Ananya Sharma' : 'Dr. Shiv Gupta'));
    } catch (err: any) {
      setIsAuthenticating(false);
      setLoginError(err.message || 'Demo authentication failed. Please register your account first.');
    }
  };

  const handleOpenResetModal = () => {
    setResetEmail(emailOrPhone);
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetError(null);
    setResetSuccess(null);
    setShowResetModal(true);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetEmail.trim()) {
      setResetError('Email address is required.');
      return;
    }

    if (resetNewPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('New passwords do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await resetPasswordApi({
        email: resetEmail.trim(),
        new_password: resetNewPassword,
        role: selectedRole,
      });
      setIsResetting(false);
      setResetSuccess(res.message || 'Password updated successfully! You can now log in.');
      setEmailOrPhone(resetEmail.trim());
      setPassword('');
    } catch (err: any) {
      setIsResetting(false);
      setResetError(err.message || 'Failed to reset password. Please verify your email.');
    }
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
              Secure Unified Healthcare Access • ABDM Compliant Node
            </p>
          </div>

          {/* Role Toggle */}
          <div className="grid grid-cols-2 p-1 bg-[#f0f6f3] rounded-xl border border-[#d2e2d8]">
            <button
              type="button"
              onClick={() => setSelectedRole('patient')}
              className={`py-2 text-xs font-bold font-label-caps uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                selectedRole === 'patient'
                  ? 'bg-white text-[#1b3b32] shadow-xs'
                  : 'text-[#526860] hover:text-[#1b3b32]'
              }`}
            >
              Patient Portal
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('doctor')}
              className={`py-2 text-xs font-bold font-label-caps uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                selectedRole === 'doctor'
                  ? 'bg-[#258360] text-white shadow-xs'
                  : 'text-[#526860] hover:text-[#1b3b32]'
              }`}
            >
              Doctor Portal
            </button>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{loginError}</span>
            </div>
          )}

          {resetSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{resetSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold font-label-caps text-[#526860] uppercase mb-1">
                {selectedRole === 'patient' ? 'Email Address or Username' : 'Doctor Work Email'}
              </label>
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder={
                  selectedRole === 'patient'
                    ? 'e.g. Shivansh Prashant or Shiv@example.com'
                    : 'e.g. dr.shiv@citycare.org'
                }
                className="w-full px-3.5 py-2.5 bg-[#fafdfb] border border-[#c4ded3] rounded-xl text-xs text-[#142620] focus:outline-none focus:ring-2 focus:ring-[#258360] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-label-caps text-[#526860] uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-[#fafdfb] border border-[#c4ded3] rounded-xl text-xs text-[#142620] focus:outline-none focus:ring-2 focus:ring-[#258360] focus:border-transparent transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
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
                onClick={handleOpenResetModal}
                className="text-[#2b8a66] hover:underline font-semibold cursor-pointer"
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

      {/* Password Reset Modal Popup */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl space-y-4 border border-[#d2e2d8] animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#258360] text-[22px]">lock_reset</span>
                <h3 className="font-headline-md text-base font-bold text-[#142620]">Reset Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {resetError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold font-label-caps text-[#526860] uppercase mb-1">
                  Registered Email Address or Username
                </label>
                <input
                  type="text"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="e.g. Shivansh Prashant or Shiv@example.com"
                  className="w-full px-3.5 py-2.5 bg-[#fafdfb] border border-[#c4ded3] rounded-xl text-xs text-[#142620] focus:outline-none focus:ring-2 focus:ring-[#258360]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-label-caps text-[#526860] uppercase mb-1">
                  New Password (Min. 6 chars)
                </label>
                <input
                  type="password"
                  required
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Enter new secure password"
                  className="w-full px-3.5 py-2.5 bg-[#fafdfb] border border-[#c4ded3] rounded-xl text-xs text-[#142620] focus:outline-none focus:ring-2 focus:ring-[#258360]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-label-caps text-[#526860] uppercase mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 bg-[#fafdfb] border border-[#c4ded3] rounded-xl text-xs text-[#142620] focus:outline-none focus:ring-2 focus:ring-[#258360]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs uppercase rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex-1 py-2.5 bg-[#1b3b32] text-white font-bold text-xs uppercase rounded-xl hover:bg-[#122822] shadow-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  {isResetting ? (
                    <span>Updating...</span>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-4 text-center text-xs font-mono text-[#526860] border-t border-[#d2e2d8]">
        ABDM (Ayushman Bharat) & ABHA Compliant Authentication Node
      </footer>
    </div>
  );
};
