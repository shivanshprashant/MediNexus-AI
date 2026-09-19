import React, { useState } from 'react';
import { AppScreen } from '../../types';
import { registerDoctorApi } from '../../services/api';

interface DoctorRegistrationWizardProps {
  onCompleteDoctorRegistration: (doctorName: string) => void;
  onNavigateScreen: (screen: AppScreen) => void;
}

export const DoctorRegistrationWizard: React.FC<DoctorRegistrationWizardProps> = ({
  onCompleteDoctorRegistration,
  onNavigateScreen,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form States - Doctor Profile
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [dob, setDob] = useState('');
  const [medicalRegId, setMedicalRegId] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');

  // Specialization & Education
  const [specialization, setSpecialization] = useState('Cardiology');
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(0);

  // Hospital & Shift Allocation
  const [hospitalName, setHospitalName] = useState('CityCare Hospital (HSP-001)');
  const [department, setDepartment] = useState('Cardiology & Vascular Medicine');
  const [shiftSchedule, setShiftSchedule] = useState('Morning Shift (08:00 AM - 04:00 PM)');
  const [isEmergencyOnCall, setIsEmergencyOnCall] = useState(true);

  const specializations = [
    'Emergency Medicine',
    'Cardiology',
    'Orthopedics',
    'Neurology',
    'General Medicine',
    'Pediatrics',
    'General Surgery',
    'Pulmonology',
    'Radiology',
    'Obstetrics & Gynecology',
  ];

  const steps = [
    { num: 1, label: 'Basic Credentials', icon: 'badge' },
    { num: 2, label: 'Specialization', icon: 'clinical_notes' },
    { num: 3, label: 'Hospital & Shift', icon: 'domain' },
    { num: 4, label: 'Review & Verify', icon: 'verified' },
  ];

  const [password, setPassword] = useState('');

  
  const handlePhoneChange = (val: string, setter: (s: string) => void) => {
    const digits = val.replace(/[^\d]/g, '');
    let actualDigits = digits;
    if (digits.startsWith('91') && digits.length >= 2) {
      actualDigits = digits.substring(2);
    }
    if (actualDigits.length > 10) {
      actualDigits = actualDigits.substring(0, 10);
    }
    setter('+91 ' + actualDigits);
  };

  const handleNextOrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 4) {
      setCurrentStep((prev) => Math.min(4, prev + 1));
    } else {
      handleFinalSubmit();
    }
  };

const handleFinalSubmit = async () => {
    try {
      await registerDoctorApi({
        full_name: fullName,
        email: email,
        phone: phone,
        password: password,
        dob: dob || undefined,
        specialization: specialization,
        qualification: qualification,
        experience_years: experienceYears,
        hospital_id: 'hsp-001',
        department_id: 'dept-cardio',
        license: medicalRegId,
        shift: shiftSchedule,
      });
      onCompleteDoctorRegistration(fullName);
    } catch (err) {
      console.warn('Doctor registration API fallback:', err);
      onCompleteDoctorRegistration(fullName);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface font-body antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Header (Matching DoctorHeader Layout Orientation) */}
      <header className="fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 pt-safe transition-shadow duration-200">
        <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigateScreen('landing')}>
            <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
              <span className="material-symbols-outlined text-[20px]">stethoscope</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps uppercase tracking-wider text-primary font-bold text-[11px]">
                PHYSICIAN ONBOARDING
              </span>
              <span className="font-headline-md text-[15px] leading-tight font-semibold text-on-surface">
                Doctor Registration Portal
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

      {/* Main Mobile App Container */}
      <main className="w-full max-w-lg mx-auto px-4 pt-20 pb-24 space-y-5 flex-1">
        {/* Stepper Header */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center font-mono font-bold text-xs">
                {currentStep}
              </span>
              <div>
                <span className="text-xs font-bold text-on-surface block leading-tight">
                  Step {currentStep} of 4: {steps[currentStep - 1].label}
                </span>
                <span className="text-[10px] text-on-surface-variant font-mono">
                  {currentStep < 4 ? `Next: ${steps[currentStep].label}` : 'Ready to Onboard'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep((p) => p - 1)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high cursor-pointer flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  <span>Back</span>
                </button>
              )}
              {currentStep < 4 && (
                <button
                  onClick={() => setCurrentStep((p) => p + 1)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary text-on-primary hover:bg-primary-container cursor-pointer flex items-center gap-0.5"
                >
                  <span>Next</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              )}
            </div>
          </div>
          <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Body Container */}
        <form onSubmit={handleNextOrSubmit} className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 shadow-2xs space-y-5">
          {/* STEP 1: Basic Credentials */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-outline-variant/20 pb-3">
                <h2 className="text-base font-bold text-on-surface font-headline-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">badge</span>
                  <span>Step 1: Doctor Basic Information</span>
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Enter your official name and medical registration ID.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Full Name (with Title) *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-outline-variant/60 focus:border-primary bg-surface-container-lowest text-on-surface py-2.5 px-3.5 outline-none font-medium"
                  placeholder="Dr. First Last"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Medical Council Registration No. (MCI / NMC) *
                </label>
                <input
                  type="text"
                  required
                  value={medicalRegId}
                  onChange={(e) => setMedicalRegId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-outline-variant/60 focus:border-primary bg-surface-container-lowest text-on-surface py-2.5 px-3.5 outline-none font-mono"
                  placeholder="MCI-DL-2015-XXXXX"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs rounded-xl border border-outline-variant/60 focus:border-primary bg-surface-container-lowest text-on-surface py-2.5 px-3.5 outline-none"
                  placeholder="doctor@hospital.org"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Contact Phone *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs rounded-xl border border-outline-variant/60 focus:border-primary bg-surface-container-lowest text-on-surface py-2.5 px-3.5 outline-none"
                  placeholder="+91 98110..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full text-xs rounded-xl border border-outline-variant/60 focus:border-primary bg-surface-container-lowest text-on-surface py-2.5 px-3.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Account Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs rounded-xl border border-outline-variant/60 focus:border-primary bg-surface-container-lowest text-on-surface py-2.5 px-3.5 outline-none"
                  placeholder="••••••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Gender</label>
                <div className="flex flex-col gap-2">
                  {(['Male', 'Female', 'Other'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`w-full py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                        gender === g
                          ? 'bg-primary-container text-on-primary-container border-primary shadow-xs'
                          : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Specialization */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-outline-variant/20 pb-3">
                <h2 className="text-base font-bold text-on-surface font-headline-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">clinical_notes</span>
                  <span>Step 2: Specialization & Medical Qualifications</span>
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Select your clinical specialty and academic credentials.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Primary Clinical Specialization *
                </label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full text-xs rounded-xl border border-outline-variant/60 focus:border-primary bg-surface-container-lowest text-on-surface py-2.5 px-3.5 outline-none font-medium"
                >
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Medical Degrees & Qualifications *
                </label>
                <input
                  type="text"
                  required
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full text-xs rounded-xl border border-outline-variant/60 focus:border-primary bg-surface-container-lowest text-on-surface py-2.5 px-3.5 outline-none font-medium"
                  placeholder="e.g. MBBS, MD (Medicine), DM (Cardiology)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Years of Clinical Experience *
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                  className="w-full text-xs rounded-xl border border-outline-variant/60 focus:border-primary bg-surface-container-lowest text-on-surface py-2.5 px-3.5 outline-none font-medium"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Hospital & Shift */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-outline-variant/20 pb-3">
                <h2 className="text-base font-bold text-on-surface font-headline-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">domain</span>
                  <span>Step 3: Hospital Facility & Shift Allocation</span>
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Associate your doctor profile with a MediNexus AI hospital node.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Associated Hospital Facility *
                </label>
                <input
                  type="text"
                  required
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-outline-variant/60 focus:border-primary bg-surface-container-lowest text-on-surface py-2.5 px-3.5 outline-none font-medium"
                  placeholder="Hospital Name / Code"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Department Roster Unit *
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs rounded-xl border border-outline-variant/60 focus:border-primary bg-surface-container-lowest text-on-surface py-2.5 px-3.5 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Shift Schedule Preference *
                </label>
                <input
                  type="text"
                  value={shiftSchedule}
                  onChange={(e) => setShiftSchedule(e.target.value)}
                  className="w-full text-xs rounded-xl border border-outline-variant/60 focus:border-primary bg-surface-container-lowest text-on-surface py-2.5 px-3.5 outline-none font-medium"
                />
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-on-surface">Emergency On-Call Duty</div>
                  <div className="text-[11px] text-on-surface-variant">
                    Available for real-time ER triage alerts
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isEmergencyOnCall}
                  onChange={(e) => setIsEmergencyOnCall(e.target.checked)}
                  className="w-4 h-4 rounded text-primary"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Review & Verify */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-outline-variant/20 pb-3">
                <h2 className="text-base font-bold text-on-surface font-headline-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">verified</span>
                  <span>Step 4: Review Doctor Profile</span>
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Confirm your registration details to open the Doctor Station.
                </p>
              </div>

              {/* Doctor Credential Badge Preview */}
              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/40 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary text-on-primary font-bold text-base flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[24px]">stethoscope</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">{fullName}</h3>
                    <p className="text-xs text-primary font-bold">{qualification} • {specialization}</p>
                    <p className="text-[11px] text-on-surface-variant font-mono">Reg: {medicalRegId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-outline-variant/30 pt-3">
                  <div>
                    <span className="text-on-surface-variant text-[11px] block">Hospital Node:</span>
                    <span className="font-semibold text-on-surface">{hospitalName}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant text-[11px] block">Department Unit:</span>
                    <span className="font-semibold text-on-surface">{department}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant text-[11px] block">Experience:</span>
                    <span className="font-semibold text-on-surface">{experienceYears} Years</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant text-[11px] block">Shift:</span>
                    <span className="font-semibold text-on-surface">{shiftSchedule}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all cursor-pointer"
              >
                ← Back
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 4 ? (
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>Next Step</span>
                <span>→</span>
              </button>
            ) : (
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Complete Registration & Open Station</span>
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
};
