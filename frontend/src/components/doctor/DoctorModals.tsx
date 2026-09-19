import React, { useState, useEffect } from 'react';
import { Patient, Appointment, NotificationItem, Hospital, ActiveSosState } from '../../types';
import { fetchPatientReportsForDoctorApi, API_BASE_URL } from '../../services/api';

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
  onResolveEmergency?: () => void;

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

  showScheduleModal?: boolean;
  onCloseScheduleModal?: () => void;
  patients?: Patient[];
  onConfirmScheduleAppointment?: (data: {
    patientId: string;
    date: string;
    time: string;
    modality: string;
    reason: string;
    clinicalNotes?: string;
  }) => Promise<void>;
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
  onResolveEmergency,
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
  showScheduleModal = false,
  onCloseScheduleModal,
  patients = [],
  onConfirmScheduleAppointment,
}) => {
  const [reschedDate, setReschedDate] = useState('Mon 24');
  const [reschedTime, setReschedTime] = useState('09:00 AM');
  const [notes, setNotes] = useState('Pt reports retrosternal tightness on exertion. Resting ECG normal sinus rhythm.');
  const [plan, setPlan] = useState('Titrate beta-blocker. Schedule 24hr Holter monitoring within 48 hours.');

  // Schedule Appointment Form State
  const todayISO = new Date().toISOString().split('T')[0];
  const [schedPatientId, setSchedPatientId] = useState<string>('');
  const [schedDate, setSchedDate] = useState<string>(todayISO);
  const [schedTime, setSchedTime] = useState<string>('10:00 AM');
  const [schedModality, setSchedModality] = useState<string>('OPD Consult');
  const [schedReason, setSchedReason] = useState<string>('');
  const [schedNotes, setSchedNotes] = useState<string>('');
  const [schedError, setSchedError] = useState<string | null>(null);
  const [schedSubmitting, setSchedSubmitting] = useState<boolean>(false);

  // Redirection state
  const [showRedirectPicker, setShowRedirectPicker] = useState(false);
  const partnerHospitals = hospitals.filter((h) => h.id !== 'hsp-001' && h.id !== 'hosp-1');
  const [selectedPartnerHospitalId, setSelectedPartnerHospitalId] = useState(
    partnerHospitals[0]?.id || hospitals[1]?.id || 'hosp-2'
  );

  // Reports state
  const [patientReports, setPatientReports] = useState<any[]>([]);
  const [searchReportQuery, setSearchReportQuery] = useState('');

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientReportsForDoctorApi(selectedPatient.id).then((data) => {
        setPatientReports(data || []);
      });
    } else {
      setPatientReports([]);
      setSearchReportQuery('');
    }
  }, [selectedPatient]);

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
                <span className="font-bold text-on-surface-variant uppercase block text-[10px]">Past & Current Medications</span>
                <p className="text-on-surface">{selectedPatient.meds}</p>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-xl">
                <span className="font-bold text-on-surface-variant uppercase block text-[10px]">Medical History</span>
                <p className="text-on-surface">{selectedPatient.history}</p>
              </div>
              
              {/* Medical Reports & Vault Section */}
              <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col gap-2">
                <span className="font-bold text-on-surface-variant uppercase block text-[10px]">Medical Reports & Vault</span>
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchReportQuery}
                  onChange={(e) => setSearchReportQuery(e.target.value)}
                  className="w-full p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-xs outline-none focus:border-primary"
                />
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {patientReports.filter((r) => r.fileName.toLowerCase().includes(searchReportQuery.toLowerCase())).length === 0 && (
                    <div className="text-center p-2 text-[10px] text-on-surface-variant">No reports found.</div>
                  )}
                  {patientReports
                    .filter((r) => r.fileName.toLowerCase().includes(searchReportQuery.toLowerCase()))
                    .map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[16px]">
                            {r.fileType?.includes('pdf') ? 'picture_as_pdf' : 'image'}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-on-surface truncate max-w-[150px] sm:max-w-[200px]" title={r.fileName}>{r.fileName}</span>
                            <span className="text-[9px] text-on-surface-variant">
                              {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString() : ''} • {(r.fileSize / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                        <a
                          href={`${API_BASE_URL.replace('/api', '')}${r.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-primary hover:bg-surface-container rounded-full"
                          title="View/Download"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                        </a>
                      </div>
                    ))}
                </div>
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
                    {activeSos?.patientName || 'Emergency Patient'} ({activeSos?.age || '29'}{activeSos?.gender?.charAt(0) || 'M'})
                  </strong>
                  <span className="px-2 py-0.5 rounded bg-error text-white font-bold text-[10px] uppercase">
                    {activeSos?.mode === 'drive-in' ? '🚗 Drive-In Transport' : '🚑 Ambulance'}
                  </span>
                </div>
                <p className="text-error font-bold text-[11px] mt-0.5">
                  CRITICAL SOS: {activeSos?.complaint || 'Severe emergency symptoms on arrival.'}
                </p>
                <div className="flex justify-between items-center text-[11px] pt-1 border-t border-error/10 text-on-surface-variant font-mono">
                  <span>Allotted Bed: <strong className="text-primary">{activeSos?.bedNo || 'ER Bed #04'}</strong></span>
                  <span>Hospital: <strong className="text-on-surface">{activeSos?.hospitalName || 'Apollo Hospitals ER'}</strong></span>
                </div>
              </div>

              {!showRedirectPicker ? (
                <div className="space-y-2">
                  <p className="text-on-surface-variant text-[11px]">
                    Choose action for this incoming severe emergency patient:
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    {activeSos?.status === 'accepted' ? (
                      <>
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2 text-xs font-medium">
                          <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                          <span>Patient Accepted • Trauma Bay 1 & ER Bed #04 Allotted</span>
                        </div>
                        {/* Resolve Case */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onResolveEmergency) onResolveEmergency();
                            else onCloseEmergency();
                          }}
                          className="w-full py-3 bg-emerald-700 text-white font-bold text-xs uppercase rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-800 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">task_alt</span>
                          <span>Mark Case Resolved / Discharge ER Bed</span>
                        </button>
                      </>
                    ) : (
                      <>
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

                        {/* Action 3: Dismiss/End Case */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onResolveEmergency) onResolveEmergency();
                            else onCloseEmergency();
                          }}
                          className="w-full py-2 bg-surface-container-low hover:bg-error/10 hover:text-error text-gray-600 font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors border border-outline-variant/30"
                        >
                          <span className="material-symbols-outlined text-[16px]">cancel</span>
                          <span>Dismiss / Close Emergency Case</span>
                        </button>
                      </>
                    )}
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

      {/* 6. Reschedule Appointment Modal */}
      {rescheduleApt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div>
                <span className="font-label-caps text-[10px] text-primary uppercase font-bold tracking-wider">Reschedule Appointment</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">{rescheduleApt.name}</h3>
              </div>
              <button onClick={onCloseReschedule} className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const d = (form.elements.namedItem('resched_date') as HTMLInputElement).value;
                const t = (form.elements.namedItem('resched_time') as HTMLInputElement).value;
                if (!d || !t) return;
                onConfirmReschedule(rescheduleApt.id, d, t);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-on-surface-variant uppercase block text-[10px] mb-1">New Appointment Date</label>
                <input
                  type="date"
                  name="resched_date"
                  defaultValue={rescheduleApt.date || '2026-09-25'}
                  required
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface font-mono text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-on-surface-variant uppercase block text-[10px] mb-1">New Appointment Time</label>
                <input
                  type="text"
                  name="resched_time"
                  defaultValue={rescheduleApt.time || '10:30 AM'}
                  placeholder="e.g. 11:15 AM"
                  required
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface font-mono text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onCloseReschedule}
                  className="flex-1 py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs uppercase rounded-xl cursor-pointer hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-white font-bold text-xs uppercase rounded-xl shadow-sm cursor-pointer hover:bg-primary-container"
                >
                  Save New Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Cancel Appointment Modal */}
      {cancelApt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in border border-error/20">
            <div className="flex items-center gap-3 text-error">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <div>
                <h3 className="font-headline-md text-base font-bold">Cancel Appointment</h3>
                <p className="text-xs text-on-surface-variant">Confirm status change</p>
              </div>
            </div>

            <p className="text-xs text-on-surface">
              Are you sure you want to cancel the appointment for <strong className="font-bold text-on-surface">{cancelApt.name}</strong> ({cancelApt.date || 'Today'}, {cancelApt.time})? The record will be updated to CANCELLED in PostgreSQL while preserving clinical history.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onCloseCancel}
                className="flex-1 py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs uppercase rounded-xl cursor-pointer hover:bg-surface-container-high"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => onConfirmCancel(cancelApt.id)}
                className="flex-1 py-2.5 bg-error text-white font-bold text-xs uppercase rounded-xl shadow-sm cursor-pointer hover:bg-red-700"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Schedule New Appointment Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">event_available</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-base font-bold text-on-surface">Schedule New Appointment</h3>
                  <p className="text-xs text-on-surface-variant">Select patient & appointment details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSchedError(null);
                  if (onCloseScheduleModal) onCloseScheduleModal();
                }}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {schedError && (
              <div className="p-3 bg-error-container text-on-error-container rounded-xl text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{schedError}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSchedError(null);
                if (!schedPatientId) {
                  setSchedError('Please select a patient.');
                  return;
                }
                if (!schedDate) {
                  setSchedError('Please select an appointment date.');
                  return;
                }
                if (schedDate < todayISO) {
                  setSchedError('Appointment date cannot be in the past.');
                  return;
                }
                if (!schedTime) {
                  setSchedError('Please select an appointment time.');
                  return;
                }
                if (!schedReason.trim()) {
                  setSchedError('Please enter the appointment reason/complaint.');
                  return;
                }

                if (onConfirmScheduleAppointment) {
                  setSchedSubmitting(true);
                  try {
                    await onConfirmScheduleAppointment({
                      patientId: schedPatientId,
                      date: schedDate,
                      time: schedTime,
                      modality: schedModality,
                      reason: schedReason.trim(),
                      clinicalNotes: schedNotes.trim() || undefined,
                    });
                    setSchedPatientId('');
                    setSchedReason('');
                    setSchedNotes('');
                    if (onCloseScheduleModal) onCloseScheduleModal();
                  } catch (err: any) {
                    setSchedError(err.message || 'Failed to schedule appointment.');
                  } finally {
                    setSchedSubmitting(false);
                  }
                }
              }}
              className="flex flex-col gap-3"
            >
              {/* Select Patient */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Select Patient <span className="text-error">*</span>
                </label>
                <select
                  value={schedPatientId}
                  onChange={(e) => setSchedPatientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface-container border border-outline-variant/50 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="">-- Choose Registered Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn} • {p.age}y {p.gender})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Date <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    min={todayISO}
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface-container border border-outline-variant/50 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Time <span className="text-error">*</span>
                  </label>
                  <select
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface-container border border-outline-variant/50 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                  </select>
                </div>
              </div>

              {/* Modality */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Appointment Type / Modality</label>
                <select
                  value={schedModality}
                  onChange={(e) => setSchedModality(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container border border-outline-variant/50 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="OPD Consult">OPD Consult</option>
                  <option value="In-person">In-person</option>
                  <option value="Tele-consult">Tele-consult</option>
                  <option value="Room 304 Consult">Room 304 Consult</option>
                  <option value="Follow-up">Follow-up</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Reason / Complaint <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hypertension & Autonomic Review"
                  value={schedReason}
                  onChange={(e) => setSchedReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface-container border border-outline-variant/50 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Clinical Notes (Optional) */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Clinical Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Initial clinical brief or instructions..."
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container border border-outline-variant/50 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSchedError(null);
                    if (onCloseScheduleModal) onCloseScheduleModal();
                  }}
                  disabled={schedSubmitting}
                  className="flex-1 py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs uppercase rounded-xl cursor-pointer hover:bg-surface-container-high disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedSubmitting}
                  className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs uppercase rounded-xl shadow-sm cursor-pointer hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {schedSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                      <span>Save Appointment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
