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
  onTriggerSOS: (mode: 'drive-in' | 'ambulance') => void;
  onResetSOS: () => void;
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
}) => {
  const [symptomText, setSymptomText] = useState('Feeling mild tightness in chest after climbing stairs.');
  const [triageResult, setTriageResult] = useState<null | { level: 'Routine' | 'Urgent' | 'Emergency'; rec: string }>(null);
  const [assessing, setAssessing] = useState(false);

  const nearestHospital = hospitals[0] || {
    name: 'Apollo Hospitals, New Delhi',
    dist: '1.8 km',
    time: '6 mins',
    phone: '+91 11 2692 5858',
    vacantBeds: 4,
    address: 'Sarita Vihar, Mathura Road, New Delhi',
  };

  const handleAssessSymptoms = () => {
    setAssessing(true);
    setTimeout(() => {
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
    }, 800);
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
                <p className="text-xs text-on-surface leading-relaxed">
                  Select emergency response mode. Upon selection, an emergency ER bed will be <strong>automatically allotted</strong> at the nearest hospital and doctor station will be notified.
                </p>

                {/* Nearest Hospital ER Status */}
                <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">local_hospital</span>
                      {nearestHospital.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-bold text-[10px]">
                      {nearestHospital.vacantBeds} Vacant Beds Available
                    </span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant flex justify-between mt-1">
                    <span>{nearestHospital.address}</span>
                    <strong className="text-on-surface">{nearestHospital.dist} away</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {/* Option A: Drive-In */}
                  <button
                    type="button"
                    onClick={() => onTriggerSOS('drive-in')}
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
                          Shows live turn-by-turn map navigation & reserves <strong>ER Bed #04</strong> immediately.
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[22px] group-hover:translate-x-1 transition-transform">chevron_right</span>
                  </button>

                  {/* Option B: Request Ambulance */}
                  <button
                    type="button"
                    onClick={() => onTriggerSOS('ambulance')}
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
                          Dispatches GPS ALS Ambulance #ER-402 to your location & reserves ER bed.
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
                    onClick={() => onShowToast(`Calling ER Hotline: ${nearestHospital.phone}`)}
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
              <label className="font-bold uppercase text-[10px] text-gray-500 block">Describe What You Are Feeling</label>
              <textarea
                value={symptomText}
                onChange={(e) => setSymptomText(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs"
                placeholder="E.g. Headache since morning, slight chest pressure..."
              />

              <button
                onClick={handleAssessSymptoms}
                disabled={assessing}
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
                <div className="p-3 bg-surface-container-low rounded-xl border border-primary/20 space-y-1.5 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-on-surface">AI Risk Assessment</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                      triageResult.level === 'Urgent' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {triageResult.level} Priority
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-[11px] leading-relaxed">{triageResult.rec}</p>
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
    </>
  );
};
