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
  onReschedule?: (apt: Appointment) => void;
}

export const DoctorDashboardView: React.FC<DoctorDashboardViewProps> = ({
  onNavigateTab,
  onOpenPatientModal,
  onOpenAISummary,
  onOpenEmergencyModal,
  onStartConsultation,
  onShowToast,
  urgentAcknowledged,
  onReschedule,
}) => {
  const [isOffline, setIsOffline] = useState(false);
  const [queueFilter, setQueueFilter] = useState<'all' | 'urgent'>('all');


  const rahulPatient: Patient = {
    id: 'p2-rahul',
    name: 'Rahul Sharma',
    mrn: 'MN-9921',
    dept: 'Cardiology',
    age: 41,
    gender: 'Male',
    blood: 'O+',
    priority: 'HIGH',
    status: 'WAITING',
    lastVisit: 'Sep 28, 2026',
    nextAppointment: 'Today at 10:00 AM (Room 304)',
    allergies: 'Penicillin, Sulfa compounds',
    meds: 'Lisinopril 10mg daily, Aspirin 81mg daily, Rosuvastatin 20mg',
    history: 'Subacute retrosternal tight sensation radiating to left clavicle. History of CAD mid-LAD stent (2021). Essential hypertension.',
    reason: 'Acute retrosternal chest discomfort (rated 6/10), onset 45 minutes prior. Mild sweating, left arm heaviness.',
    recommendation: 'Review baseline comparison on current 12-lead ECG (V3-V4). Stat high-sensitivity cardiac Troponin I panel requested.',
    heartRate: '118 bpm',
  };

  const alexPatient: Patient = {
    id: 'p1-alex',
    name: 'Aarav Mehta',
    mrn: 'ABHA-MN-7814',
    dept: 'Cardiology',
    age: 56,
    gender: 'Male',
    blood: 'A+',
    priority: 'NORMAL',
    status: 'WAITING',
    lastVisit: 'Sep 05, 2026',
    nextAppointment: 'Today at 10:30 AM (Station 2)',
    allergies: 'None documented',
    meds: 'Atorvastatin 40mg, Metoprolol 25mg',
    history: 'Post-angioplasty 6-month catheterization checkup.',
    reason: 'Post-angioplasty routine follow-up. Checked in and vitals logged.',
    recommendation: 'Resting ECG normal. Lipid panel within target range.',
    heartRate: '74 bpm',
  };

  const sarahPatient: Patient = {
    id: 'p3-sarah',
    name: 'Sarah Jenkins',
    mrn: 'MN-4402',
    dept: 'Cardiology',
    age: 63,
    gender: 'Female',
    blood: 'B+',
    priority: 'NORMAL',
    status: 'WAITING',
    lastVisit: 'Nov 02, 2026',
    nextAppointment: 'Today at 11:15 AM (Exam 1)',
    allergies: 'Iodine contrast dye',
    meds: 'Amlodipine 5mg, Hydrochlorothiazide 12.5mg',
    history: 'Hypertension review, mild ankle edema reported.',
    reason: 'Hypertension review & lab titration. In review with resident.',
    recommendation: 'Verify serum electrolytes and eGFR before adjusting diuretic dosage.',
    heartRate: '78 bpm',
  };

  const eleanorPatient: Patient = {
    id: 'p5-eleanor',
    name: 'Eleanor Vance',
    mrn: 'MN-6033',
    dept: 'Cardiology',
    age: 38,
    gender: 'Female',
    blood: 'AB-',
    priority: 'NORMAL',
    status: 'WAITING',
    lastVisit: 'Sep 12, 2026',
    nextAppointment: 'Today at 01:30 PM',
    allergies: 'Latex',
    meds: 'Rosuvastatin 20mg',
    history: 'Lipid profile titration, family history of early MI.',
    reason: 'Lipid profile titration & counseling.',
    recommendation: 'Maintain lifestyle modifications and repeat lipid panel in 12 weeks.',
    heartRate: '72 bpm',
  };

  const devPatient: Patient = {
    id: 'p-dev',
    name: 'Dev Patel',
    mrn: 'MN-3199',
    dept: 'Cardiology',
    age: 51,
    gender: 'Male',
    blood: 'O-',
    priority: 'NORMAL',
    status: 'WAITING',
    lastVisit: 'Sep 10, 2026',
    nextAppointment: 'Today at 02:00 PM',
    allergies: 'None',
    meds: 'Metoprolol 50mg',
    history: 'Post-Echo findings discussion.',
    reason: 'Echocardiogram Review • 30 min duration.',
    recommendation: 'Ejection fraction preserved at 58%. Valve kinematics stable.',
    heartRate: '70 bpm',
  };

  const priyaPatient: Patient = {
    id: 'p-priya-n',
    name: 'Priya Nambiar',
    mrn: 'MN-8842',
    dept: 'Cardiology',
    age: 47,
    gender: 'Female',
    blood: 'A-',
    priority: 'NORMAL',
    status: 'WAITING',
    lastVisit: 'Aug 24, 2026',
    nextAppointment: 'Today at 02:45 PM',
    allergies: 'Aspirin',
    meds: 'Sotalol 80mg',
    history: 'Holter trace evaluation for episodic palpitations.',
    reason: 'Arrhythmia Holter Monitoring Consult.',
    recommendation: 'Rare PACs detected, no sustained SVT or AFib.',
    heartRate: '76 bpm',
  };

  const queuePatients = [
    { patient: rahulPatient, time: '10:00 AM', status: urgentAcknowledged ? 'In Consultation' : 'Waiting (Nurse Triaged)', isUrgent: true },
    { patient: alexPatient, time: '10:30 AM', status: 'Checked In (Vitals Logged)', isUrgent: false },
    { patient: sarahPatient, time: '11:15 AM', status: 'In Review (With Resident)', isUrgent: false },
    { patient: eleanorPatient, time: '01:30 PM', status: 'Scheduled (Appt Confirmed)', isUrgent: false },
  ];

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
              alt="Dr. Shiv Gupta portrait"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida/AEtjO1WdsLknfBntsioHzvTNxERoyz2hVIQA5HhaO5cCN1i-10yxl6xUHh2PPNmqm2wd_E8helijvNtRZetVOoxy7oiqmYdZ342pdxHfW3hjbPZxw_oaQWMW94cI5ieLwWASG3leEiKlrmnw_hfUJsK5NQVcJoPO4qBLP9ZS3wgv0IUJq-UYpwylhakjjAX7sG10_nXQZm9gveWTqJS1HhOl6FHD_SGX6EMiUN7_PszWs0slLRGsPbCBuDxRpsiH"
            />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary rounded-full shadow-[0_0_0_2px_#f6faf5]"></span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-label-caps text-[11px] text-primary tracking-wider uppercase font-bold">
                Senior Cardiologist
              </span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="font-label-caps text-[11px] text-on-surface-variant font-semibold">
                Cardiology OPD-B
              </span>
            </div>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface tracking-tight">
              Good morning, Dr. Gupta
            </h1>
            <p className="font-body-md text-[13px] text-on-surface-variant">
              Saturday, Sep 12 • 8 Consultations Today
            </p>
          </div>
        </div>
      </section>

      {/* High-Priority Urgent Triage Banner */}
      <section className="mb-4">
        <div
          onClick={onOpenEmergencyModal}
          className={`w-full rounded-xl p-3.5 shadow-sm flex items-center justify-between gap-3 cursor-pointer transition-transform active:scale-[0.99] border ${
            urgentAcknowledged
              ? 'bg-primary-container/20 text-on-surface border-primary/30'
              : 'bg-error-container text-on-error-container border-error/20'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                urgentAcknowledged ? 'bg-primary text-white' : 'bg-tertiary text-on-tertiary animate-pulse'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`font-label-caps px-1.5 py-0.5 rounded uppercase font-bold tracking-wider text-[10px] ${
                    urgentAcknowledged ? 'bg-primary text-white' : 'bg-tertiary text-on-tertiary'
                  }`}
                >
                  {urgentAcknowledged ? 'Active Case' : 'Urgent Triage'}
                </span>
                <span className="font-label-caps text-[11px] font-semibold text-tertiary">Room 304</span>
              </div>
              <p className="font-body-md text-[14px] font-bold truncate text-on-surface mt-0.5">
                Rahul Sharma • Chest Discomfort
              </p>
              <span className="font-label-caps text-[11px] text-on-surface-variant">
                {urgentAcknowledged
                  ? 'Doctor actively assigned • Cath lab ready'
                  : 'Triage request logged 4 mins ago by Nurse Kelly'}
              </span>
            </div>
          </div>
          <div className="flex items-center flex-shrink-0 text-primary font-bold text-xs font-label-caps">
            <span className="mr-1 underline">{urgentAcknowledged ? 'View' : 'Respond'}</span>
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </div>
        </div>
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
              <span className="font-headline-lg text-[28px] leading-tight font-bold text-on-surface">8</span>
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
              <span className="font-headline-lg text-[28px] leading-tight font-bold text-on-surface">3</span>
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
              <span className="font-headline-lg text-[28px] leading-tight font-bold text-on-surface">5</span>
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
              <span className="font-headline-lg text-[28px] leading-tight font-bold text-tertiary">1</span>
              <span className="font-body-md text-[13px] text-tertiary">urgent</span>
            </div>
            <span className="font-label-caps text-[11px] text-tertiary font-semibold mt-1">
              {urgentAcknowledged ? 'In active care' : 'Requires triage'}
            </span>
          </div>
        </div>
      </section>

      {/* AI Clinical Summary Spotlight Card */}
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
                  <span className="font-label-caps text-[10px] text-on-surface-variant">Generated 8:50 AM</span>
                </div>
                <h3 className="font-headline-md text-[16px] text-on-surface font-semibold mt-0.5">
                  Clinical Dossier: Rahul Sharma
                </h3>
              </div>
            </div>
          </div>
          <p className="font-body-md text-[14px] text-on-surface-variant mt-2.5 line-clamp-2">
            Subacute retrosternal tight sensation radiating to left clavicle. History of CAD stent (LAD, 2021). Electrocardiogram shows nonspecific ST changes in V3-V4 compared to baseline.
          </p>
          <div className="mt-3.5 pt-3 flex items-center justify-between border-t border-outline-variant/20">
            <div className="flex items-center gap-1 text-on-surface-variant text-[12px] font-label-caps">
              <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
              <span>Risk stratification: Elevated</span>
            </div>
            <button
              type="button"
              onClick={() => onOpenAISummary(rahulPatient)}
              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-wider flex items-center gap-1 shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              <span>View AI Summary</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

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
          {/* Dev Patel */}
          <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm border border-outline-variant/20 flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => onOpenPatientModal(devPatient)}
            >
              <div className="w-10 h-10 rounded-xl bg-surface-container flex flex-col items-center justify-center text-on-surface">
                <span className="font-label-caps text-[10px] uppercase font-bold text-secondary">2:00</span>
                <span className="font-headline-md text-[13px] font-bold">PM</span>
              </div>
              <div className="flex flex-col">
                <h4 className="font-headline-md text-[15px] font-semibold text-on-surface">Dev Patel</h4>
                <p className="font-body-md text-[13px] text-on-surface-variant">Echocardiogram Review • 30 min</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (onReschedule) {
                    onReschedule({
                      id: 'apt-dev',
                      name: 'Dev Patel',
                      ageGender: '51y • Male',
                      mrn: 'MN-3199',
                      date: 'Today',
                      dateLabel: 'Today',
                      time: '02:00 PM',
                      department: 'Cardiology',
                      modality: 'Room 304 Consult',
                      status: 'TODAY',
                      reason: 'Echocardiogram Review • 30 min duration.',
                    });
                  } else {
                    onShowToast('Reschedule request sent for Dev Patel');
                  }
                }}
                className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                title="Reschedule"
              >
                <span className="material-symbols-outlined text-[18px]">update</span>
              </button>
              <button
                type="button"
                onClick={() => onStartConsultation(devPatient)}
                className="p-2 rounded-lg bg-primary-container text-on-primary-container hover:opacity-90 transition-all cursor-pointer"
                title="Start Consult"
              >
                <span className="material-symbols-outlined text-[18px]">video_chat</span>
              </button>
            </div>
          </div>

          {/* Priya Nambiar */}
          <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm border border-outline-variant/20 flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => onOpenPatientModal(priyaPatient)}
            >
              <div className="w-10 h-10 rounded-xl bg-surface-container flex flex-col items-center justify-center text-on-surface">
                <span className="font-label-caps text-[10px] uppercase font-bold text-secondary">2:45</span>
                <span className="font-headline-md text-[13px] font-bold">PM</span>
              </div>
              <div className="flex flex-col">
                <h4 className="font-headline-md text-[15px] font-semibold text-on-surface">Priya Nambiar</h4>
                <p className="font-body-md text-[13px] text-on-surface-variant">Arrhythmia Holter Monitoring Consult</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (onReschedule) {
                    onReschedule({
                      id: 'apt-priya',
                      name: 'Priya Nambiar',
                      ageGender: '47y • Female',
                      mrn: 'MN-8842',
                      date: 'Today',
                      dateLabel: 'Today',
                      time: '02:45 PM',
                      department: 'Cardiology',
                      modality: 'Room 304 Consult',
                      status: 'TODAY',
                      reason: 'Arrhythmia Holter Monitoring Consult.',
                    });
                  } else {
                    onShowToast('Reschedule request sent for Priya Nambiar');
                  }
                }}
                className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                title="Reschedule"
              >
                <span className="material-symbols-outlined text-[18px]">update</span>
              </button>
              <button
                type="button"
                onClick={() => onStartConsultation(priyaPatient)}
                className="p-2 rounded-lg bg-primary-container text-on-primary-container hover:opacity-90 transition-all cursor-pointer"
                title="Start Consult"
              >
                <span className="material-symbols-outlined text-[18px]">video_chat</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => onNavigateTab('schedule')}
            className="w-full py-2.5 rounded-xl bg-secondary-container/50 hover:bg-secondary-container text-on-secondary-container font-label-caps text-label-caps uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-colors border border-secondary-container active:scale-[0.99] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>View All Appointments (8 Total)</span>
          </button>
        </div>
      </section>
    </div>
  );
};
