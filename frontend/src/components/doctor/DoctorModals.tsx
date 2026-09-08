import React, { useState } from 'react';
import { Patient, Appointment, NotificationItem, Hospital, ActiveSosState } from '../../types';

interface DoctorModalsProps {
  selectedPatient: Patient | null;
  onClosePatient: () => void;
  aiSummaryPatient: Patient | null;
  onCloseAISummary: () => void;
  activeConsultationApt: Appointment | null;
  onCloseConsultation: () => void;
  onSaveConsultation: (aptId: string) => void;

  showEmergencyModal: boolean;
  onCloseEmergency: () => void;
  onAcceptEmergency: () => void;

  // Enhanced SOS Props
  activeSos?: ActiveSosState | null;
  hospitals?: Hospital[];
  onAcceptEmergencyIntake?: () => void;
  onRedirectEmergencyPatient?: (targetHospitalId: string) => void;

  showEHRModal: boolean;
  onCloseEHR: () => void;
  selectedNotification: NotificationItem | null;
  onCloseNotification: () => void;
  rescheduleApt: Appointment | null;
  onCloseReschedule: () => void;
  onConfirmReschedule: (aptId: string, date: string, time: string) => void;
  cancelApt: Appointment | null;
  onCloseCancel: () => void;
  onConfirmCancel: (aptId: string) => void;
  onOpenAISummaryFromPatient: (patient: Patient) => void;
  onStartConsultFromPatient: (patient: Patient) => void;
}

export const DoctorModals: React.FC<DoctorModalsProps> = ({
  selectedPatient,
  onClosePatient,
  aiSummaryPatient,
  onCloseAISummary,
  activeConsultationApt,
  onCloseConsultation,
  onSaveConsultation,
  showEmergencyModal,
  onCloseEmergency,
  onAcceptEmergency,
  activeSos,
  hospitals = [],
  onAcceptEmergencyIntake,
  onRedirectEmergencyPatient,
  showEHRModal,
  onCloseEHR,
  selectedNotification,
  onCloseNotification,
  rescheduleApt,
  onCloseReschedule,
  onConfirmReschedule,
  cancelApt,
  onCloseCancel,
  onConfirmCancel,
  onOpenAISummaryFromPatient,
  onStartConsultFromPatient,
}) => {
  const [reschedDate, setReschedDate] = useState('Mon 24');
  const [reschedTime, setReschedTime] = useState('09:00 AM');
  const [notes, setNotes] = useState('Pt reports retrosternal tightness on exertion. Resting ECG normal sinus rhythm.');
  const [plan, setPlan] = useState('Titrate beta-blocker. Schedule 24hr Holter monitoring within 48 hours.');

  // Redirection state
  const [showRedirectPicker, setShowRedirectPicker] = useState(false);
  const [selectedPartnerHospitalId, setSelectedPartnerHospitalId] = useState(hospitals[1]?.id || 'hosp-2');

  const partnerHospitals = hospitals.filter((h) => h.id !== 'hosp-1');

  return (
    <>
      {/* 1. Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end p-0 sm:p-4">
          <div className="w-full max-w-lg mx-auto bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-surface-container">
              <div>
                <h3 className="font-headline-md text-lg font-bold text-on-surface">{selectedPatient.name}</h3>
                <span className="font-data-mono text-xs text-on-surface-variant">{selectedPatient.mrn} • {selectedPatient.age}y ({selectedPatient.gender})</span>
              </div>
              <button onClick={onClosePatient} className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 text-center">
              <div className="bg-surface-container-low p-2 rounded-xl">
                <span className="font-label-caps text-[9px] uppercase text-on-surface-variant block">Blood</span>
                <strong className="text-sm font-data-mono">{selectedPatient.blood}</strong>
              </div>
              <div className="bg-surface-container-low p-2 rounded-xl">
                <span className="font-label-caps text-[9px] uppercase text-on-surface-variant block">Status</span>
                <strong className="text-xs text-primary font-bold">{selectedPatient.status}</strong>
              </div>
              <div className="bg-surface-container-low p-2 rounded-xl">
                <span className="font-label-caps text-[9px] uppercase text-on-surface-variant block">Heart Rate</span>
                <strong className="text-sm font-data-mono">{selectedPatient.heartRate || '74 bpm'}</strong>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-error-container/40 p-2.5 rounded-xl border border-error/20">
                <span className="font-bold text-error uppercase block text-[10px]">Allergies</span>
                <p className="text-on-surface font-semibold">{selectedPatient.allergies}</p>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-xl">
                <span className="font-bold text-on-surface-variant uppercase block text-[10px]">Current Medications</span>
                <p className="text-on-surface">{selectedPatient.meds}</p>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-xl">
                <span className="font-bold text-on-surface-variant uppercase block text-[10px]">Medical History</span>
                <p className="text-on-surface">{selectedPatient.history}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  onClosePatient();
                  onOpenAISummaryFromPatient(selectedPatient);
                }}
                className="flex-1 py-2.5 bg-secondary-container text-on-secondary-container font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">neurology</span>
                <span>AI Summary</span>
              </button>
              <button
                onClick={() => {
                  onClosePatient();
                  onStartConsultFromPatient(selectedPatient);
                }}
                className="flex-1 py-2.5 bg-primary text-white font-bold text-xs uppercase rounded-xl shadow-sm cursor-pointer hover:bg-primary-container"
              >
                Start Consult
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. AI Summary Modal */}
      {aiSummaryPatient && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-primary flex items-center gap-1 text-sm">
                <span className="material-symbols-outlined text-[18px]">neurology</span>
                AI Patient Briefing
              </span>
              <button onClick={onCloseAISummary} className="cursor-pointer text-gray-500">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <strong className="text-sm">{aiSummaryPatient.name} ({aiSummaryPatient.age}{aiSummaryPatient.gender.slice(0, 1)})</strong>
                <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-primary text-white">Priority {aiSummaryPatient.priority}</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl">
                <span className="font-bold text-primary block text-[10px] uppercase mb-0.5">Reason for Visit</span>
                <p>{aiSummaryPatient.reason}</p>
              </div>
              <div className="p-3 bg-secondary-container/40 rounded-xl">
                <span className="font-bold text-secondary block text-[10px] uppercase mb-0.5">Clinical Recommendation</span>
                <p>{aiSummaryPatient.recommendation}</p>
              </div>
            </div>

            <button onClick={onCloseAISummary} className="w-full py-3 bg-primary text-white font-bold text-xs uppercase rounded-xl cursor-pointer">
              Close AI Summary
            </button>
          </div>
        </div>
      )}

      {/* 3. In-Session Consultation Modal */}
      {activeConsultationApt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col justify-end p-0 sm:p-4">
          <div className="w-full max-w-lg mx-auto bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase block font-label-caps">In-Session Consultation</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">{activeConsultationApt.name}</h3>
              </div>
              <button onClick={onCloseConsultation} className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="py-3 space-y-3 text-xs">
              <div>
                <label className="font-bold text-on-surface-variant uppercase block text-[10px] mb-1">Clinical Observations</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-on-surface-variant uppercase block text-[10px] mb-1">Treatment Plan & Prescription</label>
                <textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onSaveConsultation(activeConsultationApt.id)}
                  className="flex-1 py-3 bg-primary text-white font-bold text-xs uppercase rounded-xl shadow-sm cursor-pointer hover:bg-primary-container"
                >
                  Sign & Archive Encounter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CRITICAL EMERGENCY SOS TRIAGE ALERT MODAL */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-error font-bold flex items-center gap-1.5 text-sm">
                <span className="material-symbols-outlined text-[20px] animate-pulse">e911_emergency</span>
                CRITICAL INCOMING PATIENT SOS
              </span>
              <button onClick={onCloseEmergency} className="cursor-pointer text-gray-500">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="text-xs space-y-2.5">
              {/* Patient SOS Info Banner */}
              <div className="p-3 bg-error-container/30 border border-error/20 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-sm font-bold text-on-surface">
                    {activeSos?.patientName || 'Ananya Sharma'} (29F)
                  </strong>
                  <span className="px-2 py-0.5 rounded bg-error text-white font-bold text-[10px] uppercase">
                    {activeSos?.mode === 'drive-in' ? '🚗 Drive-In Transport' : '🚑 Ambulance'}
                  </span>
                </div>
                <p className="text-error font-bold text-[11px] mt-0.5">
                  CRITICAL SOS: Severe chest discomfort & dyspnea on arrival.
                </p>
                <div className="flex justify-between items-center text-[11px] pt-1 border-t border-error/10 text-on-surface-variant font-mono">
                  <span>Allotted Bed: <strong className="text-primary">{activeSos?.bedNo || 'ER Bed #04'}</strong></span>
                  <span>Hospital: <strong className="text-on-surface">Apollo Hospitals ER</strong></span>
                </div>
              </div>

              {!showRedirectPicker ? (
                <div className="space-y-2">
                  <p className="text-on-surface-variant text-[11px]">
                    Choose action for this incoming severe emergency patient:
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    {/* Action 1: Accept Intake */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onAcceptEmergencyIntake) {
                          onAcceptEmergencyIntake();
                        } else {
                          onAcceptEmergency();
                        }
                      }}
                      className="w-full py-3 bg-primary text-white font-bold text-xs uppercase rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer hover:bg-primary-container"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>Take In & Prepare Trauma Bay 1</span>
                    </button>

                    {/* Action 2: Redirect to Partner Hospital */}
                    <button
                      type="button"
                      onClick={() => setShowRedirectPicker(true)}
                      className="w-full py-2.5 bg-surface-container hover:bg-amber-100 hover:text-amber-900 font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">alt_route</span>
                      <span>Redirect / Pass to Partner Hospital</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* REDIRECT PARTNER HOSPITAL PICKER */
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-on-surface flex items-center gap-1">
                      <span className="material-symbols-outlined text-amber-600 text-[18px]">alt_route</span>
                      Select Partner Hospital for Patient Transfer
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowRedirectPicker(false)}
                      className="text-[11px] text-gray-500 hover:underline"
                    >
                      Back
                    </button>
                  </div>

                  <div className="space-y-2">
                    {partnerHospitals.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => setSelectedPartnerHospitalId(h.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          selectedPartnerHospitalId === h.id
                            ? 'border-primary bg-primary-container/20 font-bold shadow-xs'
                            : 'border-outline-variant/30 bg-surface-container-lowest'
                        }`}
                      >
                        <div>
                          <strong className="text-xs text-on-surface block">{h.name}</strong>
                          <span className="text-[10px] text-on-surface-variant block">{h.address}</span>
                          <span className="text-[10px] text-primary font-bold mt-0.5 block">{h.vacantBeds} Vacant ER Beds</span>
                        </div>
                        <input
                          type="radio"
                          name="partnerHospital"
                          checked={selectedPartnerHospitalId === h.id}
                          onChange={() => setSelectedPartnerHospitalId(h.id)}
                          className="w-4 h-4 text-primary"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onRedirectEmergencyPatient) {
                        onRedirectEmergencyPatient(selectedPartnerHospitalId);
                      }
                      setShowRedirectPicker(false);
                    }}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase rounded-xl shadow-sm cursor-pointer mt-1"
                  >
                    Confirm Reroute & Pass Patient
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. EHR Modal */}
      {showEHRModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-headline-md text-sm font-bold">EHR: Ananya Sharma (29F)</h3>
              <button onClick={onCloseEHR} className="cursor-pointer text-gray-500">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="text-xs space-y-2 text-on-surface">
              <div className="bg-surface-container-low p-2.5 rounded-lg">
                <span className="font-bold text-gray-500 uppercase block text-[10px]">Medications</span>
                <p>Propranolol 10mg PRN, Levothyroxine 50mcg</p>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-lg">
                <span className="font-bold text-gray-500 uppercase block text-[10px]">Recent Lab Diagnostic</span>
                <p>Comprehensive Lipid Profile & 12-Lead ECG Trace (Apollo Diagnostics)</p>
              </div>
            </div>
            <button onClick={onCloseEHR} className="w-full py-2.5 bg-primary text-white font-bold text-xs uppercase rounded-xl cursor-pointer">
              Close EHR
            </button>
          </div>
        </div>
      )}
    </>
  );
};
