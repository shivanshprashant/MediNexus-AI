import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (role: 'doctor' | 'patient', userName: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'role' | 'doctor-form' | 'patient-form' | 'authenticating'>('role');
  const [pendingRole, setPendingRole] = useState<'doctor' | 'patient'>('doctor');
  const [showDoctorPwd, setShowDoctorPwd] = useState(false);
  const [showPatientPwd, setShowPatientPwd] = useState(false);

  // Form states
  const [doctorName, setDoctorName] = useState('Dr. Shiv Gupta');
  const [doctorNpi, setDoctorNpi] = useState('MCI-948102-DL');
  const [doctorSpecialty, setDoctorSpecialty] = useState('cardiology');
  const [doctorPassword, setDoctorPassword] = useState('••••••••••••');

  const [patientName, setPatientName] = useState('Ananya Sharma');
  const [patientPhone, setPatientPhone] = useState('+91 98192 83104');
  const [patientAge, setPatientAge] = useState('29');
  const [patientBloodGroup, setPatientBloodGroup] = useState('O+');
  const [patientPassword, setPatientPassword] = useState('••••••••');

  const [authProgress, setAuthProgress] = useState(false);

  const startAuthSimulation = (role: 'doctor' | 'patient', name: string) => {
    setPendingRole(role);
    setStep('authenticating');
    setAuthProgress(false);

    setTimeout(() => {
      setAuthProgress(true);
      setTimeout(() => {
        onLoginSuccess(role, name);
      }, 900);
    }, 1100);
  };

  const handleDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startAuthSimulation('doctor', doctorName);
  };

  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startAuthSimulation('patient', patientName);
  };

  const bloodGroups = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

  return (
    <div className="min-h-screen bg-[#f6faf5] text-[#172822] flex flex-col justify-between antialiased selection:bg-[#d4ebd9] selection:text-[#246e52]">
      {/* Top App Header */}
      <header className="w-full pt-6 pb-2 px-6 flex flex-col items-center max-w-[420px] mx-auto text-center">
        {/* Top Clinical Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf4ec] border border-[#d2e7d7] text-[#2d8a66] text-[11px] font-mono tracking-wider font-semibold uppercase mb-3.5 shadow-sm">
          <span className="material-symbols-outlined text-[14px]">bolt</span>
          <span>Clinical Authentication</span>
        </div>

        {/* App Identity */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#162721] flex items-center gap-1.5 justify-center font-headline-md">
          <span>MediNexus</span>
          <span className="text-[#2d8a66]">AI</span>
        </h1>
        <p className="text-xs text-[#62766e] mt-0.5 tracking-normal italic font-medium">“Healthcare, connected.”</p>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-[400px] mx-auto px-5 py-4 flex-1 flex flex-col justify-center">
        {/* STEP 1: Role Selection */}
        {step === 'role' && (
          <section className="w-full flex flex-col gap-3.5 animate-in fade-in duration-200">
            <div className="text-center mb-1">
              <h2 className="text-lg font-semibold text-[#182a24]">Login as</h2>
              <p className="text-xs text-[#62766e] mt-0.5">Select your role to access your dedicated clinical station or portal</p>
            </div>

            {/* Doctor Card */}
            <button
              onClick={() => setStep('doctor-form')}
              className="w-full text-left bg-white border border-[#dce8dc] rounded-2xl p-5 shadow-sm hover:border-[#2d8a66] transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#2d8a66]/30 flex flex-col items-center text-center group cursor-pointer"
              type="button"
            >
              <div className="w-12 h-12 rounded-xl bg-[#edf6f0] border border-[#d6ebd9] flex items-center justify-center text-[#2d8a66] mb-3 group-hover:bg-[#e8f3ee] transition-colors">
                <span className="material-symbols-outlined text-[24px]">stethoscope</span>
              </div>
              <span className="text-base font-bold text-gray-900 tracking-tight">Doctor</span>
              <span className="text-xs text-[#62766e] mt-1 leading-relaxed px-2">Clinical triage, queue & consultations</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2d8a66] mt-3">
                Continue
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </button>

            {/* Patient Card */}
            <button
              onClick={() => setStep('patient-form')}
              className="w-full text-left bg-white border border-[#dce8dc] rounded-2xl p-5 shadow-sm hover:border-[#2d8a66] transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#2d8a66]/30 flex flex-col items-center text-center group cursor-pointer"
              type="button"
            >
              <div className="w-12 h-12 rounded-xl bg-[#edf6f0] border border-[#d6ebd9] flex items-center justify-center text-[#2d8a66] mb-3 group-hover:bg-[#e8f3ee] transition-colors">
                <span className="material-symbols-outlined text-[24px]">person</span>
              </div>
              <span className="text-base font-bold text-gray-900 tracking-tight">Patient</span>
              <span className="text-xs text-[#62766e] mt-1 leading-relaxed px-2">Personal health, appointments & SOS</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2d8a66] mt-3">
                Continue
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </button>
          </section>
        )}

        {/* STEP 2: Doctor Login Form */}
        {step === 'doctor-form' && (
          <section className="w-full bg-white border border-[#dce8dc] rounded-2xl p-5 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#2d8a66] font-semibold">Staff Station</span>
                <h2 className="text-base font-bold text-gray-900 leading-tight">Doctor Onboarding & Login</h2>
              </div>
              <button
                onClick={() => setStep('role')}
                className="text-xs text-[#62766e] hover:text-[#2d8a66] flex items-center gap-1 font-medium py-1 px-2.5 rounded-lg bg-gray-50 border border-gray-200 active:bg-gray-100 transition-colors cursor-pointer"
                type="button"
              >
                ← Back
              </button>
            </div>

            <form onSubmit={handleDoctorSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-200 focus:border-[#2d8a66] focus:ring-1 focus:ring-[#2d8a66] bg-[#fbfdfa] text-gray-900 py-2.5 px-3 outline-none"
                  placeholder="Dr. Shiv Gupta, MD"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Medical Registration / MCI</label>
                <input
                  type="text"
                  required
                  value={doctorNpi}
                  onChange={(e) => setDoctorNpi(e.target.value)}
                  className="w-full text-sm font-mono uppercase rounded-xl border border-gray-200 focus:border-[#2d8a66] focus:ring-1 focus:ring-[#2d8a66] bg-[#fbfdfa] text-gray-900 py-2.5 px-3 outline-none"
                  placeholder="MCI-948102-DL"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Clinical Specialization</label>
                <select
                  value={doctorSpecialty}
                  onChange={(e) => setDoctorSpecialty(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-200 focus:border-[#2d8a66] focus:ring-1 focus:ring-[#2d8a66] bg-[#fbfdfa] text-gray-900 py-2.5 px-3 outline-none"
                >
                  <option value="cardiology">Cardiology & Vascular</option>
                  <option value="general">General Medicine / Internal</option>
                  <option value="emergency">Emergency Medicine & Trauma</option>
                  <option value="pediatrics">Pediatrics & Neonatal</option>
                  <option value="orthopedics">Orthopedic Surgery</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-gray-700">Clinical Station Password</label>
                  <button
                    type="button"
                    onClick={() => setShowDoctorPwd(!showDoctorPwd)}
                    className="text-[11px] text-[#2d8a66] font-semibold hover:underline"
                  >
                    {showDoctorPwd ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showDoctorPwd ? 'text' : 'password'}
                  required
                  value={doctorPassword}
                  onChange={(e) => setDoctorPassword(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-200 focus:border-[#2d8a66] focus:ring-1 focus:ring-[#2d8a66] bg-[#fbfdfa] text-gray-900 py-2.5 px-3 outline-none"
                  placeholder="••••••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#2d8a66] hover:bg-[#246e52] active:scale-[0.98] text-white font-medium text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Clinical Dashboard</span>
                <span>→</span>
              </button>
            </form>
          </section>
        )}

        {/* STEP 2: Patient Login Form */}
        {step === 'patient-form' && (
          <section className="w-full bg-white border border-[#dce8dc] rounded-2xl p-5 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#2d8a66] font-semibold">Patient Portal</span>
                <h2 className="text-base font-bold text-gray-900 leading-tight">Patient Login & Setup</h2>
              </div>
              <button
                onClick={() => setStep('role')}
                className="text-xs text-[#62766e] hover:text-[#2d8a66] flex items-center gap-1 font-medium py-1 px-2.5 rounded-lg bg-gray-50 border border-gray-200 active:bg-gray-100 transition-colors cursor-pointer"
                type="button"
              >
                ← Back
              </button>
            </div>

            <form onSubmit={handlePatientSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-200 focus:border-[#2d8a66] focus:ring-1 focus:ring-[#2d8a66] bg-[#fbfdfa] text-gray-900 py-2.5 px-3 outline-none"
                  placeholder="Ananya Sharma"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mobile / ABHA ID / MRN</label>
                  <input
                    type="text"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-200 focus:border-[#2d8a66] focus:ring-1 focus:ring-[#2d8a66] bg-[#fbfdfa] text-gray-900 py-2.5 px-3 outline-none"
                    placeholder="+91 98192 83104"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-200 focus:border-[#2d8a66] focus:ring-1 focus:ring-[#2d8a66] bg-[#fbfdfa] text-gray-900 py-2.5 px-3 text-center outline-none"
                    placeholder="29"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Blood Group</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {bloodGroups.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setPatientBloodGroup(bg)}
                      className={`py-1 text-xs font-mono font-medium rounded-lg border transition-all active:scale-95 cursor-pointer ${
                        patientBloodGroup === bg
                          ? 'border-[#2d8a66] bg-[#e8f3ee] text-[#246e52] font-bold shadow-xs'
                          : 'border-[#dce8dc] bg-white text-gray-700 hover:bg-[#f6faf5]'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-gray-700">Health Passkey / PIN</label>
                  <button
                    type="button"
                    onClick={() => setShowPatientPwd(!showPatientPwd)}
                    className="text-[11px] text-[#2d8a66] font-semibold hover:underline"
                  >
                    {showPatientPwd ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPatientPwd ? 'text' : 'password'}
                  required
                  value={patientPassword}
                  onChange={(e) => setPatientPassword(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-200 focus:border-[#2d8a66] focus:ring-1 focus:ring-[#2d8a66] bg-[#fbfdfa] text-gray-900 py-2.5 px-3 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#2d8a66] hover:bg-[#246e52] active:scale-[0.98] text-white font-medium text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Health Portal</span>
                <span>→</span>
              </button>
            </form>
          </section>
        )}

        {/* STEP 3: Verification / Simulation */}
        {step === 'authenticating' && (
          <div className="w-full bg-white border border-[#dce8dc] rounded-2xl p-6 shadow-md text-center transition-all animate-in fade-in duration-200">
            {!authProgress ? (
              <>
                <div className="w-12 h-12 mx-auto mb-3.5 text-[#2d8a66] flex items-center justify-center">
                  <svg className="animate-spin w-9 h-9" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  {pendingRole === 'doctor' ? 'Authenticating Clinical Credentials...' : 'Verifying Patient Records & Biometrics...'}
                </h3>
                <p className="text-xs text-[#62766e] leading-relaxed font-mono">
                  Establishing end-to-end encrypted HL7 FHIR connection...
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-[#e8f3ee] text-[#2d8a66] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px] font-bold">check_circle</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900">Authorized • Session Initialized</h3>
                <p className="text-[12px] font-mono text-[#62766e]">
                  Redirecting to <span className="text-[#2d8a66] font-bold">{pendingRole === 'doctor' ? 'Clinical Station' : 'Health Portal'}</span>...
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[400px] mx-auto px-5 pb-6 pt-2 flex flex-col gap-2.5 text-center">
        <div className="w-full bg-white/80 backdrop-blur-sm border border-[#dce8dc] rounded-xl py-2.5 px-4 text-xs text-[#20362e] flex items-center justify-center gap-2 shadow-xs">
          <span className="material-symbols-outlined text-[#2d8a66] text-[18px]">verified_user</span>
          <span className="font-medium text-[11px]">ABDM (Ayushman Bharat) & ABHA Compliant Login</span>
        </div>
        <div className="text-[11px] text-[#62766e] font-mono tracking-tight flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2d8a66] inline-block animate-pulse"></span>
          <span>MediNexus AI Clinical OS • v4.8.2-SEC</span>
        </div>
      </footer>
    </div>
  );
};
