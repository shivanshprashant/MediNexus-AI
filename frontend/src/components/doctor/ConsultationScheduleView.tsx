import React, { useState } from 'react';
import { Appointment } from '../../types';

interface ConsultationScheduleViewProps {
  appointments: Appointment[];
  onStartConsult: (apt: Appointment) => void;
  onOpenDetails: (apt: Appointment) => void;
  onReschedule: (apt: Appointment) => void;
  onCancel: (apt: Appointment) => void;
}

export const ConsultationScheduleView: React.FC<ConsultationScheduleViewProps> = ({
  appointments,
  onStartConsult,
  onOpenDetails,
  onReschedule,
  onCancel,
}) => {
  const [tab, setTab] = useState<'today' | 'upcoming' | 'completed' | 'cancelled'>('today');

  const counts = {
    today: appointments.filter((a) => a.status === 'TODAY').length,
    upcoming: appointments.filter((a) => a.status === 'UPCOMING').length,
    completed: appointments.filter((a) => a.status === 'COMPLETED').length,
    cancelled: appointments.filter((a) => a.status === 'CANCELLED').length,
  };

  const currentList = appointments.filter((a) => a.status.toLowerCase() === tab);

  return (
    <div className="flex flex-col w-full px-4 pt-2 pb-36 max-w-lg mx-auto">
      <div className="flex items-center justify-between mt-1 mb-3">
        <div>
          <span className="font-label-caps text-primary tracking-widest uppercase text-[11px] font-bold">Clinical Roster</span>
          <h1 className="font-headline-md text-2xl font-bold text-on-surface">Consultation Schedule</h1>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant font-data-mono text-[12px] shadow-sm font-semibold">
          <span className="material-symbols-outlined text-[16px] text-primary">calendar_clock</span>
          <span>Sep 12, 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-outline-variant/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">stethoscope</span>
          </div>
          <div>
            <div className="font-label-caps text-[10px] text-on-surface-variant uppercase">Remaining Today</div>
            <div className="font-headline-md text-xl font-bold text-on-surface">{counts.today}</div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-outline-variant/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">fact_check</span>
          </div>
          <div>
            <div className="font-label-caps text-[10px] text-on-surface-variant uppercase">Completed</div>
            <div className="font-headline-md text-xl font-bold text-on-surface">{counts.completed}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar mb-3">
        {(['today', 'upcoming', 'completed', 'cancelled'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-1.5 rounded-full font-label-caps text-[11px] uppercase whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === t
                ? 'bg-primary text-on-primary shadow-sm font-bold'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span>{t}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${tab === t ? 'bg-white/20 text-white' : 'bg-black/10'}`}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {currentList.map((apt) => (
          <div key={apt.id} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-[14px]">
                  {apt.initials || apt.name?.substring(0, 2).toUpperCase() || 'PT'}
                </div>
                <div>
                  <div className="font-headline-md text-[16px] text-on-surface font-bold leading-tight">{apt.name}</div>
                  <div className="font-data-mono text-[11px] text-on-surface-variant mt-0.5">{apt.mrn} • {apt.ageGender}</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-label-caps text-[10px] uppercase font-bold ${
                apt.status === 'CANCELLED'
                  ? 'bg-error/15 text-error'
                  : apt.status === 'COMPLETED'
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-primary/10 text-primary'
              }`}>
                {apt.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-2 rounded-lg text-[12px]">
              <div className="flex items-center gap-1.5 text-on-surface-variant truncate">
                <span className="material-symbols-outlined text-[15px] text-primary">domain</span>
                <span className="truncate">{apt.department || 'Cardiology'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant truncate">
                <span className="material-symbols-outlined text-[15px] text-primary">meeting_room</span>
                <span className="truncate">{apt.modality}</span>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface font-semibold col-span-2">
                <span className="material-symbols-outlined text-[15px] text-secondary">schedule</span>
                <span className="font-data-mono">{apt.dateLabel || apt.date}, {apt.time}</span>
              </div>
            </div>

            <div className="text-[13px] text-on-surface-variant line-clamp-2">
              <strong className="text-on-surface font-semibold">Chief Complaint: </strong>{apt.reason}
            </div>

            {apt.status === 'CANCELLED' ? (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onOpenDetails(apt)}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-surface-container text-on-surface font-label-caps text-xs uppercase flex items-center justify-center gap-1.5 hover:bg-surface-container-high cursor-pointer font-semibold"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>View Details</span>
                </button>
                <button
                  onClick={() => onReschedule(apt)}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-primary text-white font-label-caps text-xs uppercase flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer font-bold"
                >
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  <span>Re-Book / Reschedule</span>
                </button>
              </div>
            ) : apt.status === 'COMPLETED' ? (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onOpenDetails(apt)}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-surface-container text-on-surface font-label-caps text-xs uppercase flex items-center justify-center gap-1.5 hover:bg-surface-container-high cursor-pointer font-semibold"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>Medical Record</span>
                </button>
                <button
                  onClick={() => onReschedule(apt)}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-secondary-container text-on-secondary-container font-label-caps text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                >
                  <span className="material-symbols-outlined text-[16px]">event_repeat</span>
                  <span>Follow-Up Consult</span>
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onStartConsult(apt)}
                    className="py-2.5 px-3 rounded-lg bg-primary text-on-primary font-label-caps text-xs uppercase flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer font-bold"
                  >
                    <span className="material-symbols-outlined text-[16px]">stethoscope</span>
                    <span>Start Consult</span>
                  </button>
                  <button
                    onClick={() => onOpenDetails(apt)}
                    className="py-2.5 px-3 rounded-lg bg-surface-container text-on-surface font-label-caps text-xs uppercase flex items-center justify-center gap-1.5 hover:bg-surface-container-high cursor-pointer font-semibold"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span>View Details</span>
                  </button>
                </div>

                <div className="flex items-center justify-end gap-3 pt-0.5 text-[12px]">
                  <button onClick={() => onReschedule(apt)} className="text-secondary font-semibold flex items-center gap-1 cursor-pointer hover:underline">
                    <span className="material-symbols-outlined text-[14px]">calendar_month</span> Reschedule
                  </button>
                  <span className="text-gray-300">•</span>
                  <button onClick={() => onCancel(apt)} className="text-error font-semibold flex items-center gap-1 cursor-pointer hover:underline">
                    <span className="material-symbols-outlined text-[14px]">cancel</span> Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {currentList.length === 0 && (
          <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant">event_busy</span>
            <h4 className="font-headline-md text-base font-bold text-on-surface">No Visits Scheduled</h4>
            <p className="text-xs text-on-surface-variant">All patient appointments under this filter are clear.</p>
          </div>
        )}
      </div>
    </div>
  );
};
