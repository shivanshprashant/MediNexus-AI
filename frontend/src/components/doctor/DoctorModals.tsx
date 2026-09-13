import React, { useState, useEffect, useMemo } from 'react';
import { Patient, Appointment, NotificationItem, Hospital, ActiveSosState, MedicalRecord } from '../../types';

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
  medicalRecords?: MedicalRecord[];
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
  medicalRecords = [],
}) => {
  const [reschedDate, setReschedDate] = useState('Tomorrow, Sep 13');
  const [reschedTime, setReschedTime] = useState('09:00 AM');
  const [notes, setNotes] = useState('Pt reports retrosternal tightness on exertion. Resting ECG normal sinus rhythm.');
  const [plan, setPlan] = useState('Titrate beta-blocker. Schedule 24hr Holter monitoring within 48 hours.');

  useEffect(() => {
    if (rescheduleApt) {
      setReschedDate(rescheduleApt.dateLabel || rescheduleApt.date || 'Tomorrow, Sep 13');
      setReschedTime(rescheduleApt.time || '09:00 AM');
    }
  }, [rescheduleApt]);

  // Redirection state
  const [showRedirectPicker, setShowRedirectPicker] = useState(false);
  const [selectedPartnerHospitalId, setSelectedPartnerHospitalId] = useState(hospitals[1]?.id || 'hosp-2');
  const [recordSearch, setRecordSearch] = useState('');
  const [showRecordsSection, setShowRecordsSection] = useState(false);

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

            {/* Medical Records Section */}
            <div className="pt-3">
              <button
                onClick={() => { setShowRecordsSection(!showRecordsSection); setRecordSearch(''); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                  showRecordsSection
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">folder_open</span>
                  <span className="font-bold text-xs uppercase">Medical Records</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    showRecordsSection ? 'bg-primary/20 text-primary' : 'bg-black/10 text-on-surface-variant'
                  }`}>
                    {medicalRecords.filter((r) => r.patientName === selectedPatient.name || r.patientId === selectedPatient.id).length}
                  </span>
                </div>
                <span className={`material-symbols-outlined text-[18px] transition-transform ${showRecordsSection ? 'rotate-180' : ''}`}>expand_more</span>
              </button>

              {showRecordsSection && (() => {
                const patientRecs = medicalRecords.filter((r) => r.patientName === selectedPatient.name || r.patientId === selectedPatient.id);
                const q = recordSearch.toLowerCase();
                const filteredRecs = q
                  ? patientRecs.filter(
                      (r) =>
                        r.title.toLowerCase().includes(q) ||
                        r.category.toLowerCase().includes(q) ||
                        r.doctor.toLowerCase().includes(q) ||
                        r.department.toLowerCase().includes(q) ||
                        r.tags.some((t) => t.toLowerCase().includes(q)) ||
                        r.notes.toLowerCase().includes(q)
                    )
                  : patientRecs;

                const catColors: Record<string, string> = {
                  'Lab Report': 'bg-blue-100 text-blue-700',
                  'Imaging': 'bg-purple-100 text-purple-700',
                  'Prescription': 'bg-emerald-100 text-emerald-700',
                  'Discharge Summary': 'bg-amber-100 text-amber-700',
                  'Surgical Note': 'bg-red-100 text-red-700',
                  'Follow-Up Note': 'bg-teal-100 text-teal-700',
                  'Other': 'bg-gray-100 text-gray-700',
                };
                const fileIcons: Record<string, { icon: string; color: string }> = {
                  pdf: { icon: 'picture_as_pdf', color: 'text-red-500' },
                  image: { icon: 'image', color: 'text-blue-500' },
                  dicom: { icon: 'radiology', color: 'text-purple-500' },
                  doc: { icon: 'description', color: 'text-teal-500' },
                };

                return (
                  <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Search */}
                    <div className="relative mb-2">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">search</span>
                      <input
                        type="text"
                        value={recordSearch}
                        onChange={(e) => setRecordSearch(e.target.value)}
                        placeholder="Search records, reports, tags..."
                        className="w-full pl-8 pr-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-[12px] text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    {/* Records List */}
                    <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto">
                      {filteredRecs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((rec) => {
                        const fi = fileIcons[rec.fileType] || fileIcons.doc;
                        const cc = catColors[rec.category] || catColors.Other;
                        return (
                          <div key={rec.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/20 hover:bg-surface-container transition-colors">
                            <div className="w-8 h-8 rounded-md bg-surface-container-high flex items-center justify-center shrink-0">
                              <span className={`material-symbols-outlined text-[18px] ${fi.color}`}>{fi.icon}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[12px] text-on-surface font-semibold leading-tight truncate">{rec.title}</div>
                              <div className="text-[10px] text-on-surface-variant font-data-mono mt-0.5">{rec.date} • {rec.doctor}</div>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase whitespace-nowrap shrink-0 ${cc}`}>
                              {rec.category}
                            </span>
                          </div>
                        );
                      })}

                      {filteredRecs.length === 0 && (
                        <div className="p-4 text-center">
                          <span className="material-symbols-outlined text-[24px] text-on-surface-variant">search_off</span>
                          <p className="text-[11px] text-on-surface-variant mt-1">
                            {q ? `No records matching "${recordSearch}"` : 'No medical records available for this patient.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
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

      {/* 6. RESCHEDULE APPOINTMENT MODAL */}
      {rescheduleApt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="w-full max-w-md mx-auto bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-surface-container">
              <div>
                <span className="font-label-caps text-[10px] uppercase font-bold text-primary">Appointment Management</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">Reschedule Appointment</h3>
              </div>
              <button onClick={onCloseReschedule} className="p-1 rounded-full text-gray-500 hover:bg-surface-container cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bg-surface-container-low p-3 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-on-surface text-sm">{rescheduleApt.name || 'Patient'}</div>
              <div className="text-on-surface-variant text-[11px] font-mono">{rescheduleApt.mrn || 'MRN-N/A'} • {rescheduleApt.department || 'Cardiology'}</div>
              <div className="text-primary font-semibold text-[11px] pt-1">
                Current Time: {rescheduleApt.dateLabel || rescheduleApt.date || 'Today'}, {rescheduleApt.time}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold uppercase text-[10px] text-gray-600 block mb-1">Select New Date</label>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {[
                    'Tomorrow, Sep 13',
                    'Mon, Sep 14',
                    'Tue, Sep 15',
                    'Wed, Sep 16',
                    'Thu, Sep 17',
                    'Fri, Sep 18',
                  ].map((dStr) => (
                    <button
                      key={dStr}
                      type="button"
                      onClick={() => setReschedDate(dStr)}
                      className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer truncate ${
                        reschedDate === dStr
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-on-surface border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {dStr}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={reschedDate}
                  onChange={(e) => setReschedDate(e.target.value)}
                  placeholder="Or enter date (e.g. Thu, Nov 02)"
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[10px] text-gray-600 block mb-1">Select New Time Slot</label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'].map((tStr) => (
                    <button
                      key={tStr}
                      type="button"
                      onClick={() => setReschedTime(tStr)}
                      className={`py-2 px-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        reschedTime === tStr
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-on-surface border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {tStr}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={reschedTime}
                  onChange={(e) => setReschedTime(e.target.value)}
                  placeholder="Or enter time (e.g. 03:15 PM)"
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 text-xs font-semibold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onConfirmReschedule(rescheduleApt.id, reschedDate, reschedTime)}
                  className="flex-1 py-3 bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  Confirm Reschedule
                </button>
                <button
                  type="button"
                  onClick={onCloseReschedule}
                  className="py-3 px-4 bg-surface-container text-on-surface font-bold text-xs uppercase rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. CANCEL APPOINTMENT MODAL */}
      {cancelApt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-headline-md text-base font-bold text-on-surface">Cancel Appointment</h3>
              <button onClick={onCloseCancel} className="cursor-pointer text-gray-500">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Are you sure you want to cancel the scheduled appointment for <strong className="text-on-surface">{cancelApt.name}</strong>?
            </p>

            <div className="bg-error-container/20 p-3 rounded-xl border border-error/20 text-xs">
              <div className="font-bold text-error uppercase text-[10px]">Notice</div>
              <p className="text-on-surface text-[11px] mt-0.5">
                The patient will be notified via SMS and App Notification of this cancellation.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => onConfirmCancel(cancelApt.id)}
                className="w-full py-2.5 rounded-xl bg-error hover:bg-error/90 text-white font-bold text-xs uppercase cursor-pointer shadow-sm"
              >
                Confirm Cancellation
              </button>
              <button
                type="button"
                onClick={onCloseCancel}
                className="w-full py-2.5 rounded-xl bg-surface-container font-bold text-xs uppercase cursor-pointer"
              >
                Keep Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
