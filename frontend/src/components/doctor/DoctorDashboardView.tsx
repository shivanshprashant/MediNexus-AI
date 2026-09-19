import React, { useState } from 'react';
import { Patient, DoctorTab, Appointment } from '../../types';

interface DoctorDashboardViewProps {
  onNavigateTab: (tab: DoctorTab) => void;
  onOpenPatientModal: (patient: Patient) => void;
  onOpenAISummary: (patient: Patient) => void;
  onOpenEmergencyModal: () => void;
  onStartConsultation: (patient: Patient) => void;
  onShowToast: (msg: string) => void;
  urgentAcknowledged: boolean;
  doctorProfile?: any;
  admissionRequests?: any[];
  appointments?: Appointment[];
  patients?: Patient[];
  onDecideAdmission?: (requestId: string, action: 'APPROVE' | 'REJECT', bedId?: string) => void;
  onDischargeAdmission?: (requestId: string) => void;
  activeSos?: any;
}

export const DoctorDashboardView: React.FC<DoctorDashboardViewProps> = ({
  onNavigateTab,
  onOpenPatientModal,
  onOpenAISummary,
  onOpenEmergencyModal,
  onStartConsultation,
  onShowToast,
  urgentAcknowledged,
  doctorProfile,
  admissionRequests = [],
  appointments = [],
  patients = [],
  onDecideAdmission,
  onDischargeAdmission,
  activeSos,
}) => {
  const [isOffline, setIsOffline] = useState(false);
  const [queueFilter, setQueueFilter] = useState<'all' | 'urgent'>('all');
  const [dischargeConfirmReq, setDischargeConfirmReq] = useState<{ id: string; name: string } | null>(null);
  const activeAppointments = appointments.filter((a) => a.status !== 'CANCELLED');
  const totalScheduledCount = activeAppointments.length;
  const todayWaitingCount = appointments.filter((a) => a.status === 'TODAY' || a.status === 'WAITING').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const urgentCount = activeAppointments.filter((a) => a.status !== 'COMPLETED' && (a.reason?.toLowerCase().includes('chest') || a.reason?.toLowerCase().includes('urgent') || a.reason?.toLowerCase().includes('emergency'))).length;

  const activeAdmissions = admissionRequests.filter((req: any) => req.status !== 'DISCHARGED');
  const dischargedAdmissions = admissionRequests.filter((req: any) => req.status === 'DISCHARGED').slice(0, 3);
  const displayAdmissionRequests = [...activeAdmissions, ...dischargedAdmissions];

  const doctorName = doctorProfile?.name || 'Doctor';
  const doctorTitle = doctorProfile?.title || doctorProfile?.specialization || 'Attending Physician';
  const doctorFacility = doctorProfile?.facility || 'Hospital Node';
  const doctorPhoto = doctorProfile?.photo
    ? (doctorProfile.photo.startsWith('http') ? doctorProfile.photo : `http://localhost:8000${doctorProfile.photo}`)
    : "https://lh3.googleusercontent.com/aida/AEtjO1WdsLknfBntsioHzvTNxERoyz2hVIQA5HhaO5cCN1i-10yxl6xUHh2PPNmqm2wd_E8helijvNtRZetVOoxy7oiqmYdZ342pdxHfW3hjbPZxw_oaQWMW94cI5ieLwWASG3leEiKlrmnw_hfUJsK5NQVcJoPO4qBLP9ZS3wgv0IUJq-UYpwylhakjjAX7sG10_nXQZm9gveWTqJS1HhOl6FHD_SGX6EMiUN7_PszWs0slLRGsPbCBuDxRpsiH";

  const queuePatients = patients
    .filter((p) => p.status !== 'IN_CONSULTANCY' && p.status !== 'COMPLETED')
    .map((p) => ({
      patient: p,
      time: p.nextAppointment || 'Today',
      status: p.status === 'WAITING' ? 'Waiting (Nurse Triaged)' : p.status,
      isUrgent: p.priority === 'HIGH' || (p.reason?.toLowerCase().includes('chest') ?? false) || (p.reason?.toLowerCase().includes('urgent') ?? false),
    }));

  const visibleQueue = queueFilter === 'urgent'
    ? queuePatients.filter((q) => q.isUrgent)
    : queuePatients;

  const toggleOffline = () => {
    setIsOffline(!isOffline);
    if (!isOffline) {
      onShowToast('Simulating offline state — cached clinical records active');
    } else {
      onShowToast('Connected to Hospital MediNexus Core');
    }
  };

  return (
    <div className="flex flex-col w-full px-4 pt-2 pb-36 max-w-lg mx-auto">
      {/* Offline Status Warning Bar */}
      {isOffline && (
        <div className="mb-3 w-full py-2 px-3.5 rounded-xl bg-tertiary text-on-tertiary flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">cloud_off</span>
            <span className="font-label-caps text-[11px] leading-tight font-bold uppercase">
              OFFLINE MODE — CACHED CLINICAL RECORDS ACTIVE
            </span>
          </div>
          <button
            type="button"
            onClick={toggleOffline}
            className="font-label-caps underline uppercase tracking-wider text-[11px] font-bold hover:opacity-80 cursor-pointer"
          >
            Reconnect
          </button>
        </div>
      )}

      {/* Doctor Welcome Header */}
      <section className="pt-2 pb-4 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div
            className="relative w-14 h-14 rounded-full overflow-hidden shadow-sm bg-surface-container-high shrink-0 cursor-pointer"
            onClick={() => onNavigateTab('profile')}
          >
            <img
              alt={doctorName}
              className="w-full h-full object-cover"
              src={doctorPhoto}
            />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary rounded-full shadow-[0_0_0_2px_#f6faf5]"></span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-label-caps text-[11px] text-primary tracking-wider uppercase font-bold">
                {doctorTitle}
              </span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="font-label-caps text-[11px] text-on-surface-variant font-semibold">
                {doctorFacility}
              </span>
            </div>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface tracking-tight">
              Good morning, {doctorName}
            </h1>
            <p className="font-body-md text-[13px] text-on-surface-variant">
              Thursday, Oct 24 • {totalScheduledCount} Consultation{totalScheduledCount !== 1 ? 's' : ''} Scheduled
            </p>
          </div>
        </div>
      </section>

      {/* High-Priority Urgent Triage Banner */}
      {activeSos && (
        <section className="mb-4">
          <div
            onClick={onOpenEmergencyModal}
            className={`w-full rounded-xl p-3.5 shadow-sm flex items-center justify-between gap-3 cursor-pointer transition-transform active:scale-[0.99] border ${
              activeSos.status === 'accepted'
                ? 'bg-primary-container/20 text-on-surface border-primary/30'
                : 'bg-error-container text-on-error-container border-error/20'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  activeSos.status === 'accepted' ? 'bg-primary text-white' : 'bg-tertiary text-on-tertiary animate-pulse'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-label-caps px-1.5 py-0.5 rounded uppercase font-bold tracking-wider text-[10px] ${
                      activeSos.status === 'accepted' ? 'bg-primary text-white' : 'bg-tertiary text-on-tertiary'
                    }`}
                  >
                    {activeSos.status === 'accepted' ? 'Active Case' : 'Urgent Triage'}
                  </span>
                  <span className="font-label-caps text-[11px] font-semibold text-tertiary">{activeSos.bedNo || 'ER'}</span>
                </div>
                <p className="font-body-md text-[14px] font-bold truncate text-on-surface mt-0.5">
                  {activeSos.patientName} • {activeSos.complaint || 'Severe emergency symptoms'}
                </p>
                <span className="font-label-caps text-[11px] text-on-surface-variant">
                  {activeSos.status === 'accepted'
                    ? 'Doctor actively assigned • Triage ongoing'
                    : 'Emergency request received via SOS'}
                </span>
              </div>
            </div>
            <div className="flex items-center flex-shrink-0 text-primary font-bold text-xs font-label-caps">
              <span className="mr-1 underline">{activeSos.status === 'accepted' ? 'View' : 'Respond'}</span>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </div>
          </div>
        </section>
      )}

      {/* Patient Admission & Bed Requests Section */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="font-headline-md text-[17px] text-on-surface font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[20px]">single_bed</span>
            Bed & Admission Requests
          </h2>
          <span className="px-2 py-0.5 rounded-full font-label-caps text-[10px] uppercase font-bold bg-primary-container/40 text-primary">
            Live PostgreSQL Sync
          </span>
        </div>

        {/* Live Department Bed Availability Banner */}
        {admissionRequests[0]?.bed_availability && admissionRequests[0].bed_availability.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {admissionRequests[0].bed_availability.map((b: any) => (
              <div key={b.bed_id} className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/30 text-center">
                <span className="font-label-caps text-[9px] text-on-surface-variant uppercase block truncate">{b.department_name.split('&')[0]}</span>
                <strong className={`text-base font-data-mono font-bold ${b.available > 0 ? 'text-primary' : 'text-error'}`}>
                  {b.available} Bed{b.available === 1 ? '' : 's'}
                </strong>
                <span className="text-[10px] text-on-surface-variant block font-mono">({b.occupied}/{b.total} occupied)</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {displayAdmissionRequests.map((req: any) => (
            <div key={req.id} className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div>
                  <strong className="font-headline-md text-sm font-bold text-on-surface block">{req.patient_name}</strong>
                  <span className="font-data-mono text-[11px] text-on-surface-variant">{req.mrn || 'ABHA-MN'} • {req.age_gender || '29 / Female'}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-label-caps text-[10px] font-bold uppercase ${
                  req.status === 'ADMITTED' || req.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : req.status === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {req.status}
                </span>
              </div>

              <div className="bg-surface-container-low p-2 rounded-lg text-xs">
                <span className="font-bold text-on-surface-variant text-[10px] uppercase block mb-0.5">Department & Reason</span>
                <p className="text-on-surface font-medium">{req.department_name || 'Cardiology'} — "{req.reason}"</p>
                {req.allocated_bed_info && (
                  <span className="mt-1 inline-flex items-center gap-1 font-bold text-emerald-700 text-[11px]">
                    <span className="material-symbols-outlined text-[14px]">hotel</span> Bed Assigned: {req.allocated_bed_info}
                  </span>
                )}
              </div>

              {req.status === 'PENDING' && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onDecideAdmission && onDecideAdmission(req.id, 'APPROVE')}
                    className="flex-1 py-2 bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase rounded-lg shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Approve & Admit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecideAdmission && onDecideAdmission(req.id, 'REJECT')}
                    className="py-2 px-3 bg-surface-container hover:bg-red-100 text-red-700 font-bold text-xs uppercase rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>Reject</span>
                  </button>
                </div>
              )}

              {req.status === 'ADMITTED' && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDischargeConfirmReq({ id: req.id, name: req.patient_name })}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase rounded-lg shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                    <span>Discharge Patient</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {displayAdmissionRequests.length === 0 && (
            <div className="p-4 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-xs text-on-surface-variant">
              No pending bed admission requests for this hospital.
            </div>
          )}
        </div>

        {/* Discharge Confirmation Modal Popup */}
        {dischargeConfirmReq && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in border border-amber-500/20">
              <div className="flex items-center gap-3 text-amber-600">
                <span className="material-symbols-outlined text-[26px]">meeting_room</span>
                <div>
                  <h3 className="font-headline-md text-base font-bold text-on-surface">Discharge Patient</h3>
                  <p className="text-xs text-on-surface-variant">{dischargeConfirmReq.name}</p>
                </div>
              </div>

              <p className="text-xs text-on-surface leading-relaxed">
                Are you sure you want to discharge this patient?
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDischargeConfirmReq(null)}
                  className="flex-1 py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs uppercase rounded-xl cursor-pointer hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const reqId = dischargeConfirmReq.id;
                    setDischargeConfirmReq(null);
                    if (onDischargeAdmission) {
                      onDischargeAdmission(reqId);
                    }
                  }}
                  className="flex-1 py-2.5 bg-amber-600 text-white font-bold text-xs uppercase rounded-xl shadow-sm cursor-pointer hover:bg-amber-700 flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Discharge</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Today's Clinical Volume (2x2 Grid) */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="font-headline-md text-[17px] text-on-surface font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
            Today's Clinical Volume
          </h2>
          <button
            type="button"
            onClick={toggleOffline}
            className="font-label-caps text-[11px] text-secondary flex items-center gap-1 py-1 px-2 rounded-lg bg-secondary-container/40 hover:bg-secondary-container/70 active:scale-95 transition-all cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-[15px]">cell_tower</span>
            <span>{isOffline ? 'Simulate Online' : 'Simulate Offline'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Scheduled */}
          <div
            onClick={() => onNavigateTab('schedule')}
            className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Scheduled</span>
              <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-headline-lg text-[28px] leading-tight font-bold text-on-surface">{totalScheduledCount}</span>
              <span className="font-body-md text-[13px] text-on-surface-variant">visits</span>
            </div>
            <span className="font-label-caps text-[11px] text-primary font-semibold mt-1">Full booked slot</span>
          </div>

          {/* Card 2: In Waiting Area */}
          <div
            onClick={() => setQueueFilter('all')}
            className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between cursor-pointer hover:border-secondary/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">In Waiting Area</span>
              <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[18px]">person_pin_circle</span>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-headline-lg text-[28px] leading-tight font-bold text-on-surface">{todayWaitingCount}</span>
              <span className="font-body-md text-[13px] text-on-surface-variant">waiting</span>
            </div>
            <span className="font-label-caps text-[11px] text-secondary font-semibold mt-1">Avg. wait: 12 min</span>
          </div>

          {/* Card 3: Completed */}
          <div
            onClick={() => onNavigateTab('schedule')}
            className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Completed</span>
              <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-headline-lg text-[28px] leading-tight font-bold text-on-surface">{completedCount}</span>
              <span className="font-body-md text-[13px] text-on-surface-variant">finished</span>
            </div>
            <span className="font-label-caps text-[11px] text-on-surface-variant mt-1">62% daily progress</span>
          </div>

          {/* Card 4: High-Priority */}
          <div
            onClick={() => setQueueFilter('urgent')}
            className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between cursor-pointer hover:border-tertiary/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-caps text-label-caps text-tertiary uppercase">High-Priority</span>
              <div className="w-7 h-7 rounded-lg bg-tertiary-fixed text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">emergency</span>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-headline-lg text-[28px] leading-tight font-bold text-tertiary">{urgentCount}</span>
              <span className="font-body-md text-[13px] text-tertiary">urgent</span>
            </div>
            <span className="font-label-caps text-[11px] text-tertiary font-semibold mt-1">
              {urgentAcknowledged ? 'In active care' : 'Requires triage'}
            </span>
          </div>
        </div>
      </section>

      {/* AI Clinical Summary Spotlight Card */}
      {patients.length > 0 && patients[0].recommendation && (
        <section className="mb-6">
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/20 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">neurology</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-caps text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      MediNexus AI Copilot
                    </span>
                    <span className="font-label-caps text-[10px] text-on-surface-variant">Generated recently</span>
                  </div>
                  <h3 className="font-headline-md text-[16px] text-on-surface font-semibold mt-0.5">
                    Clinical Dossier: {patients[0].name}
                  </h3>
                </div>
              </div>
            </div>
            <p className="font-body-md text-[14px] text-on-surface-variant mt-2.5 line-clamp-2">
              {patients[0].recommendation}
            </p>
            <div className="mt-3.5 pt-3 flex items-center justify-between border-t border-outline-variant/20">
              <div className="flex items-center gap-1 text-on-surface-variant text-[12px] font-label-caps">
                <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
                <span>Risk stratification: {patients[0].priority === 'HIGH' ? 'Elevated' : 'Normal'}</span>
              </div>
              <button
                type="button"
                onClick={() => onOpenAISummary(patients[0])}
                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-wider flex items-center gap-1 shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              >
                <span>View AI Summary</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Today's Patient Queue */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-headline-md text-[18px] text-on-surface font-semibold">Today's Patient Queue</h2>
            <p className="font-body-md text-[13px] text-on-surface-variant">Live check-in stream • Room 304/305</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setQueueFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-label-caps text-label-caps uppercase transition-all cursor-pointer ${
                queueFilter === 'all'
                  ? 'bg-primary text-on-primary shadow-sm font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              All (4)
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter('urgent')}
              className={`px-2.5 py-1 rounded-lg font-label-caps text-label-caps uppercase transition-all cursor-pointer ${
                queueFilter === 'urgent'
                  ? 'bg-tertiary text-on-tertiary shadow-sm font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Urgent
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {visibleQueue.map((item) => (
            <div
              key={item.patient.id}
              onClick={() => onOpenPatientModal(item.patient)}
              className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm border border-outline-variant/20 cursor-pointer active:scale-[0.99] hover:border-primary/40 transition-all flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-headline-md text-[16px] font-bold text-on-surface">
                    {item.patient.name}
                  </span>
                  <span className="font-data-mono text-data-mono text-on-surface-variant">
                    #{item.patient.mrn}
                  </span>
                </div>
                {item.isUrgent ? (
                  <span className="px-2 py-0.5 rounded-full font-label-caps text-[11px] font-bold uppercase tracking-wider bg-tertiary-fixed text-on-tertiary-fixed flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span>
                    HIGH PRIORITY
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full font-label-caps text-[11px] font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant">
                    Routine
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-body-md text-[14px]">
                <div className="flex items-center gap-2 text-on-surface-variant truncate">
                  <span className="material-symbols-outlined text-[16px] text-secondary">stethoscope</span>
                  <span className="truncate">{item.patient.reason}</span>
                </div>
                <div className="flex items-center gap-1 font-data-mono text-data-mono text-on-surface font-semibold shrink-0 pl-2">
                  <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                  <span>{item.time}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 font-label-caps text-[12px] text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${item.isUrgent ? 'bg-tertiary' : 'bg-primary'}`}></span>
                  Status: <strong className="text-on-surface font-semibold">{item.status}</strong>
                </span>
                <span className="text-primary font-semibold flex items-center">
                  Details <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => onNavigateTab('patients')}
            className="w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-caps text-label-caps uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-colors border border-outline-variant/30 active:scale-[0.99] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>View All Patients (28 Assigned)</span>
          </button>
        </div>
      </section>

      {/* Upcoming Afternoon Slot */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-headline-md text-[18px] text-on-surface font-semibold">Upcoming Afternoon Slot</h2>
            <p className="font-body-md text-[13px] text-on-surface-variant">Next 2 confirmed consultations</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('schedule')}
            className="font-label-caps text-label-caps text-primary underline font-bold uppercase hover:opacity-80 cursor-pointer"
          >
            Full Schedule
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {activeAppointments.slice(0, 2).map((apt, index) => (
            <div key={apt.id || index} className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm border border-outline-variant/20 flex items-center justify-between">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => onNavigateTab('schedule')}
              >
                <div className="w-10 h-10 rounded-xl bg-surface-container flex flex-col items-center justify-center text-on-surface">
                  <span className="font-label-caps text-[10px] uppercase font-bold text-secondary">{apt.time.split(' ')[0]}</span>
                  <span className="font-headline-md text-[13px] font-bold">{apt.time.split(' ')[1] || 'PM'}</span>
                </div>
                <div className="flex flex-col">
                  <h4 className="font-headline-md text-[15px] font-semibold text-on-surface">{apt.name}</h4>
                  <p className="font-body-md text-[13px] text-on-surface-variant">{apt.reason || 'Consultation'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onShowToast(`Reschedule request sent for ${apt.name}`)}
                  className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                  title="Reschedule"
                >
                  <span className="material-symbols-outlined text-[18px]">update</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const matchedPatient = patients.find(p => p.name === apt.name);
                    if (matchedPatient) {
                      onStartConsultation(matchedPatient);
                    } else {
                      onShowToast('Patient record not fully loaded yet.');
                    }
                  }}
                  className="p-2 rounded-lg bg-primary-container text-on-primary-container hover:opacity-90 transition-all cursor-pointer"
                  title="Start Consult"
                >
                  <span className="material-symbols-outlined text-[18px]">video_chat</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => onNavigateTab('schedule')}
            className="w-full py-2.5 rounded-xl bg-secondary-container/50 hover:bg-secondary-container text-on-secondary-container font-label-caps text-label-caps uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-colors border border-secondary-container active:scale-[0.99] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>View All Appointments ({totalScheduledCount} Total)</span>
          </button>
        </div>
      </section>
    </div>
  );
};
