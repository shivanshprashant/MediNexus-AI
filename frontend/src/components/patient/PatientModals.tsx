import React, { useState } from 'react';
import { Hospital, ActiveSosState } from '../../types';

interface PatientModalsProps {
  showSOS: boolean;
  onCloseSOS: () => void;
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
  onCompleteAssessment?: (assessment: any, pathway: any, hospitals: Hospital[], doctors?: any[]) => void;
}

export const PatientModals: React.FC<PatientModalsProps> = ({
  showSOS,
  onCloseSOS,
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
  onCompleteAssessment,
}) => {
  const [symptomText, setSymptomText] = useState('');
  const [triageResult, setTriageResult] = useState<null | {
    severity?: string;
    emergency?: boolean;
    department?: string;
    recommended_action?: string;
    reason?: string;
    immediate_guidance?: string[];
    level: 'Routine' | 'Urgent' | 'Emergency';
    rec: string;
    topHospital?: any;
  }>(null);
  const [assessing, setAssessing] = useState(false);
  const [pendingPathwayData, setPendingPathwayData] = useState<any>(null);

  // Voice & Location state
  const [selectedLang, setSelectedLang] = useState<string>('hi-IN');
  const [isListening, setIsListening] = useState(false);
  const [voiceStatusText, setVoiceStatusText] = useState('Voice input ready');
  const [locationStatus, setLocationStatus] = useState('📍 Location detected');
  const [latLong, setLatLong] = useState({ lat: 23.2599, lng: 77.4126 });
  const recognitionRef = React.useRef<any>(null);
  const silenceTimerRef = React.useRef<any>(null);
  const lastSpokenTextRef = React.useRef<string>('');
  const symptomInputRef = React.useRef<HTMLTextAreaElement>(null);

  const startListening = () => {
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        // Fallback for browsers without Web Speech API
        setVoiceStatusText('Web Speech API not supported on this browser. Using Quick Voice & Keyboard.');
        onShowToast('Web Speech API not available in this browser. Please type or use Quick Presets.');
        if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
              setIsListening(true);
              setVoiceStatusText('🎤 Physical Mic Active (Speech-to-Text unavailable in browser; type or use presets)');
              onShowToast('🎤 Microphone stream detected!');
              stream.getTracks().forEach((t) => t.stop());
            })
            .catch(() => {
              setVoiceStatusText('Microphone access denied. You can use keyboard input or Quick Presets.');
            });
        }
        return;
      }

      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }

      const rec = new SpeechRecognition();
      rec.continuous = false; // Auto-stop when user stops speaking
      rec.interimResults = true;
      rec.lang = selectedLang || 'hi-IN';

      rec.onstart = () => {
        setIsListening(true);
        setVoiceStatusText('🎙️ Listening... Speak your symptoms now');
        onShowToast('🎙️ Microphone active — Speak your symptoms now');
      };

      rec.onresult = (e: any) => {
        setVoiceStatusText('Processing speech...');
        let transcript = '';
        let hasFinal = false;

        for (let i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            hasFinal = true;
          }
        }
        if (transcript) {
          setSymptomText(transcript);
          lastSpokenTextRef.current = transcript;
        }

        // Auto-close mic & evaluate symptoms 1.2 seconds after speaking finishes
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          stopListening();
          setVoiceStatusText('✅ Speech completed • Evaluating with AI...');
          if (lastSpokenTextRef.current && lastSpokenTextRef.current.trim()) {
            handleAssessSymptoms(lastSpokenTextRef.current);
          }
        }, 1200);

        if (hasFinal) {
          setTimeout(() => {
            stopListening();
            setVoiceStatusText('✅ Speech completed • Evaluating with AI...');
            if (lastSpokenTextRef.current && lastSpokenTextRef.current.trim()) {
              handleAssessSymptoms(lastSpokenTextRef.current);
            }
          }, 400);
        }
      };

      rec.onspeechend = () => {
        setVoiceStatusText('Speech finished • Evaluating with Clinical AI...');
        setTimeout(() => {
          stopListening();
          if (lastSpokenTextRef.current && lastSpokenTextRef.current.trim()) {
            handleAssessSymptoms(lastSpokenTextRef.current);
          }
        }, 400);
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition event:', e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setIsListening(false);
          setVoiceStatusText('Microphone permission blocked. Click the lock/mic icon in browser URL bar to allow.');
          onShowToast('⚠️ Microphone blocked by browser settings. Please allow access.');
        } else if (e.error === 'audio-capture') {
          setIsListening(false);
          setVoiceStatusText('No microphone detected or hardware in use by another app.');
          onShowToast('⚠️ No microphone device found or mic in use.');
        } else if (e.error === 'no-speech') {
          setIsListening(false);
          setVoiceStatusText('No speech detected • Microphone closed');
        } else {
          setIsListening(false);
          setVoiceStatusText(`Mic info: ${e.error}`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error('Mic initialization error:', err);
      setIsListening(false);
      setVoiceStatusText('Microphone error. Click "Start Mic" or select a Quick Preset.');
      onShowToast('Microphone error. Try clicking "Start Mic" again.');
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    setIsListening(false);
    setVoiceStatusText('Microphone turned off');
  };

  const toggleVoiceListen = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Automatic Geolocation and Initial Voice State
  React.useEffect(() => {
    if (showAITriage) {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLatLong({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLocationStatus('📍 Location detected');
          },
          () => {
            setLocationStatus('📍 Location set to Default Region');
          }
        );
      }
      setVoiceStatusText('Voice input ready • Tap "Start Mic" or mic button below');
    } else {
      stopListening();
    }
  }, [showAITriage]);

  const handleTextChange = (val: string) => {
    setSymptomText(val);
    lastSpokenTextRef.current = val;
    // IMMEDIATELY stop/pause microphone listening when patient starts typing!
    if (recognitionRef.current && isListening) {
      stopListening();
      setVoiceStatusText('Microphone paused (Typing active)');
    }
  };

  // Hospital Selection State for Emergency Response
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(hospitals[0]?.id || 'hosp-1');
  const [showHospitalSelector, setShowHospitalSelector] = useState(false);

  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0] || {
    id: 'hosp-1',
    name: 'CityCare Hospital (HSP-001)',
    dist: '1.8 km',
    time: '6 mins',
    phone: '+91 11 4910 2000',
    vacantBeds: 5,
    address: 'Plot 14, Sector 44, New Delhi',
  };

  const handleAssessSymptoms = async (customText?: string | any) => {
    let rawText = '';
    if (typeof customText === 'string') {
      rawText = customText;
    } else if (typeof symptomText === 'string') {
      rawText = symptomText;
    } else if (lastSpokenTextRef.current && typeof lastSpokenTextRef.current === 'string') {
      rawText = lastSpokenTextRef.current;
    } else {
      rawText = String(symptomText || '');
    }

    const textToAssess = (rawText || '').trim();
    if (!textToAssess) {
      onShowToast('⚠️ Please type or speak your symptoms first!');
      if (symptomInputRef.current) {
        symptomInputRef.current.focus();
      }
      return;
    }

    const tFrontendStart = performance.now();
    console.log('[PERF] User submitted message / API request starting...');
    setAssessing(true);
    setTriageResult(null);
    onShowToast('🧠 MediNexus AI is analyzing your symptoms...');
    try {
      const apiReqStart = performance.now();
      const response = await fetch('http://127.0.0.1:8080/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptomText: textToAssess,
          patient_latitude: latLong.lat,
          patient_longitude: latLong.lng,
        }),
      });
      const apiReqEnd = performance.now();
      console.log(`[PERF] API request duration: ${((apiReqEnd - apiReqStart) / 1000).toFixed(2)} sec`);

      if (response.ok) {
        const data = await response.json();
        const navStart = performance.now();
        console.log('[PERF] API response received, starting navigation / screen render...');
        const assessment = data.assessment || {};
        const recommendedHospitals = data.hospitals || [];
        let level: 'Routine' | 'Urgent' | 'Emergency' = 'Routine';

        if (assessment.severity === 'EMERGENCY' || assessment.emergency) {
          level = 'Emergency';
        } else if (assessment.severity === 'HIGH' || assessment.severity === 'MODERATE') {
          level = 'Urgent';
        }

        const tFrontendTotal = (performance.now() - tFrontendStart) / 1000;
        console.log(`[PERF] Navigation & screen render complete: ${((performance.now() - navStart) / 1000).toFixed(4)} sec`);
        console.log(`[PERF] Frontend total: ${tFrontendTotal.toFixed(2)} sec`);

        setTriageResult({
          severity: assessment.severity || 'MODERATE',
          emergency: assessment.emergency || false,
          department: assessment.department || 'General Medicine',
          recommended_action: assessment.recommended_action || 'Consult a medical professional.',
          reason: assessment.reason || 'Symptom evaluation completed.',
          immediate_guidance: assessment.immediate_guidance || [],
          level,
          rec: assessment.rec || assessment.recommended_action || 'Please consult a doctor for evaluation.',
          topHospital: recommendedHospitals[0] || null,
        });

        setPendingPathwayData({
          assessment,
          pathway: data.pathway,
          hospitals: recommendedHospitals,
          doctors: data.doctors || [],
        });

        if (assessment.emergency || assessment.severity === 'EMERGENCY') {
          onShowToast('🚨 EMERGENCY TRIAGE ALERT: Emergency guidance & provider notification sent.');
        }
      } else {
        throw new Error('Backend server returned error');
      }
    } catch (err) {
      // Fallback local evaluation
      const lowered = textToAssess.toLowerCase();
      if (
        lowered.includes('unconscious') ||
        lowered.includes('not responding') ||
        lowered.includes('isnt responding') ||
        lowered.includes('passed out')
      ) {
        setTriageResult({
          severity: 'EMERGENCY',
          emergency: true,
          department: 'Emergency Medicine',
          recommended_action: 'Contact local emergency services immediately.',
          reason: 'Patient reported to be unconscious or unresponsive.',
          immediate_guidance: [
            'Contact local emergency services immediately.',
            'Do not leave the person alone.',
            'Check whether the person is breathing normally if safe to do so.',
            'Do not give food, drink, or medication to an unconscious person.',
          ],
          level: 'Emergency',
          rec: 'Contact local emergency services and seek immediate professional medical care.',
        });
      } else if (lowered.includes('chest') || lowered.includes('tight')) {
        setTriageResult({
          severity: 'HIGH',
          emergency: false,
          department: 'Cardiology',
          recommended_action: 'Urgent medical evaluation recommended.',
          reason: 'Potential exertional angina presentation.',
          immediate_guidance: [
            'Rest immediately in a comfortable seated position.',
            'Avoid any strenuous activity.',
            'Seek urgent clinical evaluation.',
          ],
          level: 'Urgent',
          rec: 'Potential exertional angina presentation. Immediate resting recommended. Schedule an urgent consult.',
        });
      } else {
        setTriageResult({
          severity: 'LOW',
          emergency: false,
          department: 'General Medicine',
          recommended_action: 'Continue regular monitoring and stay well hydrated.',
          reason: 'Mild presentation without critical indicators.',
          immediate_guidance: [
            'Rest and monitor symptoms.',
            'Maintain normal hydration if able.',
            'Seek medical evaluation if symptoms worsen.',
          ],
          level: 'Routine',
          rec: 'Mild presentation. Continue regular monitoring and stay well hydrated.',
        });
      }
    } finally {
      setAssessing(false);
    }
  };


  return (
    <>
      {/* 1. Emergency SOS & Live GPS Navigation Modal */}
      {showSOS && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="w-full max-w-md mx-auto bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2.5 mb-3">
              <span className="text-error font-bold flex items-center gap-1.5 text-sm">
                <span className="material-symbols-outlined text-[20px] animate-pulse">e911_emergency</span>
                CRITICAL EMERGENCY SOS
              </span>
              <button onClick={onCloseSOS} className="cursor-pointer text-gray-500 hover:text-gray-700">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {!activeSos ? (
              /* STEP 1: CHOOSE EMERGENCY MODE (DRIVE-IN vs AMBULANCE) */
              <div className="flex flex-col gap-3">
                {/* AI Immediate Safety Guidance Box */}
                {triageResult?.immediate_guidance && triageResult.immediate_guidance.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
                    <span className="font-bold text-amber-900 block uppercase text-[10px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">medical_services</span>
                      Immediate AI First-Aid Guidance
                    </span>
                    <ul className="space-y-1 text-amber-950 text-[11px]">
                      {triageResult.immediate_guidance.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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

                <div className="grid grid-cols-1 gap-2.5 pt-1">
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

                  {/* Option B: Request Ambulance */}
                  <button
                    type="button"
                    onClick={() => onTriggerSOS('ambulance', selectedHospitalId)}
                    className="p-4 bg-error text-white rounded-2xl flex items-center justify-between shadow-md hover:bg-error-container transition-all active:scale-[0.98] cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 animate-pulse">
                        <span className="material-symbols-outlined text-[26px]">ambulance</span>
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          <span>Request Ambulance (Dispatch)</span>
                        </div>
                        <p className="text-[11px] text-white/80 mt-0.5">
                          Dispatches GPS ALS Ambulance #ER-402 & reserves ER bed at {selectedHospital.name}.
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[22px] group-hover:translate-x-1 transition-transform">chevron_right</span>
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
                <div className="p-3 bg-primary-container/30 border border-primary/30 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-primary block uppercase text-[10px]">ER Bed Allotment Confirmed</span>
                    <strong className="text-on-surface text-sm">{activeSos.bedNo} Reserved</strong>
                  </div>
                  <span className="px-2 py-1 rounded bg-primary text-white font-bold text-[10px]">
                    1 ER Bed Allotted
                  </span>
                </div>

                {/* Doctor Intake Status Banner */}
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  activeSos.status === 'accepted'
                    ? 'bg-green-100 text-green-900 border border-green-300'
                    : activeSos.status === 'redirected'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-blue-50 text-blue-900 border border-blue-200'
                }`}>
                  <span className="material-symbols-outlined text-[20px] animate-pulse">
                    {activeSos.status === 'accepted' ? 'check_circle' : activeSos.status === 'redirected' ? 'alt_route' : 'local_hospital'}
                  </span>
                  <div>
                    {activeSos.status === 'en-route' && (
                      <p>Patient En-Route • ER Bed Allotted • Awaiting Doctor Confirmation</p>
                    )}
                    {activeSos.status === 'accepted' && (
                      <p>Confirmed by Dr. Shiv Gupta! Trauma Bay 1 & ER Bed Ready at Gate #2</p>
                    )}
                    {activeSos.status === 'redirected' && (
                      <p>Redirected to {activeSos.redirectedHospitalName} • New ER Bed Allotted!</p>
                    )}
                  </div>
                </div>

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
                    <path d="M 40 120 L 120 120 L 120 40 L 280 40 L 280 90" stroke="#10b981" strokeWidth="5" strokeDasharray="8 4" className="animate-pulse" />
                    {/* User Dot */}
                    <circle cx="40" cy="120" r="8" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                    {/* Hospital Pin */}
                    <circle cx="280" cy="90" r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                  </svg>

                  {/* Top Stats Overlay */}
                  <div className="relative z-10 flex justify-between items-center bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Live GPS Route</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span>1.8 km</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">6 Mins Est.</span>
                    </div>
                  </div>

                  {/* Destination Info Overlay */}
                  <div className="relative z-10 bg-slate-800/90 backdrop-blur-md p-2.5 rounded-xl text-white text-xs border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase font-bold block">Destination</span>
                      <strong className="text-xs truncate block max-w-[220px]">
                        {activeSos.redirectedHospitalName || activeSos.hospitalName}
                      </strong>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">
                      CLEAR TRAFFIC
                    </span>
                  </div>
                </div>

                {/* Turn-by-Turn GPS Steps */}
                <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 text-xs space-y-2">
                  <span className="font-bold uppercase text-[10px] text-gray-500 block">Turn-by-Turn GPS Directions</span>
                  <div className="space-y-1.5 text-[11px]">
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
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onShowToast(`Calling ER Hotline: ${selectedHospital.phone}`)}
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
                <div className="w-14 h-14 rounded-full bg-error/20 text-error flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined text-[32px]">ambulance</span>
                </div>
                <div>
                  <h4 className="font-headline-md text-base font-bold text-error">ALS Ambulance Dispatched!</h4>
                  <p className="text-xs text-on-surface-variant max-w-[260px] mt-1">
                    Emergency response unit <strong>#ER-402</strong> is en route. <strong>{activeSos.bedNo}</strong> reserved at {activeSos.hospitalName}.
                  </p>
                </div>

                <div className="w-full bg-surface-container-low p-3 rounded-xl text-xs space-y-1 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Estimated Arrival:</span>
                    <strong className="text-error">6 Minutes</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reserved Bed:</span>
                    <strong className="text-primary">{activeSos.bedNo}</strong>
                  </div>
                </div>

                <div className="flex w-full gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => onShowToast('Calling Ambulance Driver...')}
                    className="flex-1 py-2.5 bg-error text-white font-bold text-xs uppercase rounded-xl cursor-pointer"
                  >
                    Call Driver
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

      {/* 2. AI Triage Bot Modal */}
      {showAITriage && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end p-0 sm:p-4">
          <div className="w-full max-w-md mx-auto bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">neurology</span>
                <div>
                  <h3 className="font-headline-md text-base font-bold text-on-surface">MediNexus AI Triage Bot</h3>
                  <span className="text-[10px] text-gray-500 font-mono font-medium">{locationStatus}</span>
                </div>
              </div>
              <button onClick={onCloseAITriage} className="cursor-pointer text-gray-500">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">

              <div className="space-y-2">
                <div className="p-3 bg-surface-container-low rounded-xl border border-primary/30 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[11px] text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">edit_note</span>
                      <span>Describe Symptoms (Speak or Type)</span>
                    </label>
                    
                    {/* Multilingual Voice Speech Language Selector */}
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">translate</span>
                      <select
                        value={selectedLang}
                        onChange={(e) => {
                          setSelectedLang(e.target.value);
                          onShowToast(`Speech Recognition set to ${e.target.options[e.target.selectedIndex].text}`);
                        }}
                        className="text-[10px] bg-white border border-gray-300 rounded-md px-1.5 py-0.5 font-medium text-on-surface outline-none cursor-pointer"
                      >
                        <option value="hi-IN">Hindi / हिंदी (hi-IN)</option>
                        <option value="en-IN">Hinglish / English (en-IN)</option>
                        <option value="en-US">English (en-US)</option>
                        <option value="bn-IN">Bengali / বাংলা (bn-IN)</option>
                        <option value="ta-IN">Tamil / தமிழ் (ta-IN)</option>
                        <option value="te-IN">Telugu / తెలుగు (te-IN)</option>
                      </select>
                    </div>
                  </div>

                  {/* Input box with embedded Start Mic button INSIDE the input box container */}
                  <div className="relative rounded-xl border border-gray-300 bg-white focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-inner">
                    <textarea
                      ref={symptomInputRef}
                      value={symptomText}
                      onChange={(e) => handleTextChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!assessing) {
                            handleAssessSymptoms();
                          }
                        }
                      }}
                      rows={3}
                      className="w-full p-3 pr-32 bg-transparent border-none outline-none text-xs text-on-surface resize-none placeholder:text-gray-400"
                      placeholder="Speak naturally into microphone (Hindi, Hinglish, English, etc.) or type here... (Press Enter to submit)"
                    />

                    {/* Embedded Start Mic Button INSIDE the Input Box */}
                    <button
                      type="button"
                      onClick={toggleVoiceListen}
                      title={isListening ? 'Pause Microphone' : 'Start Microphone'}
                      className={`absolute right-2 bottom-2.5 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs shadow-md transition-all cursor-pointer ${
                        isListening
                          ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isListening ? 'mic' : 'mic_none'}
                      </span>
                      <span>{isListening ? 'Stop Mic' : 'Start Mic'}</span>
                    </button>
                  </div>
                </div>

                {/* Multilingual Quick Voice & Symptom Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 pb-0.5 no-scrollbar text-[10px]">
                  <span className="text-gray-400 font-bold shrink-0">Multilingual Presets:</span>
                  
                  {/* Hindi Emergency */}
                  <button
                    type="button"
                    onClick={() => {
                      const text = 'मेरे पिता बेहोश हैं';
                      setSymptomText(text);
                      lastSpokenTextRef.current = text;
                      onShowToast('Hindi Voice Preset: "मेरे पिता बेहोश हैं"');
                      handleAssessSymptoms(text);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-red-100 text-red-800 font-bold shrink-0 hover:bg-red-200 cursor-pointer"
                  >
                    🎤 "मेरे पिता बेहोश हैं" (Hindi)
                  </button>

                  {/* Hinglish Emergency */}
                  <button
                    type="button"
                    onClick={() => {
                      const text = 'mere father unconscious hain';
                      setSymptomText(text);
                      lastSpokenTextRef.current = text;
                      onShowToast('Hinglish Voice Preset: "mere father unconscious hain"');
                      handleAssessSymptoms(text);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-red-100 text-red-800 font-bold shrink-0 hover:bg-red-200 cursor-pointer"
                  >
                    🎤 "mere father unconscious hain" (Hinglish)
                  </button>

                  {/* Hindi Breathing */}
                  <button
                    type="button"
                    onClick={() => {
                      const text = 'मेरे पापा को सांस लेने में बहुत दिक्कत हो रही है';
                      setSymptomText(text);
                      lastSpokenTextRef.current = text;
                      onShowToast('Hindi Voice Preset: "सांस लेने में दिक्कत"');
                      handleAssessSymptoms(text);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-bold shrink-0 hover:bg-amber-200 cursor-pointer"
                  >
                    🎤 "सांस लेने में दिक्कत" (Hindi)
                  </button>

                  {/* Hindi Low Severity */}
                  <button
                    type="button"
                    onClick={() => {
                      const text = 'मुझे आज सुबह से हल्का सिरदर्द है और कोई दूसरा लक्षण नहीं है';
                      setSymptomText(text);
                      lastSpokenTextRef.current = text;
                      onShowToast('Hindi Voice Preset: "हल्का सिरदर्द"');
                      handleAssessSymptoms(text);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-bold shrink-0 hover:bg-gray-200 cursor-pointer"
                  >
                    🎤 "हल्का सिरदर्द" (Hindi Routine)
                  </button>

                  {/* English Emergency */}
                  <button
                    type="button"
                    onClick={() => {
                      const text = 'My father is unconscious and not responding';
                      setSymptomText(text);
                      lastSpokenTextRef.current = text;
                      onShowToast('English Voice Preset: "My father is unconscious"');
                      handleAssessSymptoms(text);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-red-100 text-red-800 font-bold shrink-0 hover:bg-red-200 cursor-pointer"
                  >
                    🎤 "My father is unconscious" (English)
                  </button>
                </div>
              </div>

              <button
                type="button"
                id="ai-triage-analyze-btn"
                onClick={() => handleAssessSymptoms()}
                disabled={assessing}
                className="w-full py-2.5 bg-primary text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99] transition-transform"
              >
                {assessing ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    <span>Evaluating Symptoms with Clinical AI...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                    <span>Analyze with Clinical AI</span>
                  </>
                )}
              </button>

              {/* Structured AI-Assisted Preliminary Assessment Results */}
              {triageResult && (
                <div className="p-3 bg-surface-container-low rounded-xl border border-primary/20 space-y-2.5 animate-in fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <div>
                      <span className="font-bold text-on-surface block text-xs">AI-Assisted Preliminary Assessment</span>
                      <span className="text-[9px] text-gray-500">Not a clinical diagnosis • Evaluation aid</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      triageResult.level === 'Emergency'
                        ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                        : triageResult.level === 'Urgent'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {triageResult.severity || triageResult.level} Priority
                    </span>
                  </div>

                  {/* High Visibility Emergency Alert Box */}
                  {(triageResult.level === 'Emergency' || triageResult.emergency) && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-red-700">
                        <span className="material-symbols-outlined text-[18px] animate-pulse">e911_emergency</span>
                        CRITICAL EMERGENCY STATUS DETECTED
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Immediate professional medical attention is required. Please contact emergency services or proceed to the nearest emergency hospital immediately.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onCloseAITriage();
                          onTriggerSOS('ambulance', selectedHospitalId);
                        }}
                        className="w-full mt-1 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] uppercase rounded-lg shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">ambulance</span>
                        <span>Dispatch Emergency SOS Now</span>
                      </button>
                    </div>
                  )}

                  {/* Immediate Guidance Section */}
                  {triageResult.immediate_guidance && triageResult.immediate_guidance.length > 0 && (
                    <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl space-y-1">
                      <span className="font-bold text-amber-900 block uppercase text-[10px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">medical_services</span>
                        Immediate Guidance (Safety & First Aid)
                      </span>
                      <ul className="space-y-1 text-amber-950 text-[11px]">
                        {triageResult.immediate_guidance.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-600 font-bold text-xs">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-500 text-[10px] block font-medium">Department</span>
                      <strong className="text-primary font-bold">{triageResult.department || 'General Medicine'}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-500 text-[10px] block font-medium">Emergency Status</span>
                      <strong className={triageResult.emergency ? 'text-red-600 font-bold' : 'text-green-700 font-bold'}>
                        {triageResult.emergency ? 'YES • IMMEDIATE CARE' : 'NO • ROUTINE CARE'}
                      </strong>
                    </div>
                  </div>

                  {/* Recommended Action & Reason */}
                  <div className="space-y-1 text-[11px]">
                    <div>
                      <strong className="text-on-surface block text-[10px] font-bold uppercase text-gray-500">Recommended Action</strong>
                      <p className="text-on-surface-variant leading-relaxed">{triageResult.recommended_action || triageResult.rec}</p>
                    </div>
                    <div>
                      <strong className="text-on-surface block text-[10px] font-bold uppercase text-gray-500">AI Clinical Rationale</strong>
                      <p className="text-on-surface-variant leading-relaxed">{triageResult.reason}</p>
                    </div>
                  </div>

                  {/* Top Suitable Hospital */}
                  {triageResult.topHospital && (
                    <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold block uppercase">Recommended Facility</span>
                        <strong className="text-primary truncate max-w-[200px] block">{triageResult.topHospital.name}</strong>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold text-[10px]">
                        {triageResult.topHospital.dist || '1.8 km'} • {triageResult.topHospital.vacantBeds || 5} Beds Available
                      </span>
                    </div>
                  )}

                  {/* Primary Pathway Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onCompleteAssessment && pendingPathwayData) {
                        onCompleteAssessment(
                          pendingPathwayData.assessment,
                          pendingPathwayData.pathway,
                          pendingPathwayData.hospitals,
                          pendingPathwayData.doctors
                        );
                      } else {
                        onCloseAITriage();
                      }
                    }}
                    className={`w-full mt-2 py-2.5 font-bold text-xs uppercase rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] ${
                      triageResult.level === 'Emergency' || triageResult.emergency
                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                        : 'bg-primary hover:bg-primary/90 text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {triageResult.level === 'Emergency' || triageResult.emergency
                        ? 'e911_emergency'
                        : pendingPathwayData?.pathway?.next_step?.includes('VIDEO')
                        ? 'video_call'
                        : 'calendar_month'}
                    </span>
                    <span>
                      {triageResult.level === 'Emergency' || triageResult.emergency
                        ? 'Proceed to Emergency SOS & ER Bed'
                        : pendingPathwayData?.pathway?.next_step?.includes('VIDEO')
                        ? 'Proceed to Video Consultation'
                        : `Proceed to Book Doctor in ${triageResult.department || 'Department'}`}
                    </span>
                  </button>
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
                <p className="text-on-surface mt-0.5">Your visit with Dr. Shiv Gupta is scheduled for Sep 14 at 10:00 AM.</p>
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
    </>
  );
};
