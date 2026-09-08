import React from 'react';
import { PatientTab } from '../../types';

interface PatientDashboardViewProps {
  onNavigateTab: (tab: PatientTab) => void;
  onOpenSOS: () => void;
  onOpenAITriage: () => void;
  onOpenNearbyClinics: () => void;
  onShowToast: (msg: string) => void;
}

export const PatientDashboardView: React.FC<PatientDashboardViewProps> = ({
  onNavigateTab,
  onOpenSOS,
  onOpenAITriage,
  onOpenNearbyClinics,
  onShowToast,
}) => {
  return (
    <div className="flex flex-col w-full px-4 pt-2 pb-36 max-w-lg mx-auto">
      {/* Greeting */}
      <section className="pt-2 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-13 h-13 rounded-full overflow-hidden border border-outline-variant/40 shrink-0">
            <img
              alt="Ananya Sharma"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            />
          </div>
          <div>
            <div className="font-label-caps text-[11px] text-primary font-bold uppercase">Patient Portal • ID #PT-4091</div>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">Good morning, Ananya</h1>
            <p className="text-xs text-on-surface-variant">Thursday, Oct 24 • Ready for care</p>
          </div>
        </div>
      </section>

      {/* Emergency SOS Banner */}
      <section className="mb-4">
        <div
          onClick={onOpenSOS}
          className="w-full bg-error-container text-on-error-container rounded-xl p-3.5 shadow-sm border border-error/20 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error text-white flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-[24px]">e911_emergency</span>
            </div>
            <div>
              <span className="font-label-caps text-[10px] uppercase font-bold bg-error text-white px-1.5 py-0.2 rounded">
                CRITICAL SOS
              </span>
              <p className="text-xs font-bold text-on-surface mt-0.5">Need Immediate Emergency Help?</p>
              <p className="text-[11px] text-on-surface-variant">Tap SOS for fast ambulance & ER routing</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-error">chevron_right</span>
        </div>
      </section>

      {/* 4-Grid Quick Actions */}
      <section className="grid grid-cols-2 gap-2.5 mb-5">
        <div
          onClick={() => onNavigateTab('book')}
          className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/30 shadow-sm cursor-pointer hover:border-primary/40 transition-colors flex flex-col gap-2"
        >
          <div className="w-9 h-9 rounded-lg bg-primary-container text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
          </div>
          <div>
            <div className="text-xs font-bold text-on-surface">Book Specialist</div>
            <div className="text-[11px] text-on-surface-variant">Verified doctor consults</div>
          </div>
        </div>

        <div
          onClick={onOpenAITriage}
          className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/30 shadow-sm cursor-pointer hover:border-primary/40 transition-colors flex flex-col gap-2"
        >
          <div className="w-9 h-9 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">neurology</span>
          </div>
          <div>
            <div className="text-xs font-bold text-on-surface">AI Triage Bot</div>
            <div className="text-[11px] text-on-surface-variant">Check clinical symptoms</div>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('profile')}
          className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/30 shadow-sm cursor-pointer hover:border-primary/40 transition-colors flex flex-col gap-2"
        >
          <div className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">folder_shared</span>
          </div>
          <div>
            <div className="text-xs font-bold text-on-surface">Medical Vault</div>
            <div className="text-[11px] text-on-surface-variant">Labs, reports & prescriptions</div>
          </div>
        </div>

        <div
          onClick={onOpenNearbyClinics}
          className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/30 shadow-sm cursor-pointer hover:border-primary/40 transition-colors flex flex-col gap-2"
        >
          <div className="w-9 h-9 rounded-lg bg-tertiary-fixed text-tertiary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">near_me</span>
          </div>
          <div>
            <div className="text-xs font-bold text-on-surface">Nearby ER & OPD</div>
            <div className="text-[11px] text-on-surface-variant">Open centers within 5km</div>
          </div>
        </div>
      </section>

      {/* Upcoming Confirmed Appointment */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-headline-md text-sm font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">event</span>
            Confirmed Appointment
          </h2>
          <span className="font-label-caps text-[10px] text-primary font-bold uppercase bg-primary-fixed px-2 py-0.5 rounded-full">
            In 4 Days
          </span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex gap-3 items-center">
              <img
                alt="Dr. Shiv Gupta"
                className="w-12 h-12 rounded-xl object-cover"
                src="https://lh3.googleusercontent.com/aida/AEtjO1WdsLknfBntsioHzvTNxERoyz2hVIQA5HhaO5cCN1i-10yxl6xUHh2PPNmqm2wd_E8helijvNtRZetVOoxy7oiqmYdZ342pdxHfW3hjbPZxw_oaQWMW94cI5ieLwWASG3leEiKlrmnw_hfUJsK5NQVcJoPO4qBLP9ZS3wgv0IUJq-UYpwylhakjjAX7sG10_nXQZm9gveWTqJS1HhOl6FHD_SGX6EMiUN7_PszWs0slLRGsPbCBuDxRpsiH"
              />
              <div>
                <div className="font-headline-md text-sm font-bold text-on-surface">Dr. Shiv Gupta, MD</div>
                <div className="text-xs text-primary font-medium">Senior Cardiologist • Room 304</div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">Oct 28 • 10:00 AM EST</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[10px] text-on-surface">
              Confirmed
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onShowToast('Video consult link will be active 15m prior to appointment')}
              className="flex-1 py-2.5 bg-primary text-white font-bold text-xs uppercase rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">videocam</span> Join Video Room
            </button>
            <button
              onClick={() => onShowToast('Digital Appointment Slip saved to Medical Vault')}
              className="py-2.5 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs uppercase rounded-lg cursor-pointer"
            >
              View Slip
            </button>
          </div>
        </div>
      </section>

      {/* Vitals Summary Card */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-headline-md text-sm font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">vital_signs</span>
            Latest Health Vitals
          </h2>
          <span className="font-data-mono text-[11px] text-on-surface-variant">Synced 2h ago</span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/30">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase block">Blood Pressure</span>
            <span className="font-data-mono font-bold text-xs text-on-surface">118/76</span>
            <span className="text-[9px] text-primary font-bold block mt-0.5">Optimal</span>
          </div>
          <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/30">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase block">Heart Rate</span>
            <span className="font-data-mono font-bold text-xs text-on-surface">72 bpm</span>
            <span className="text-[9px] text-secondary font-bold block mt-0.5">Resting</span>
          </div>
          <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/30">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase block">Oxygen SpO2</span>
            <span className="font-data-mono font-bold text-xs text-on-surface">99%</span>
            <span className="text-[9px] text-primary font-bold block mt-0.5">Normal</span>
          </div>
          <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/30">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase block">Fasting Glu</span>
            <span className="font-data-mono font-bold text-xs text-on-surface">92 mg/dL</span>
            <span className="text-[9px] text-primary font-bold block mt-0.5">Normal</span>
          </div>
        </div>
      </section>

      {/* Active Prescriptions */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-headline-md text-sm font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">prescriptions</span>
            Daily Medication Routine
          </h2>
          <span className="text-xs text-primary font-bold cursor-pointer" onClick={() => onNavigateTab('records')}>
            All Prescriptions
          </span>
        </div>

        <div className="space-y-2">
          <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">medication</span>
              </div>
              <div>
                <span className="font-headline-md text-xs font-bold text-on-surface block">Atorvastatin 20mg</span>
                <span className="text-[11px] text-on-surface-variant">1 tablet nightly with dinner</span>
              </div>
            </div>
            <button
              onClick={() => onShowToast('Marked Atorvastatin 20mg taken')}
              className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded text-[11px] font-bold text-primary cursor-pointer"
            >
              Take
            </button>
          </div>

          <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">medication</span>
              </div>
              <div>
                <span className="font-headline-md text-xs font-bold text-on-surface block">Lisinopril 5mg</span>
                <span className="text-[11px] text-on-surface-variant">1 tablet daily morning</span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-[10px] rounded">
              Taken Today
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
