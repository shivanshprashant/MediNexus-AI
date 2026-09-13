import React, { useState } from 'react';
import { AppScreen } from '../../types';

interface PatientRegistrationWizardProps {
  onCompletePatientRegistration: (userName: string) => void;
  onNavigateScreen: (screen: AppScreen) => void;
}

export const PatientRegistrationWizard: React.FC<PatientRegistrationWizardProps> = ({
  onCompletePatientRegistration,
  onNavigateScreen,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form States
  const [fullName, setFullName] = useState('Ananya Sharma');
  const [email, setEmail] = useState('ananya.sharma@example.com');
  const [phone, setPhone] = useState('+91 98192 83104');
  const [password, setPassword] = useState('••••••••');
  const [confirmPassword, setConfirmPassword] = useState('••••••••');
  const [dob, setDob] = useState('1997-06-15');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>('Female');

  // Medical Profile
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [heightCm, setHeightCm] = useState('165');
  const [weightKg, setWeightKg] = useState('58');
  const [allergies, setAllergies] = useState('Penicillin, Sulfa drugs');
  const [medicalConditions, setMedicalConditions] = useState('Mild Asthma');
  const [currentMedications, setCurrentMedications] = useState('Albuterol inhaler PRN');
  const [previousSurgeries, setPreviousSurgeries] = useState('None');
  const [emergencyContactName, setEmergencyContactName] = useState('Rohan Sharma (Spouse)');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('+91 98192 99999');

  // Address
  const [address, setAddress] = useState('Flat 402, Sunshine Apartments, Vasant Kunj');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('Delhi NCR');
  const [pincode, setPincode] = useState('110070');

  const bloodGroups = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

  const steps = [
    { num: 1, label: 'Basic Account', icon: 'person' },
    { num: 2, label: 'Medical Profile', icon: 'medical_information' },
    { num: 3, label: 'Address', icon: 'home' },
    { num: 4, label: 'Review & Create', icon: 'verified' },
  ];

  const handleFinalSubmit = () => {
    onCompletePatientRegistration(fullName);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface font-body antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Header (Matching DoctorHeader Layout Orientation) */}
      <header className="fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 pt-safe transition-shadow duration-200">
        <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigateScreen('landing')}>
            <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps uppercase tracking-wider text-primary font-bold text-[11px]">
                ABDM & ABHA INTEGRATED
              </span>
              <span className="font-headline-md text-[15px] leading-tight font-semibold text-on-surface">
                Patient Registration
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateScreen('login')}
            className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold font-mono transition-all cursor-pointer border border-outline-variant/40 text-[11px]"
          >
            Sign In →
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-lg mx-auto px-4 pt-20 pb-24 space-y-6 flex-1">

        {/* Stepper */}
        <div className="bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            {steps.map((s) => {
              const isActive = currentStep === s.num;
              const isCompleted = currentStep > s.num;

              return (
                <button
                  key={s.num}
                  onClick={() => setCurrentStep(s.num)}
                  className={`flex flex-col items-center gap-1 flex-1 transition-all cursor-pointer ${
                    isActive ? 'scale-105' : ''
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs transition-all border ${
                      isCompleted
                        ? 'bg-[#1b3b32] text-white border-[#1b3b32]'
                        : isActive
                        ? 'bg-[#2b8a66] text-white border-[#2b8a66] shadow-xs ring-4 ring-[#2b8a66]/20'
                        : 'bg-[#fafdfb] text-gray-500 border-gray-300'
                    }`}
                  >
                    {isCompleted ? '✓' : s.num}
                  </div>
                  <span
                    className={`text-[10px] font-mono font-semibold tracking-tight text-center ${
                      isActive ? 'text-[#1b3b32] font-bold' : 'text-gray-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-[#d2e2d8] rounded-2xl p-6 md:p-8 shadow-2xs space-y-6">
          {/* STEP 1: Basic Account */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-900 tracking-tight font-headline-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1b3b32]">person</span>
                  <span>Step 1: Basic Account Credentials</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none font-medium"
                    placeholder="Ananya Sharma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none"
                    placeholder="ananya.sharma@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs font-mono rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none"
                    placeholder="+91 98192 83104"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full text-xs font-mono rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-gray-300 py-2.5 px-3.5 bg-white outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Medical Profile */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-900 tracking-tight font-headline-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1b3b32]">
                    medical_information
                  </span>
                  <span>Step 2: Clinical Profile & Emergency Vitals</span>
                </h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Blood Group
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {bloodGroups.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setBloodGroup(bg)}
                      className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                        bloodGroup === bg
                          ? 'border-[#2b8a66] bg-[#e1eee7] text-[#1b3b32]'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-[#fafdfb]'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full text-xs font-mono rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none text-center"
                    placeholder="165"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full text-xs font-mono rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none text-center"
                    placeholder="58"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Known Allergies
                  </label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none"
                    placeholder="Penicillin, Peanuts, Latex..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Existing Medical Conditions
                  </label>
                  <input
                    type="text"
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none"
                    placeholder="Hypertension, Asthma, Diabetes..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Current Medications
                  </label>
                  <input
                    type="text"
                    value={currentMedications}
                    onChange={(e) => setCurrentMedications(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none"
                    placeholder="Albuterol inhaler PRN..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Previous Major Surgeries
                  </label>
                  <input
                    type="text"
                    value={previousSurgeries}
                    onChange={(e) => setPreviousSurgeries(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none"
                    placeholder="Appendectomy 2018..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#fafdfb] border border-[#dce8e1]">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Emergency Contact Person Name *
                  </label>
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 py-2 px-3 outline-none"
                    placeholder="Rohan Sharma (Spouse)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Emergency Contact Number *
                  </label>
                  <input
                    type="text"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className="w-full text-xs font-mono font-bold rounded-xl border border-gray-300 py-2 px-3 outline-none"
                    placeholder="+91 98192 99999"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Address */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-900 tracking-tight font-headline-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1b3b32]">home</span>
                  <span>Step 3: Residential Address & Location</span>
                </h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none"
                  placeholder="Flat 402, Sunshine Apartments, Vasant Kunj"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none"
                    placeholder="New Delhi"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none"
                    placeholder="Delhi NCR"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full text-xs font-mono rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none"
                    placeholder="110070"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Create */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-900 tracking-tight font-headline-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1b3b32]">verified</span>
                  <span>Step 4: Review Information & Initialize Account</span>
                </h2>
              </div>

              <div className="bg-[#fafdfb] border border-gray-200 rounded-xl p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-gray-500 block">Name</span>
                    <strong className="text-gray-900">{fullName}</strong> ({gender})
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-gray-500 block">Contact</span>
                    <span className="font-mono">{phone}</span> | {email}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-gray-500 block">Blood Group</span>
                    <strong className="text-[#1b3b32] font-mono">{bloodGroup}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-gray-500 block">Height / Weight</span>
                    <span className="font-mono">{heightCm} cm / {weightKg} kg</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-gray-500 block">Allergies</span>
                    <span>{allergies || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-gray-500 block">Conditions</span>
                    <span>{medicalConditions || 'None'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-gray-500 block">Emergency Contact</span>
                  <strong>{emergencyContactName}</strong> ({emergencyContactPhone})
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-gray-500 block">Address</span>
                  <span>{address}, {city}, {state} - {pincode}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-800 text-xs font-bold font-mono transition-colors cursor-pointer border border-gray-300"
            >
              ← Previous Step
            </button>

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
                className="px-5 py-2.5 rounded-xl bg-[#1b3b32] hover:bg-[#122822] text-white text-xs font-bold tracking-wide transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>Next Step</span>
                <span>→</span>
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                className="px-6 py-3 rounded-xl bg-[#2b8a66] hover:bg-[#20694e] text-white text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Create Account & Open Health Portal</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
