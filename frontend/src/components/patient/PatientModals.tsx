import React, { useState } from 'react';
import { Hospital, ActiveSosState } from '../../types';
import { analyzeSymptomsApi, triggerEmergencySosApi, fetchHospitalAmbulanceNumberApi } from '../../services/api';

interface PatientModalsProps {
  showSOS: boolean;
  onCloseSOS: () => void;
  onOpenSOS?: () => void;
  onNavigateToBook?: (dept: string) => void;
  showAITriage: boolean;
  onCloseAITriage: () => void;
  showNearbyClinics: boolean;
  onCloseNearbyClinics: () => void;
  showNotifications: boolean;
  onCloseNotifications: () => void;
  onShowToast: (msg: string) => void;

  // Emergency SOS & Hospital Bed Allotment Props
  hospitals: Hospital[];
  activeSos: ActiveSosState | null;
  onTriggerSOS: (mode: 'drive-in' | 'ambulance', selectedHospitalId?: string) => void;
  onResetSOS: () => void;
  patientProfile?: any;

  showRequestAdmissionModal?: boolean;
  onCloseRequestAdmissionModal?: () => void;
  onSubmitAdmissionRequest?: (departmentId: string, reason: string) => void;
}

export const PatientModals: React.FC<PatientModalsProps> = ({
  showSOS,
  onCloseSOS,
  onOpenSOS,
  onNavigateToBook,
  showAITriage,
  onCloseAITriage,
  showNearbyClinics,
  onCloseNearbyClinics,
  showNotifications,
  onCloseNotifications,
  onShowToast,
  hospitals,
  activeSos,
  onTriggerSOS,
  onResetSOS,
  patientProfile,
  showRequestAdmissionModal,
  onCloseRequestAdmissionModal,
  onSubmitAdmissionRequest,
}) => {
  const [symptomText, setSymptomText] = useState('Feeling mild tightness in chest after climbing stairs.');
  const [triageResult, setTriageResult] = useState<null | { 
    level: 'Routine' | 'Urgent' | 'Emergency'; 
    rec: string;
    input_intent?: string;
    next_step?: string;
    immediate_guidance?: string[];
    required_care?: string;
    event_type?: string;
  }>(null);
  const [assessing, setAssessing] = useState(false);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = React.useRef<any>(null);

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onShowToast('Voice input not supported in this browser. Try Chrome.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    setIsListening(true);
    let finalTranscript = '';
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t + ' ';
        else interim = t;
      }
      setSymptomText((finalTranscript + interim).trim() || symptomText);
    };
    recognition.onerror = () => { setIsListening(false); };
    recognition.onend = () => { setIsListening(false); };
    recognition.start();
  };

  const handleCallDriver = () => {
    const driverNumber = activeSos?.driverPhone || '8303936384';
    onShowToast(`Calling Ambulance Driver: ${driverNumber}`);
    window.location.href = `tel:${driverNumber}`;
  };

  const handleCallHotline = async () => {
    let ambNumber = selectedHospital?.emergencyPhone || selectedHospital?.phone;
    try {
      const res = await fetchHospitalAmbulanceNumberApi();
      if (res && (res.emergency_phone || res.ambulance_number)) {
        ambNumber = res.emergency_phone || res.ambulance_number;
      }
    } catch (e) {
      // fallback
    }

    if (!ambNumber || !ambNumber.trim()) {
      ambNumber = '+91 11 4910 2000';
    }

    const cleanNumber = ambNumber.replace(/[^\d+]/g, '');
    onShowToast(`Calling Hospital ER Hotline: ${ambNumber}`);
    window.location.href = `tel:${cleanNumber}`;
  };

  // Hospital Selection State for Emergency Response
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(hospitals[0]?.id || 'hosp-1');
  const [showHospitalSelector, setShowHospitalSelector] = useState(false);

  // Long press to activate Ambulance state
  const [isHoldingAmbulance, setIsHoldingAmbulance] = useState(false);
  const [ambulanceHoldProgress, setAmbulanceHoldProgress] = useState(0);
  const ambulanceHoldTimer = React.useRef<NodeJS.Timeout | null>(null);
  const ambulanceProgressTimer = React.useRef<NodeJS.Timeout | null>(null);

  const startAmbulanceHold = () => {
    setIsHoldingAmbulance(true);
    setAmbulanceHoldProgress(0);
    const stepTime = 50; // ms
    const totalTime = 500; // ms
    ambulanceProgressTimer.current = setInterval(() => {
      setAmbulanceHoldProgress(prev => Math.min(prev + (stepTime / totalTime) * 100, 100));
    }, stepTime);
    ambulanceHoldTimer.current = setTimeout(() => {
      resetAmbulanceHold();
      onTriggerSOS('ambulance', selectedHospitalId);
    }, totalTime);
  };

  const resetAmbulanceHold = () => {
    setIsHoldingAmbulance(false);
    setAmbulanceHoldProgress(0);
    if (ambulanceHoldTimer.current) clearTimeout(ambulanceHoldTimer.current);
    if (ambulanceProgressTimer.current) clearInterval(ambulanceProgressTimer.current);
  };

  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0] || {
    id: 'hosp-1',
    name: 'CityCare Hospital (HSP-001)',
    dist: '1.8 km',
    time: '6 mins',
    phone: '+91 11 4910 2000',
    vacantBeds: 5,
    address: 'Plot 14, Sector 44, New Delhi',
  };

  const handleAssessSymptoms = async () => {
    setAssessing(true);
    try {
      const res = await analyzeSymptomsApi(symptomText);
      setAssessing(false);
      const level = res.level || 'Urgent';
      
      setTriageResult({
        level: level,
        rec: res.recommendation || 'Potential exertional angina presentation.',
        input_intent: res.input_intent,
        next_step: res.next_step,
        immediate_guidance: res.immediate_guidance,
        required_care: res.required_care,
        event_type: res.event_type,
        department: res.recommended_department
      });

      if (level === 'Emergency' || res.priority === 'EMERGENCY') {
        onCloseAITriage();
        if (onOpenSOS) onOpenSOS();
      }
    } catch (err) {
      setAssessing(false);
      if (symptomText.toLowerCase().includes('chest') || symptomText.toLowerCase().includes('tight')) {
        setTriageResult({
          level: 'Urgent',
          rec: 'Potential exertional angina presentation. Immediate resting recommended. Please schedule an urgent consult with Dr. Shiv Gupta or visit OPD-B.',
        });
      } else {
        setTriageResult({
          level: 'Routine',
          rec: 'Mild presentation. Continue regular monitoring and stay well hydrated. Book regular appointment if symptoms persist.',
        });
      }
    }
  };

  return (
    <>
      {/* 1. Emergency SOS & Live GPS Navigation Modal */}
      {showSOS && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="w-full max-w-md mx-auto bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-error font-bold flex items-center gap-1.5 text-sm">
                  <span className="material-symbols-outlined text-[20px] animate-pulse">e911_emergency</span>
                  CRITICAL EMERGENCY SOS
                </span>
                {activeSos?.status === 'redirected' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px] tracking-wide animate-pulse">
                    REROUTED
                  </span>
                )}
              </div>
              <button 
                onClick={activeSos ? onResetSOS : onCloseSOS} 
                className="cursor-pointer text-gray-500 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                title={activeSos ? "End & Cancel Active SOS" : "Close"}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {!activeSos ? (
              /* STEP 1: CHOOSE EMERGENCY MODE (DRIVE-IN vs AMBULANCE) */
              <div className="flex flex-col gap-3">
                <p className="text-xs text-on-surface leading-relaxed">
                  Select emergency response mode. An emergency ER bed will be <strong>automatically allotted</strong> at your target hospital and triage station will be notified.
                </p>

                {/* Target Hospital Card with Change Option */}
                <div className="bg-surface-container-low p-3.5 rounded-2xl border border-primary/30 flex flex-col gap-2 text-xs shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-primary flex items-center gap-1 text-sm truncate">
                      <span className="material-symbols-outlined text-[18px]">local_hospital</span>
                      {selectedHospital.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-bold text-[10px] shrink-0">
                      {selectedHospital.vacantBeds} Vacant Beds
                    </span>
                  </div>

                  <div className="text-[11px] text-on-surface-variant flex items-center justify-between">
                    <span className="truncate max-w-[220px]">{selectedHospital.address}</span>
                    <strong className="text-on-surface font-mono shrink-0">{selectedHospital.dist} • {selectedHospital.time}</strong>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-500 font-bold uppercase">
                      {selectedHospital.id === hospitals[0]?.id ? '⭐ Nearest Recommended' : '✓ Custom Selected Target'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowHospitalSelector(!showHospitalSelector)}
                      className="px-3 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                      <span>{showHospitalSelector ? 'Close List' : 'Change Hospital'}</span>
                    </button>
                  </div>
                </div>

                {/* Nearby Hospitals Selector List */}
                {showHospitalSelector && (
                  <div className="bg-white border border-primary/30 rounded-2xl p-3 space-y-2 max-h-60 overflow-y-auto animate-in fade-in">
                    <div className="text-[10px] font-mono font-bold uppercase text-gray-500 flex justify-between items-center pb-1 border-b">
                      <span>Select Target Emergency Hospital</span>
                      <span>{hospitals.length} Available Nearby</span>
                    </div>

                    {hospitals.map((h, idx) => (
                      <div
                        key={h.id}
                        onClick={() => {
                          setSelectedHospitalId(h.id);
                          setShowHospitalSelector(false);
                          onShowToast(`Emergency destination set to ${h.name}`);
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          h.id === selectedHospitalId
                            ? 'bg-primary-container/20 border-primary text-primary font-bold ring-1 ring-primary'
                            : 'bg-surface-container-low border-gray-200 hover:border-primary/40 text-on-surface'
                        }`}
                      >
                        <div className="space-y-0.5 max-w-[220px]">
                          <div className="flex items-center gap-1.5">
                            {idx === 0 && (
                              <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 shrink-0">
                                NEAREST
                              </span>
                            )}
                            <span className="font-bold text-xs truncate">{h.name}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 truncate">{h.address}</div>
                          <div className="text-[10px] font-mono text-primary font-bold">
                            {h.dist} away • {h.time} ETA
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-bold text-[10px]">
                            {h.vacantBeds} Beds
                          </span>
                          {h.id === selectedHospitalId ? (
                            <span className="text-[10px] text-primary font-bold flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              Selected
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">Tap to Select</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {triageResult?.immediate_guidance && triageResult.immediate_guidance.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-2xl border border-red-200 mt-2">
                    <strong className="text-[11px] uppercase text-red-800 flex items-center gap-1 mb-1.5">
                      <span className="material-symbols-outlined text-[14px]">medical_information</span>
                      Immediate Medical Guidance
                    </strong>
                    <ul className="list-disc pl-4 text-[11px] text-red-900 space-y-0.5 leading-relaxed">
                      {triageResult.immediate_guidance.map((guidance: string, idx: number) => (
                        <li key={idx}>{guidance}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2.5 pt-1 mt-2">
                  {/* Option A: Drive-In */}
                  <button
                    type="button"
                    onClick={() => onTriggerSOS('drive-in', selectedHospitalId)}
                    className="p-4 bg-primary text-white rounded-2xl flex items-center justify-between shadow-md hover:bg-primary-container transition-all active:scale-[0.98] cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                        <span className="material-symbols-outlined text-[26px]">directions_car</span>
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          <span>Drive-In (Self/Family Transport)</span>
                        </div>
                        <p className="text-[11px] text-white/80 mt-0.5">
                          Turn-by-turn navigation & reserves <strong>ER Bed #04</strong> at {selectedHospital.name}.
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[22px] group-hover:translate-x-1 transition-transform">chevron_right</span>
                  </button>

                  {/* Option B: Request Ambulance (Hold to activate) */}
                  <button
                    type="button"
                    onMouseDown={startAmbulanceHold}
                    onMouseUp={resetAmbulanceHold}
                    onMouseLeave={resetAmbulanceHold}
                    onTouchStart={startAmbulanceHold}
                    onTouchEnd={resetAmbulanceHold}
                    className="p-4 bg-error text-white rounded-2xl flex items-center justify-between shadow-md hover:bg-error-container transition-all active:scale-[0.98] cursor-pointer text-left group relative overflow-hidden"
                  >
                    {/* Progress Bar Background */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-[#e03131] transition-all duration-75 ease-linear z-0" 
                      style={{ width: `${ambulanceHoldProgress}%` }}
                    />
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={`w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 ${isHoldingAmbulance ? 'animate-ping' : 'animate-pulse'}`}>
                        <span className="material-symbols-outlined text-[26px]">ambulance</span>
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          <span>{isHoldingAmbulance ? 'HOLDING...' : 'Hold 1s for Ambulance'}</span>
                        </div>
                        <p className="text-[11px] text-white/80 mt-0.5">
                          Dispatches GPS ALS Ambulance #ER-402 & reserves ER bed at {selectedHospital.name}.
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[22px] group-hover:translate-x-1 transition-transform relative z-10">
                      chevron_right
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onCloseSOS}
                  className="w-full py-2.5 bg-surface-container font-semibold text-xs uppercase rounded-xl cursor-pointer mt-1"
                >
                  Cancel
                </button>
              </div>
            ) : activeSos.mode === 'drive-in' ? (
              /* STEP 2: DRIVE-IN LIVE GPS TURN-BY-TURN MAP NAVIGATION VIEW */
              <div className="flex flex-col gap-3">
                {/* Bed Allotment Confirmation Banner */}
                <div className={`p-3 rounded-xl flex items-center justify-between text-xs ${
                  activeSos.status === 'redirected'
                    ? 'bg-amber-500/15 border border-amber-500/40'
                    : 'bg-primary-container/30 border border-primary/30'
                }`}>
                  <div>
                    <span className={`font-bold block uppercase text-[10px] ${
                      activeSos.status === 'redirected' ? 'text-amber-800' : 'text-primary'
                    }`}>
                      {activeSos.status === 'redirected' ? '⚠️ Rerouted Destination & Bed Confirmed' : 'ER Bed Allotment Confirmed'}
                    </span>
                    <strong className="text-on-surface text-sm">{activeSos.bedNo} Reserved</strong>
                    {activeSos.status === 'redirected' && (
                      <span className="text-[11px] text-amber-900 block font-semibold mt-0.5">
                        At: {activeSos.redirectedHospitalName || activeSos.hospitalName}
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded font-bold text-[10px] ${
                    activeSos.status === 'redirected' ? 'bg-amber-600 text-white' : 'bg-primary text-white'
                  }`}>
                    {activeSos.status === 'redirected' ? 'Partner Bed #08' : '1 ER Bed Allotted'}
                  </span>
                </div>

                {/* Doctor Intake Status Banner */}
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                  activeSos.status === 'accepted'
                    ? 'bg-green-100 text-green-900 border border-green-300'
                    : activeSos.status === 'redirected'
                    ? 'bg-amber-100 text-amber-950 border border-amber-400 ring-1 ring-amber-300'
                    : 'bg-blue-50 text-blue-900 border border-blue-200'
                }`}>
                  <span className="material-symbols-outlined text-[22px] shrink-0 text-amber-700 animate-pulse">
                    {activeSos.status === 'accepted' ? 'check_circle' : activeSos.status === 'redirected' ? 'alt_route' : 'local_hospital'}
                  </span>
                  <div className="flex-1">
                    {activeSos.status === 'en-route' && (
                      <p>Patient En-Route • ER Bed Allotted • Awaiting Doctor Confirmation</p>
                    )}
                    {activeSos.status === 'accepted' && (
                      <p>Confirmed by Dr. Shiv Gupta! Trauma Bay 1 & ER Bed Ready at Gate #2</p>
                    )}
                    {activeSos.status === 'redirected' && (
                      <div>
                        <p className="text-amber-950 font-extrabold uppercase tracking-wide text-[11px]">
                          ⚠️ Rerouted by Triage Command
                        </p>
                        <p className="text-amber-900 font-medium text-[11px] mt-0.5 leading-snug">
                          Destination changed to <strong>{activeSos.redirectedHospitalName || activeSos.hospitalName}</strong>. ER Bed <strong>{activeSos.bedNo}</strong> is reserved and ready!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {triageResult?.immediate_guidance && triageResult.immediate_guidance.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-2xl border border-red-200 mt-2">
                    <strong className="text-[11px] uppercase text-red-800 flex items-center gap-1 mb-1.5">
                      <span className="material-symbols-outlined text-[14px]">medical_information</span>
                      Immediate Medical Guidance
                    </strong>
                    <ul className="list-disc pl-4 text-[11px] text-red-900 space-y-0.5 leading-relaxed">
                      {triageResult.immediate_guidance.map((guidance: string, idx: number) => (
                        <li key={idx}>{guidance}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Interactive Map Canvas Mock */}
                <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-outline-variant/40 bg-slate-900 shadow-inner flex flex-col justify-between p-3">
                  {/* Map SVG Graphic */}
                  <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 400 180" fill="none">
                    {/* Grid Roads */}
                    <path d="M 20 40 L 380 40" stroke="#334155" strokeWidth="6" />
                    <path d="M 20 120 L 380 120" stroke="#334155" strokeWidth="6" />
                    <path d="M 120 10 L 120 170" stroke="#334155" strokeWidth="6" />
                    <path d="M 280 10 L 280 170" stroke="#334155" strokeWidth="6" />
                    {/* Live Route Line (Neon Green) */}
                    <path d="M 40 120 L 120 120 L 120 40 L 280 40 L 280 90" stroke={activeSos.status === 'redirected' ? '#f59e0b' : '#10b981'} strokeWidth="5" strokeDasharray="8 4" className="animate-pulse" />
                    {/* User Dot */}
                    <circle cx="40" cy="120" r="8" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                    {/* Hospital Pin */}
                    <circle cx="280" cy="90" r="10" fill={activeSos.status === 'redirected' ? '#d97706' : '#ef4444'} stroke="#ffffff" strokeWidth="2" />
                  </svg>

                  {/* Top Stats Overlay */}
                  <div className="relative z-10 flex justify-between items-center bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${activeSos.status === 'redirected' ? 'bg-amber-400' : 'bg-emerald-400'} animate-ping`}></span>
                      <span>{activeSos.status === 'redirected' ? 'Updated GPS Route' : 'Live GPS Route'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span>{activeSos.status === 'redirected' ? '2.4 km' : '1.8 km'}</span>
                      <span>•</span>
                      <span className={`${activeSos.status === 'redirected' ? 'text-amber-400' : 'text-emerald-400'} font-bold`}>
                        {activeSos.status === 'redirected' ? '8 Mins Est.' : '6 Mins Est.'}
                      </span>
                    </div>
                  </div>

                  {/* Destination Info Overlay */}
                  <div className="relative z-10 bg-slate-800/90 backdrop-blur-md p-2.5 rounded-xl text-white text-xs border border-white/10 flex justify-between items-center">
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                        {activeSos.status === 'redirected' ? 'Rerouted Destination' : 'Destination'}
                      </span>
                      <strong className="text-xs truncate block max-w-[240px] text-amber-300 font-bold">
                        {activeSos.redirectedHospitalName || activeSos.hospitalName}
                      </strong>
                      {(activeSos.redirectedHospitalAddress || selectedHospital?.address) && (
                        <span className="text-[10px] text-slate-300 truncate block max-w-[240px]">
                          {activeSos.redirectedHospitalAddress || selectedHospital?.address}
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      activeSos.status === 'redirected' ? 'bg-amber-500 text-white' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {activeSos.status === 'redirected' ? 'REROUTED' : 'CLEAR TRAFFIC'}
                    </span>
                  </div>
                </div>

                {/* Turn-by-Turn GPS Steps */}
                <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-[10px] text-gray-500 block">
                      {activeSos.status === 'redirected' ? 'Updated GPS Route to Partner Hospital' : 'Turn-by-Turn GPS Directions'}
                    </span>
                    {activeSos.status === 'redirected' && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        Live Route Updated
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    {activeSos.status === 'redirected' ? (
                      <>
                        <div className="flex items-center gap-2 text-on-surface font-semibold text-amber-800">
                          <span className="material-symbols-outlined text-amber-600 text-[16px]">alt_route</span>
                          <span>Rerouted from primary hospital due to capacity/specialty</span>
                        </div>
                        <div className="flex items-center gap-2 text-on-surface">
                          <span className="material-symbols-outlined text-primary text-[16px]">turn_left</span>
                          <span>Take NH-48 Express lane towards {activeSos.redirectedHospitalName || 'Partner Hospital'} (2.4 km)</span>
                        </div>
                        <div className="flex items-center gap-2 text-on-surface font-bold text-amber-900">
                          <span className="material-symbols-outlined text-error text-[16px]">local_hospital</span>
                          <span>Arrive at {activeSos.redirectedHospitalName} • Proceed to {activeSos.bedNo}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-on-surface">
                          <span className="material-symbols-outlined text-primary text-[16px]">turn_right</span>
                          <span>Head East on Mathura Road towards Ring Road Flyover (400m)</span>
                        </div>
                        <div className="flex items-center gap-2 text-on-surface">
                          <span className="material-symbols-outlined text-primary text-[16px]">straight</span>
                          <span>Take Left Slip Road into Hospital Emergency Lane (1.1 km)</span>
                        </div>
                        <div className="flex items-center gap-2 text-on-surface font-bold">
                          <span className="material-symbols-outlined text-error text-[16px]">location_on</span>
                          <span>Arrive at ER Gate #2 Trauma Bay (300m)</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCallHotline}
                    className="flex-1 py-2.5 bg-secondary text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">call</span>
                    <span>Call ER Hotline</span>
                  </button>

                  <button
                    type="button"
                    onClick={onResetSOS}
                    className="py-2.5 px-4 bg-surface-container hover:bg-error/10 hover:text-error font-bold text-xs uppercase rounded-xl cursor-pointer transition-colors"
                  >
                    End SOS
                  </button>
                </div>
              </div>
            ) : (
              /* AMBULANCE DISPATCH TRACKER VIEW */
              <div className="py-4 text-center flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center animate-pulse ${
                  activeSos.status === 'redirected' ? 'bg-amber-100 text-amber-700' : 'bg-error/20 text-error'
                }`}>
                  <span className="material-symbols-outlined text-[32px]">
                    {activeSos.status === 'redirected' ? 'alt_route' : 'ambulance'}
                  </span>
                </div>
                <div>
                  <h4 className={`font-headline-md text-base font-bold ${
                    activeSos.status === 'redirected' ? 'text-amber-800' : 'text-error'
                  }`}>
                    {activeSos.status === 'redirected' ? 'Ambulance Rerouted to Partner Hospital!' : 'ALS Ambulance Dispatched!'}
                  </h4>
                  <p className="text-xs text-on-surface-variant max-w-[280px] mt-1">
                    Emergency response unit <strong>#ER-402</strong> is en route.{' '}
                    <strong>{activeSos.bedNo}</strong> reserved at{' '}
                    <strong className="text-on-surface">
                      {activeSos.redirectedHospitalName || activeSos.hospitalName}
                    </strong>.
                  </p>
                  {activeSos.status === 'redirected' && activeSos.redirectedHospitalAddress && (
                    <p className="text-[11px] text-amber-700 font-medium mt-1">
                      📍 {activeSos.redirectedHospitalAddress}
                    </p>
                  )}
                </div>

                {triageResult?.immediate_guidance && triageResult.immediate_guidance.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-2xl border border-red-200 w-full text-left">
                    <strong className="text-[11px] uppercase text-red-800 flex items-center gap-1 mb-1.5">
                      <span className="material-symbols-outlined text-[14px]">medical_information</span>
                      Immediate Medical Guidance (While Waiting)
                    </strong>
                    <ul className="list-disc pl-4 text-[11px] text-red-900 space-y-0.5 leading-relaxed">
                      {triageResult.immediate_guidance.map((guidance: string, idx: number) => (
                        <li key={idx}>{guidance}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="w-full bg-surface-container-low p-3 rounded-xl text-xs space-y-1.5 text-left border border-outline-variant/20">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Destination Hospital:</span>
                    <strong className="text-on-surface truncate max-w-[200px] text-right font-bold text-amber-900">
                      {activeSos.redirectedHospitalName || activeSos.hospitalName}
                    </strong>
                  </div>
                  {activeSos.redirectedHospitalAddress && (
                    <div className="flex justify-between items-center text-[10px] text-gray-500">
                      <span>Address:</span>
                      <span className="truncate max-w-[200px] text-right">{activeSos.redirectedHospitalAddress}</span>
                    </div>
                  )}
                  {activeSos.patientLocation && (
                    <div className="flex justify-between items-center text-[10px] bg-red-50/60 p-1.5 rounded border border-red-100">
                      <span className="text-red-700 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">my_location</span>
                        <span>Pickup Location:</span>
                      </span>
                      <span className="truncate max-w-[190px] text-right text-gray-800 font-medium">
                        {activeSos.patientLocation}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ambulance Vehicle:</span>
                    <strong className="text-on-surface font-mono font-bold">
                      {activeSos.ambulanceNumber || 'DL-01-AMB-402'} ({activeSos.ambulanceType || 'ALS'})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Assigned Driver:</span>
                    <strong className="text-on-surface font-medium">
                      {activeSos.driverName || 'Rajesh Kumar'} ({activeSos.driverPhone || '+91 83039 36384'})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Estimated Arrival:</span>
                    <strong className="text-error">6 Minutes</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reserved Bed:</span>
                    <strong className="text-primary font-bold">{activeSos.bedNo}</strong>
                  </div>
                  {activeSos.status === 'redirected' && (
                    <div className="flex justify-between items-center pt-1.5 border-t border-amber-200">
                      <span className="text-amber-800 font-bold text-[10px]">DISPATCH STATUS:</span>
                      <span className="px-2 py-0.5 bg-amber-500 text-white rounded font-bold text-[10px]">
                        REROUTED BY HOSPITAL
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex w-full gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleCallDriver}
                    className="flex-1 py-2.5 bg-error text-white font-bold text-xs uppercase rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">call</span>
                    <span>Call Driver</span>
                  </button>
                  <button
                    type="button"
                    onClick={onResetSOS}
                    className="py-2.5 px-4 bg-surface-container font-bold text-xs uppercase rounded-xl cursor-pointer"
                  >
                    End SOS
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. AI Triage Modal */}
      {showAITriage && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end p-0 sm:p-4">
          <div className="w-full max-w-md mx-auto bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">neurology</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">MediNexus AI Triage</h3>
              </div>
              <button onClick={onCloseAITriage} className="cursor-pointer text-gray-500">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Label + Mic button row */}
              <div className="flex items-center justify-between">
                <label className="font-bold uppercase text-[10px] text-gray-500 block">Describe What You Are Feeling</label>
                <button
                  type="button"
                  onClick={startVoiceInput}
                  title={isListening ? 'Stop listening' : 'Speak your symptoms'}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{isListening ? 'stop_circle' : 'mic'}</span>
                  <span>{isListening ? 'Listening...' : 'Speak'}</span>
                </button>
              </div>

              {/* Voice wave animation while listening */}
              {isListening && (
                <div className="flex items-center gap-1 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                  <span className="material-symbols-outlined text-red-500 text-[16px] animate-pulse">graphic_eq</span>
                  <span className="text-red-600 text-[11px] font-medium">Listening... speak your symptoms clearly</span>
                  <span className="ml-auto flex gap-0.5">
                    {[1,2,3,4].map(i => (
                      <span key={i} className="w-0.5 rounded-full bg-red-400 animate-bounce" style={{height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s`}} />
                    ))}
                  </span>
                </div>
              )}

              <textarea
                value={symptomText}
                onChange={(e) => setSymptomText(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs"
                placeholder="E.g. Headache since morning, slight chest pressure... or tap the mic to speak"
              />

              <button
                onClick={handleAssessSymptoms}
                disabled={assessing || isListening}
                className="w-full py-2.5 bg-primary text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {assessing ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    <span>Evaluating Symptoms...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                    <span>Analyze with Clinical AI</span>
                  </>
                )}
              </button>

              {triageResult && (
                <div className={`p-3 rounded-xl border space-y-1.5 animate-in fade-in ${
                  triageResult.input_intent === 'NON_MEDICAL' ? 'bg-gray-50 border-gray-300' :
                  triageResult.level === 'Emergency' ? 'bg-red-50 border-red-300' :
                  triageResult.level === 'Urgent' ? 'bg-amber-50 border-amber-300' :
                  'bg-green-50 border-green-300'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">biotech</span>
                      {triageResult.input_intent === 'NON_MEDICAL' ? 'AI Assessment' : 'AI Risk Assessment'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      triageResult.input_intent === 'NON_MEDICAL' ? 'bg-gray-200 text-gray-700' :
                      triageResult.level === 'Emergency' ? 'bg-red-500 text-white animate-pulse' :
                      triageResult.level === 'Urgent' ? 'bg-amber-100 text-amber-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {triageResult.input_intent === 'NON_MEDICAL' ? 'Non-Medical' :
                        <>{triageResult.level === 'Emergency' ? '🚨 ' : ''}{triageResult.level} Priority</>
                      }
                    </span>
                  </div>
                  
                  <p className="text-on-surface-variant text-[11px] leading-relaxed">{triageResult.rec}</p>
                  
                  {triageResult.input_intent === 'MEDICAL' && triageResult.required_care && (
                    <div className="mt-1 flex gap-2">
                       <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">stethoscope</span>
                          {triageResult.required_care}
                       </span>
                    </div>
                  )}

                  {triageResult.immediate_guidance && triageResult.immediate_guidance.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-black/10">
                      <strong className="text-[10px] uppercase text-gray-600 block mb-1">Immediate Guidance:</strong>
                      <ul className="list-disc pl-4 text-[11px] text-gray-700 space-y-0.5">
                        {triageResult.immediate_guidance.map((guidance, idx) => (
                          <li key={idx}>{guidance}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {triageResult.level !== 'Emergency' && triageResult.department && onNavigateToBook && (
                    <div className="pt-2 mt-2 border-t border-black/10">
                      <button
                        onClick={() => {
                          onCloseAITriage();
                          onNavigateToBook(triageResult.department);
                        }}
                        className="w-full py-2 bg-primary hover:bg-primary-container text-white hover:text-on-primary-container font-bold text-xs uppercase rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">search</span>
                        Search {triageResult.department} Doctors
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Nearby Hospitals & Live Vacant ER Beds Modal */}
      {showNearbyClinics && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end p-0 sm:p-4">
          <div className="w-full max-w-md mx-auto bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">local_hospital</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">Nearby Emergency & Vacant ER Beds</h3>
              </div>
              <button onClick={onCloseNearbyClinics} className="cursor-pointer text-gray-500">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {hospitals.map((h) => (
                <div key={h.id} className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between border border-outline-variant/20">
                  <div>
                    <strong className="text-on-surface block font-bold">{h.name}</strong>
                    <span className="text-[11px] text-on-surface-variant block">{h.erStatus}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-primary font-bold">{h.dist} • {h.time}</span>
                      <span className="px-2 py-0.2 rounded-full bg-green-100 text-green-800 font-bold text-[10px]">
                        {h.vacantBeds} Vacant Beds
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onShowToast(`Navigating to ${h.name}`)}
                    className="p-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary-container"
                  >
                    <span className="material-symbols-outlined text-[16px]">directions</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Patient Notifications */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end p-0 sm:p-4">
          <div className="w-full max-w-md mx-auto bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <h3 className="font-headline-md text-base font-bold text-on-surface">Patient Notifications</h3>
              <button onClick={onCloseNotifications} className="cursor-pointer text-gray-500">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="space-y-2 text-xs mb-4">
              <div className="p-2.5 bg-surface-container-low rounded-lg">
                <strong className="text-primary block">Upcoming Appointment Reminder</strong>
                <p className="text-on-surface mt-0.5">Your visit with Dr. Shiv Gupta is scheduled for Oct 28 at 10:00 AM.</p>
              </div>
              <div className="p-2.5 bg-surface-container-low rounded-lg">
                <strong className="text-secondary block">Lab Results Ready</strong>
                <p className="text-on-surface mt-0.5">Your Lipid Profile has been uploaded to your Medical Vault.</p>
              </div>
            </div>
            <button onClick={onCloseNotifications} className="w-full py-2.5 bg-primary text-white font-bold text-xs uppercase rounded-xl cursor-pointer">
              Done
            </button>
          </div>
        </div>
      )}

      {/* 5. Request Bed / Admission Modal */}
      {showRequestAdmissionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">single_bed</span>
                <div>
                  <span className="font-label-caps text-[10px] text-primary uppercase font-bold tracking-wider">Hospital Care Admission</span>
                  <h3 className="font-headline-md text-base font-bold text-on-surface">Request Bed Admission</h3>
                </div>
              </div>
              <button onClick={onCloseRequestAdmissionModal} className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const dept = (form.elements.namedItem('department_id') as HTMLSelectElement).value;
                const r = (form.elements.namedItem('reason') as HTMLTextAreaElement).value;
                if (!r) return;
                if (onSubmitAdmissionRequest) onSubmitAdmissionRequest(dept, r);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-on-surface-variant uppercase block text-[10px] mb-1">Target Hospital</label>
                <input
                  type="text"
                  disabled
                  value="CityCare Hospital (HSP-001)"
                  className="w-full p-2.5 bg-surface-container-low/60 rounded-xl border border-outline-variant/30 text-on-surface font-semibold text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-on-surface-variant uppercase block text-[10px] mb-1">Target Department</label>
                <select
                  name="department_id"
                  defaultValue="dept-cardio"
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface font-medium text-xs focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="dept-cardio">Cardiology & Vascular Medicine</option>
                  <option value="dept-er">Emergency & Trauma</option>
                  <option value="dept-neuro">Neurology & Neuro Intensive Care</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-on-surface-variant uppercase block text-[10px] mb-1">Clinical Reason for Admission</label>
                <textarea
                  name="reason"
                  rows={3}
                  placeholder="Describe your symptoms and why admission or bed care is required..."
                  required
                  defaultValue="Recurrent chest tightness upon exertion and severe nocturnal dyspnea."
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onCloseRequestAdmissionModal}
                  className="flex-1 py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs uppercase rounded-xl cursor-pointer hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-white font-bold text-xs uppercase rounded-xl shadow-sm cursor-pointer hover:bg-primary-container flex items-center justify-center gap-1 font-bold"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Submit Bed Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
