import React, { useState } from 'react';
import {
  DetailedHospital,
  DepartmentItem,
  DepartmentBedType,
  DepartmentDoctor,
} from '../../types';
import { INITIAL_DETAILED_HOSPITAL, calculateHospitalSummary } from '../../services/hospitalAdminService';

interface HospitalOnboardingWizardProps {
  onCompleteOnboarding: (hospital: DetailedHospital) => void;
}

export const HospitalOnboardingWizard: React.FC<HospitalOnboardingWizardProps> = ({
  onCompleteOnboarding,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State initialized with realistic default template
  const [hospitalData, setHospitalData] = useState<DetailedHospital>({
    ...INITIAL_DETAILED_HOSPITAL,
    isOnboarded: false,
  });

  // Local state for adding new department
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptPhone, setNewDeptPhone] = useState('');
  const [newDeptFloor, setNewDeptFloor] = useState('');
  const [newDeptIs24x7, setNewDeptIs24x7] = useState(true);

  // Local state for adding bed type to selected department
  const [selectedDeptIdForBed, setSelectedDeptIdForBed] = useState<string>(
    hospitalData.departments[0]?.id || ''
  );
  const [newBedType, setNewBedType] = useState('General Ward Beds');
  const [newBedTotal, setNewBedTotal] = useState(20);
  const [newBedOccupied, setNewBedOccupied] = useState(12);
  const [newBedWard, setNewBedWard] = useState('Ward 1A');

  // Local state for adding doctor to selected department
  const [selectedDeptIdForDoc, setSelectedDeptIdForDoc] = useState<string>(
    hospitalData.departments[0]?.id || ''
  );
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpec, setNewDocSpec] = useState('');
  const [newDocQual, setNewDocQual] = useState('MD');
  const [newDocExp, setNewDocExp] = useState(8);
  const [newDocPhone, setNewDocPhone] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocShift, setNewDocShift] = useState('Day Shift (09:00 - 17:00)');
  const [newDocStatus, setNewDocStatus] = useState<'ON DUTY' | 'OFF DUTY' | 'ON LEAVE'>('ON DUTY');

  // Local state for custom service adder
  const [customServiceText, setCustomServiceText] = useState('');

  const steps = [
    { num: 1, label: 'Hospital Details', icon: 'domain' },
    { num: 2, label: 'Location', icon: 'location_on' },
    { num: 3, label: 'Departments', icon: 'account_tree' },
    { num: 4, label: 'Department Beds', icon: 'single_bed' },
    { num: 5, label: 'Department Doctors', icon: 'stethoscope' },
    { num: 6, label: 'Services', icon: 'medical_services' },
    { num: 7, label: 'Emergency Setup', icon: 'emergency' },
    { num: 8, label: 'Review & Confirm', icon: 'verified' },
  ];

  // Helper Handlers
  const handleLoadPresetSample = () => {
    setHospitalData(INITIAL_DETAILED_HOSPITAL);
    setCurrentStep(8);
  };

  const handleAddDepartment = () => {
    if (!newDeptName) return;
    const newDept: DepartmentItem = {
      id: `dept-${Date.now()}`,
      code: newDeptCode || `DEPT-${hospitalData.departments.length + 1}`,
      name: newDeptName,
      description: `${newDeptName} clinical department.`,
      contactPhone: newDeptPhone || hospitalData.phone,
      locationFloor: newDeptFloor || '1st Floor',
      operatingHours: newDeptIs24x7 ? '24x7' : '08:00 AM - 20:00 PM',
      is24x7: newDeptIs24x7,
      hasEmergencySupport: true,
      status: 'ACTIVE',
      beds: [
        {
          id: `b-${Date.now()}`,
          bedType: 'General Ward Beds',
          total: 15,
          occupied: 0,
          available: 15,
          floorWard: newDeptFloor || 'Main Ward',
        },
      ],
      doctors: [],
      services: [`${newDeptName} Consultations`, `${newDeptName} Diagnostics`],
    };

    setHospitalData((prev) => ({
      ...prev,
      departments: [...prev.departments, newDept],
    }));

    setNewDeptName('');
    setNewDeptCode('');
    setNewDeptPhone('');
    setNewDeptFloor('');
  };

  const handleRemoveDepartment = (deptId: string) => {
    setHospitalData((prev) => ({
      ...prev,
      departments: prev.departments.filter((d) => d.id !== deptId),
    }));
  };

  const handleAddBedToDepartment = () => {
    if (!selectedDeptIdForBed) return;
    const total = Math.max(1, newBedTotal);
    const occupied = 0;
    const available = total;

    const newBed: DepartmentBedType = {
      id: `b-${Date.now()}`,
      bedType: newBedType,
      total,
      occupied,
      available,
      floorWard: newBedWard,
    };

    setHospitalData((prev) => ({
      ...prev,
      departments: prev.departments.map((dept) =>
        dept.id === selectedDeptIdForBed
          ? { ...dept, beds: [...dept.beds, newBed] }
          : dept
      ),
    }));
  };

  const handleRemoveBedFromDepartment = (deptId: string, bedId: string) => {
    setHospitalData((prev) => ({
      ...prev,
      departments: prev.departments.map((dept) =>
        dept.id === deptId
          ? { ...dept, beds: dept.beds.filter((b) => b.id !== bedId) }
          : dept
      ),
    }));
  };

  const handleAddDoctorToDepartment = () => {
    if (!selectedDeptIdForDoc || !newDocName) return;

    const newDoc: DepartmentDoctor = {
      id: `doc-${Date.now()}`,
      doctorCode: `DOC-${Math.floor(100 + Math.random() * 900)}`,
      name: newDocName.startsWith('Dr.') ? newDocName : `Dr. ${newDocName}`,
      specialization: newDocSpec || 'Specialist Physician',
      qualification: newDocQual,
      experienceYears: Number(newDocExp) || 5,
      contactPhone: newDocPhone || hospitalData.phone,
      email: newDocEmail || `${newDocName.toLowerCase().replace(/[^a-z]/g, '')}@citycare.org`,
      shift: newDocShift,
      availability: newDocStatus,
    };

    setHospitalData((prev) => ({
      ...prev,
      departments: prev.departments.map((dept) =>
        dept.id === selectedDeptIdForDoc
          ? { ...dept, doctors: [...dept.doctors, newDoc] }
          : dept
      ),
    }));

    setNewDocName('');
    setNewDocSpec('');
  };

  const handleRemoveDoctorFromDepartment = (deptId: string, docId: string) => {
    setHospitalData((prev) => ({
      ...prev,
      departments: prev.departments.map((dept) =>
        dept.id === deptId
          ? { ...dept, doctors: dept.doctors.filter((d) => d.id !== docId) }
          : dept
      ),
    }));
  };

  const handleAddGlobalService = () => {
    if (!customServiceText) return;
    if (!hospitalData.globalServices.includes(customServiceText)) {
      setHospitalData((prev) => ({
        ...prev,
        globalServices: [...prev.globalServices, customServiceText],
      }));
    }
    setCustomServiceText('');
  };

  const handleFinalSubmit = () => {
    const onboardedHospital: DetailedHospital = {
      ...hospitalData,
      isOnboarded: true,
    };
    onCompleteOnboarding(onboardedHospital);
  };

  const summary = calculateHospitalSummary(hospitalData);

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface font-body antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 pt-safe transition-shadow duration-200">
        <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
              <span className="material-symbols-outlined text-[20px]">domain_add</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps uppercase tracking-wider text-primary font-bold text-[11px]">
                HOSPITAL ONBOARDING
              </span>
              <span className="font-headline-md text-[15px] leading-tight font-semibold text-on-surface">
                Facility Registration Portal
              </span>
            </div>
          </div>

          <button
            onClick={handleLoadPresetSample}
            className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold font-mono transition-all cursor-pointer border border-outline-variant/40 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Load Preset Sample</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-lg mx-auto px-4 pt-20 pb-24 space-y-6 flex-1">

        {/* 8-Step Interactive Navigation Stepper */}
        <div className="block md:hidden bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#1b3b32] text-[#4edea3] flex items-center justify-center font-mono font-bold text-xs">
                {currentStep}
              </span>
              <div>
                <span className="text-xs font-bold text-gray-900 block leading-tight">
                  Step {currentStep} of 8: {steps[currentStep - 1].label}
                </span>
                <span className="text-[10px] text-[#526860] font-mono">
                  {currentStep < 8 ? `Next: ${steps[currentStep].label}` : 'Finalizing Onboarding'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep((p) => p - 1)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  <span>Back</span>
                </button>
              )}
              {currentStep < 8 && (
                <button
                  onClick={() => setCurrentStep((p) => p + 1)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#2b8a66] text-white hover:bg-[#20694e] cursor-pointer flex items-center gap-0.5"
                >
                  <span>Next</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              )}
            </div>
          </div>
          <div className="w-full h-2 bg-[#e8f0eb] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2b8a66] transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 8) * 100}%` }}
            />
          </div>
        </div>

        {/* Desktop Stepper Header (>= md) */}
        <div className="hidden md:block bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] gap-2">
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
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    ) : (
                      s.num
                    )}
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

        {/* STEP CONTENT CONTAINER */}
        <div className="bg-white border border-[#d2e2d8] rounded-2xl p-6 md:p-8 shadow-2xs space-y-6">
          {/* STEP 1: Hospital Details */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2 font-headline-md">
                  <span className="material-symbols-outlined text-[#1b3b32]">domain</span>
                  <span>Step 1: Hospital Basic Information</span>
                </h2>
                <p className="text-xs text-[#526860]">
                  Enter legal hospital identity and operational administrative details.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Hospital Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={hospitalData.name}
                    onChange={(e) => setHospitalData({ ...hospitalData, name: e.target.value })}
                    className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none font-medium"
                    placeholder="CityCare Hospital"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Hospital Registration Code / Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    value={hospitalData.hospitalCode}
                    onChange={(e) =>
                      setHospitalData({ ...hospitalData, hospitalCode: e.target.value.toUpperCase() })
                    }
                    className="w-full text-xs font-mono uppercase font-bold rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none"
                    placeholder="HSP-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Hospital Classification / Type
                  </label>
                  <select
                    value={hospitalData.type}
                    onChange={(e) => setHospitalData({ ...hospitalData, type: e.target.value })}
                    className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none"
                  >
                    <option value="Private Multi-Specialty Hospital">
                      Private Multi-Specialty Hospital
                    </option>
                    <option value="Government Hospital">Government Hospital</option>
                    <option value="Trust / Non-Profit Hospital">Trust / Non-Profit Hospital</option>
                    <option value="Teaching & Research Hospital">Teaching & Research Hospital</option>
                    <option value="Super-Specialty Hospital">Super-Specialty Hospital</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Primary Phone Number
                  </label>
                  <input
                    type="text"
                    value={hospitalData.phone}
                    onChange={(e) => setHospitalData({ ...hospitalData, phone: e.target.value })}
                    className="w-full text-xs font-mono rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none"
                    placeholder="+91 11 4910 2000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Emergency Helpline Number
                  </label>
                  <input
                    type="text"
                    value={hospitalData.emergencyPhone}
                    onChange={(e) =>
                      setHospitalData({ ...hospitalData, emergencyPhone: e.target.value })
                    }
                    className="w-full text-xs font-mono font-bold rounded-xl border border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-[#fffdfd] text-red-900 py-2.5 px-3.5 outline-none"
                    placeholder="+91 11 4910 9999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Official Admin Email
                  </label>
                  <input
                    type="email"
                    value={hospitalData.email}
                    onChange={(e) => setHospitalData({ ...hospitalData, email: e.target.value })}
                    className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none"
                    placeholder="admin@citycare.org"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Established Year
                  </label>
                  <input
                    type="number"
                    value={hospitalData.establishedYear}
                    onChange={(e) =>
                      setHospitalData({
                        ...hospitalData,
                        establishedYear: Number(e.target.value),
                      })
                    }
                    className="w-full text-xs font-mono rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none"
                    placeholder="2012"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Total Staff & Employees
                  </label>
                  <input
                    type="number"
                    value={hospitalData.employeeCount}
                    onChange={(e) =>
                      setHospitalData({
                        ...hospitalData,
                        employeeCount: Number(e.target.value),
                      })
                    }
                    className="w-full text-xs font-mono rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none"
                    placeholder="450"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Hospital Overview & Clinical Description
                </label>
                <textarea
                  rows={3}
                  value={hospitalData.description}
                  onChange={(e) =>
                    setHospitalData({ ...hospitalData, description: e.target.value })
                  }
                  className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none leading-relaxed"
                  placeholder="Provide a brief clinical overview of your hospital..."
                />
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2 font-headline-md">
                  <span className="material-symbols-outlined text-[#1b3b32]">location_on</span>
                  <span>Step 2: Hospital Geographical Location</span>
                </h2>
                <p className="text-xs text-[#526860]">
                  Location details used by MediNexus AI to compute patient distance and ambulance routing.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={hospitalData.location.address}
                    onChange={(e) =>
                      setHospitalData({
                        ...hospitalData,
                        location: { ...hospitalData.location, address: e.target.value },
                      })
                    }
                    className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none"
                    placeholder="Plot 14, Institutional Area, Sector 44"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={hospitalData.location.city}
                    onChange={(e) =>
                      setHospitalData({
                        ...hospitalData,
                        location: { ...hospitalData.location, city: e.target.value },
                      })
                    }
                    className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none"
                    placeholder="New Delhi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    State / Region
                  </label>
                  <input
                    type="text"
                    value={hospitalData.location.state}
                    onChange={(e) =>
                      setHospitalData({
                        ...hospitalData,
                        location: { ...hospitalData.location, state: e.target.value },
                      })
                    }
                    className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none"
                    placeholder="Delhi NCR"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={hospitalData.location.pincode}
                    onChange={(e) =>
                      setHospitalData({
                        ...hospitalData,
                        location: { ...hospitalData.location, pincode: e.target.value },
                      })
                    }
                    className="w-full text-xs font-mono rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none"
                    placeholder="110017"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    GPS Lat / Long (Approx)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={hospitalData.location.latitude}
                      onChange={(e) =>
                        setHospitalData({
                          ...hospitalData,
                          location: { ...hospitalData.location, latitude: e.target.value },
                        })
                      }
                      className="w-1/2 text-xs font-mono rounded-xl border border-gray-300 py-2.5 px-2 text-center"
                      placeholder="28.5355"
                    />
                    <input
                      type="text"
                      value={hospitalData.location.longitude}
                      onChange={(e) =>
                        setHospitalData({
                          ...hospitalData,
                          location: { ...hospitalData.location, longitude: e.target.value },
                        })
                      }
                      className="w-1/2 text-xs font-mono rounded-xl border border-gray-300 py-2.5 px-2 text-center"
                      placeholder="77.2610"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Emergency Entrance Location (Ambulance Bay)
                  </label>
                  <input
                    type="text"
                    value={hospitalData.location.emergencyEntranceLocation}
                    onChange={(e) =>
                      setHospitalData({
                        ...hospitalData,
                        location: {
                          ...hospitalData.location,
                          emergencyEntranceLocation: e.target.value,
                        },
                      })
                    }
                    className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none"
                    placeholder="Gate #3 (South Wing - Red Canopy)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Main Entrance Location (OPD / Visitor Atrium)
                  </label>
                  <input
                    type="text"
                    value={hospitalData.location.mainEntranceLocation}
                    onChange={(e) =>
                      setHospitalData({
                        ...hospitalData,
                        location: {
                          ...hospitalData.location,
                          mainEntranceLocation: e.target.value,
                        },
                      })
                    }
                    className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3.5 outline-none"
                    placeholder="Gate #1 (North Main Atrium)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Departments */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2 font-headline-md">
                  <span className="material-symbols-outlined text-[#1b3b32]">account_tree</span>
                  <span>Step 3: Clinical Departments Management</span>
                </h2>
                <p className="text-xs text-[#526860]">
                  Add all specialized departments operating within your hospital.
                </p>
              </div>

              {/* Add New Department Form */}
              <div className="p-4 rounded-xl bg-[#fafdfb] border border-[#dce8e1] space-y-3">
                <span className="text-xs font-bold text-[#1b3b32] font-mono block">
                  + Add New Department
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="Department Name (e.g. Gynecology)"
                    className="text-xs rounded-xl border border-gray-300 py-2 px-3 outline-none sm:col-span-2"
                  />
                  <input
                    type="text"
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value)}
                    placeholder="Dept Code (e.g. GYN-07)"
                    className="text-xs font-mono uppercase rounded-xl border border-gray-300 py-2 px-3 outline-none"
                  />
                  <input
                    type="text"
                    value={newDeptFloor}
                    onChange={(e) => setNewDeptFloor(e.target.value)}
                    placeholder="Floor / Location"
                    className="text-xs rounded-xl border border-gray-300 py-2 px-3 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs font-mono text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newDeptIs24x7}
                      onChange={(e) => setNewDeptIs24x7(e.target.checked)}
                      className="rounded text-[#1b3b32]"
                    />
                    <span>Operates 24x7</span>
                  </label>

                  <button
                    onClick={handleAddDepartment}
                    className="px-4 py-1.5 rounded-xl bg-[#1b3b32] hover:bg-[#122822] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    + Add Department
                  </button>
                </div>
              </div>

              {/* Departments List */}
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold text-gray-700 block">
                  Configured Departments ({hospitalData.departments.length})
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {hospitalData.departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="p-4 rounded-xl bg-white border border-[#d2e2d8] shadow-2xs flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">{dept.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#e1eee7] text-[#1b3b32] font-semibold border border-[#b8dbc0]">
                            {dept.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#526860] mt-1">{dept.description}</p>
                        <div className="text-[10px] font-mono text-gray-400 mt-1">
                          Location: {dept.locationFloor} • Hours: {dept.operatingHours}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveDepartment(dept.id)}
                        className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Remove Department"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Department Beds */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2 font-headline-md">
                  <span className="material-symbols-outlined text-[#1b3b32]">single_bed</span>
                  <span>Step 4: Beds Allocated for Every Department</span>
                </h2>
                <p className="text-xs text-[#526860]">
                  Associate specific bed types and capacity directly with each department unit.
                </p>
              </div>

              {/* Add Bed to Selected Department Form */}
              <div className="p-4 rounded-xl bg-[#fafdfb] border border-[#dce8e1] space-y-3">
                <span className="text-xs font-bold text-[#1b3b32] font-mono block">
                  + Add Bed Unit to Department
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-[#526860] font-semibold mb-0.5">
                      Select Department
                    </label>
                    <select
                      value={selectedDeptIdForBed}
                      onChange={(e) => setSelectedDeptIdForBed(e.target.value)}
                      className="w-full text-xs font-semibold rounded-xl border border-gray-300 py-2 px-3 bg-white outline-none"
                    >
                      {hospitalData.departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#526860] font-semibold mb-0.5">
                      Bed Type
                    </label>
                    <select
                      value={newBedType}
                      onChange={(e) => setNewBedType(e.target.value)}
                      className="w-full text-xs rounded-xl border border-gray-300 py-2 px-3 bg-white outline-none"
                    >
                      <option value="General Ward Beds">General Ward Beds</option>
                      <option value="Emergency Triage Beds">Emergency Triage Beds</option>
                      <option value="Trauma Resuscitation Beds">Trauma Resuscitation Beds</option>
                      <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU)</option>
                      <option value="Cardiac Care Unit (CCU)">Cardiac Care Unit (CCU)</option>
                      <option value="High Dependency Unit (HDU)">High Dependency Unit (HDU)</option>
                      <option value="Private Deluxe Suite">Private Deluxe Suite</option>
                      <option value="Pediatric Ward Beds">Pediatric Ward Beds</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#526860] font-semibold mb-0.5">
                      Ward / Location
                    </label>
                    <input
                      type="text"
                      value={newBedWard}
                      onChange={(e) => setNewBedWard(e.target.value)}
                      placeholder="Ward 1A"
                      className="w-full text-xs rounded-xl border border-gray-300 py-2 px-3 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#526860] font-semibold mb-1">
                      Total Beds Capacity *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newBedTotal}
                      onChange={(e) => setNewBedTotal(Number(e.target.value))}
                      placeholder="e.g. 25"
                      className="w-full text-xs font-mono font-bold rounded-xl border border-gray-300 py-2.5 px-3 bg-[#fafdfb] text-gray-900 outline-none"
                    />
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={handleAddBedToDepartment}
                      className="w-full py-2.5 rounded-xl bg-[#1b3b32] hover:bg-[#122822] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs min-h-[44px]"
                    >
                      + Add Bed Category to Department
                    </button>
                  </div>
                </div>
              </div>

              {/* Department-Wise Beds Listing */}
              <div className="space-y-4">
                {hospitalData.departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="p-4 rounded-xl bg-white border border-[#d2e2d8] shadow-2xs space-y-2"
                  >
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 font-mono">
                          {dept.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#e1eee7] text-[#1b3b32]">
                          {dept.code}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#1b3b32]">
                        {dept.beds.reduce((acc, b) => acc + b.total, 0)} Total Beds
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {dept.beds.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#fafdfb] border border-gray-100 text-xs font-mono"
                        >
                          <div>
                            <span className="font-bold text-gray-900">{b.bedType}</span>
                            <span className="text-[10px] text-[#526860] ml-2 font-normal">
                              ({b.floorWard})
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-0.5 rounded bg-[#e1eee7] text-[#1b3b32] font-bold">
                              {b.total} Total Beds
                            </span>
                            <button
                              onClick={() => handleRemoveBedFromDepartment(dept.id, b.id)}
                              className="text-gray-400 hover:text-red-600 cursor-pointer text-sm font-bold px-1"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Department Doctors */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2 font-headline-md">
                  <span className="material-symbols-outlined text-[#1b3b32]">stethoscope</span>
                  <span>Step 5: Doctors Assigned to Every Department</span>
                </h2>
                <p className="text-xs text-[#526860]">
                  Register doctors and assign them specifically to clinical department rosters.
                </p>
              </div>

              {/* Add Doctor to Department Form */}
              <div className="p-4 rounded-xl bg-[#fafdfb] border border-[#dce8e1] space-y-3">
                <span className="text-xs font-bold text-[#1b3b32] font-mono block">
                  + Add Physician to Department Roster
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#526860] font-semibold mb-0.5">
                      Target Department
                    </label>
                    <select
                      value={selectedDeptIdForDoc}
                      onChange={(e) => setSelectedDeptIdForDoc(e.target.value)}
                      className="w-full text-xs font-semibold rounded-xl border border-gray-300 py-2 px-3 bg-white outline-none"
                    >
                      {hospitalData.departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#526860] font-semibold mb-0.5">
                      Doctor Name *
                    </label>
                    <input
                      type="text"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      placeholder="Dr. Shiv Gupta"
                      className="w-full text-xs rounded-xl border border-gray-300 py-2 px-3 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#526860] font-semibold mb-0.5">
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={newDocSpec}
                      onChange={(e) => setNewDocSpec(e.target.value)}
                      placeholder="Interventional Cardiologist"
                      className="w-full text-xs rounded-xl border border-gray-300 py-2 px-3 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={newDocQual}
                    onChange={(e) => setNewDocQual(e.target.value)}
                    placeholder="Qualification (MD, DM)"
                    className="text-xs rounded-xl border border-gray-300 py-2 px-3 outline-none"
                  />
                  <input
                    type="number"
                    value={newDocExp}
                    onChange={(e) => setNewDocExp(Number(e.target.value))}
                    placeholder="Exp (Years)"
                    className="text-xs font-mono rounded-xl border border-gray-300 py-2 px-3 outline-none"
                  />
                  <input
                    type="text"
                    value={newDocShift}
                    onChange={(e) => setNewDocShift(e.target.value)}
                    placeholder="Shift Schedule"
                    className="text-xs rounded-xl border border-gray-300 py-2 px-3 outline-none"
                  />
                  <select
                    value={newDocStatus}
                    onChange={(e) =>
                      setNewDocStatus(e.target.value as 'ON DUTY' | 'OFF DUTY' | 'ON LEAVE')
                    }
                    className="text-xs font-mono font-bold rounded-xl border border-gray-300 py-2 px-3 bg-white outline-none"
                  >
                    <option value="ON DUTY">ON DUTY</option>
                    <option value="OFF DUTY">OFF DUTY</option>
                    <option value="ON LEAVE">ON LEAVE</option>
                  </select>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleAddDoctorToDepartment}
                    className="px-4 py-1.5 rounded-xl bg-[#1b3b32] hover:bg-[#122822] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    + Add Physician to Department
                  </button>
                </div>
              </div>

              {/* Department Doctors Roster */}
              <div className="space-y-4">
                {hospitalData.departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="p-4 rounded-xl bg-white border border-[#d2e2d8] shadow-2xs space-y-2"
                  >
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-xs font-bold text-gray-900 font-mono">
                        {dept.name} Physician Roster ({dept.doctors.length})
                      </span>
                      <span className="text-xs font-mono font-bold text-[#0ca678]">
                        {dept.doctors.filter((d) => d.availability === 'ON DUTY').length} On Duty
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {dept.doctors.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3 rounded-xl bg-[#fafdfb] border border-gray-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-gray-900">{doc.name}</div>
                            <div className="text-[11px] text-[#526860]">
                              {doc.specialization} • {doc.experienceYears}y Exp
                            </div>
                            <div className="text-[10px] font-mono text-gray-400">{doc.shift}</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                doc.availability === 'ON DUTY'
                                  ? 'bg-[#e6fcf5] text-[#0ca678] border-[#96f2d7]'
                                  : 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}
                            >
                              {doc.availability}
                            </span>
                            <button
                              onClick={() => handleRemoveDoctorFromDepartment(dept.id, doc.id)}
                              className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Services */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2 font-headline-md">
                  <span className="material-symbols-outlined text-[#1b3b32]">medical_services</span>
                  <span>Step 6: Available Medical Services & Facilities</span>
                </h2>
                <p className="text-xs text-[#526860]">
                  Configure specialized diagnostic, therapeutic, and emergency services available.
                </p>
              </div>

              {/* Service Adder */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customServiceText}
                  onChange={(e) => setCustomServiceText(e.target.value)}
                  placeholder="Enter additional service (e.g. Dialysis Unit)"
                  className="flex-1 text-xs rounded-xl border border-gray-300 py-2.5 px-3.5 outline-none"
                />
                <button
                  onClick={handleAddGlobalService}
                  className="px-4 py-2.5 rounded-xl bg-[#1b3b32] hover:bg-[#122822] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  + Add Service
                </button>
              </div>

              {/* Service Badges Grid */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-gray-700 block">
                  Configured Services ({hospitalData.globalServices.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {hospitalData.globalServices.map((svc) => (
                    <span
                      key={svc}
                      className="px-3.5 py-1.5 rounded-xl bg-[#e1eee7] text-[#1b3b32] border border-[#b8dbc0] text-xs font-semibold font-mono flex items-center gap-2"
                    >
                      <span>✓ {svc}</span>
                      <button
                        onClick={() =>
                          setHospitalData((prev) => ({
                            ...prev,
                            globalServices: prev.globalServices.filter((s) => s !== svc),
                          }))
                        }
                        className="text-gray-400 hover:text-red-700 font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Emergency Setup */}
          {currentStep === 7 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2 font-headline-md">
                  <span className="material-symbols-outlined text-[#c92a2a]">emergency</span>
                  <span>Step 7: Emergency Response Capabilities & Readiness</span>
                </h2>
                <p className="text-xs text-[#526860]">
                  Configure real-time trauma care availability and emergency response parameters.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#fff8f8] border border-[#f8c6c6] space-y-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hospitalData.emergencyConfig.is24x7Emergency}
                      onChange={(e) =>
                        setHospitalData({
                          ...hospitalData,
                          emergencyConfig: {
                            ...hospitalData.emergencyConfig,
                            is24x7Emergency: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-[#c92a2a]"
                    />
                    <span>24x7 Emergency & Trauma Bay Open</span>
                  </label>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-700 font-semibold mb-1">
                      Emergency Hotline Phone
                    </label>
                    <input
                      type="text"
                      value={hospitalData.emergencyConfig.emergencyContact}
                      onChange={(e) =>
                        setHospitalData({
                          ...hospitalData,
                          emergencyConfig: {
                            ...hospitalData.emergencyConfig,
                            emergencyContact: e.target.value,
                          },
                        })
                      }
                      className="w-full text-xs font-mono font-bold rounded-xl border border-red-300 py-2 px-3 outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#fafdfb] border border-[#dce8e1] space-y-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hospitalData.emergencyConfig.traumaCareAvailable}
                      onChange={(e) =>
                        setHospitalData({
                          ...hospitalData,
                          emergencyConfig: {
                            ...hospitalData.emergencyConfig,
                            traumaCareAvailable: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-[#1b3b32]"
                    />
                    <span>Level 1 Trauma Care Unit Active</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-gray-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hospitalData.emergencyConfig.ambulanceAvailable}
                      onChange={(e) =>
                        setHospitalData({
                          ...hospitalData,
                          emergencyConfig: {
                            ...hospitalData.emergencyConfig,
                            ambulanceAvailable: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-[#1b3b32]"
                    />
                    <span>ALS Ambulance Service On Standby</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Review & Confirm */}
          {currentStep === 8 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2 font-headline-md">
                  <span className="material-symbols-outlined text-[#1b3b32]">verified</span>
                  <span>Step 8: Review & Confirm Hospital Creation</span>
                </h2>
                <p className="text-xs text-[#526860]">
                  Verify complete hospital operational infrastructure before publishing to MediNexus network.
                </p>
              </div>

              {/* Final Summary Card Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-4 rounded-xl bg-[#fafdfb] border border-gray-200">
                  <span className="text-[10px] font-mono uppercase text-[#526860] font-semibold block">
                    Departments
                  </span>
                  <span className="text-2xl font-extrabold text-[#142620] font-mono">
                    {summary.totalDepartments}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#fafdfb] border border-gray-200">
                  <span className="text-[10px] font-mono uppercase text-[#526860] font-semibold block">
                    Total Beds
                  </span>
                  <span className="text-2xl font-extrabold text-[#142620] font-mono">
                    {summary.totalBeds} ({summary.availableBeds} Avail)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#fafdfb] border border-gray-200">
                  <span className="text-[10px] font-mono uppercase text-[#526860] font-semibold block">
                    Total Physicians
                  </span>
                  <span className="text-2xl font-extrabold text-[#142620] font-mono">
                    {summary.totalDoctors} ({summary.doctorsOnDuty} On Duty)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#e1eee7] border border-[#b8dbc0]">
                  <span className="text-[10px] font-mono uppercase text-[#1b3b32] font-bold block">
                    Emergency Status
                  </span>
                  <span className="text-lg font-extrabold text-[#1b3b32] font-mono">
                    {hospitalData.emergencyConfig.is24x7Emergency ? '24x7 ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>

              {/* Department Breakdown Preview Table */}
              <div className="bg-[#fafdfb] border border-gray-200 rounded-xl p-4 space-y-3">
                <span className="text-xs font-mono font-bold text-gray-900 block">
                  Department-Wise Infrastructure Breakdown
                </span>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-[#526860] uppercase text-[10px]">
                        <th className="py-2 px-2">Dept Code</th>
                        <th className="py-2 px-2">Department Name</th>
                        <th className="py-2 px-2">Location</th>
                        <th className="py-2 px-2">Beds (Total/Avail)</th>
                        <th className="py-2 px-2">Doctors (On Duty)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {hospitalData.departments.map((d) => (
                        <tr key={d.id}>
                          <td className="py-2 px-2 font-bold text-[#1b3b32]">{d.code}</td>
                          <td className="py-2 px-2 font-semibold">{d.name}</td>
                          <td className="py-2 px-2 text-gray-500">{d.locationFloor}</td>
                          <td className="py-2 px-2">
                            {d.beds.reduce((acc, b) => acc + b.total, 0)} Total /{' '}
                            <strong className="text-[#1b3b32]">
                              {d.beds.reduce((acc, b) => acc + b.available, 0)} Avail
                            </strong>
                          </td>
                          <td className="py-2 px-2">
                            {d.doctors.length} Doctors /{' '}
                            <strong className="text-[#0ca678]">
                              {d.doctors.filter((doc) => doc.availability === 'ON DUTY').length} On
                              Duty
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM STEP CONTROLS */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-800 text-xs font-bold font-mono transition-colors cursor-pointer border border-gray-300"
            >
              ← Previous Step
            </button>

            {currentStep < 8 ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(8, prev + 1))}
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
                <span>Confirm & Create Hospital</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
