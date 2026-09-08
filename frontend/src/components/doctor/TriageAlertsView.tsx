import React, { useState } from 'react';
import { NotificationItem } from '../../types';

interface TriageAlertsViewProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onSelectNotification: (notif: NotificationItem) => void;
  urgentAcknowledged: boolean;
  onAcknowledgeEmergency: () => void;
  onOpenEmergencyIntake: () => void;
  onOpenEHR: () => void;
}

export const TriageAlertsView: React.FC<TriageAlertsViewProps> = ({
  notifications,
  onMarkAllRead,
  onSelectNotification,
  urgentAcknowledged,
  onAcknowledgeEmergency,
  onOpenEmergencyIntake,
  onOpenEHR,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'alerts'>('all');

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return n.unread;
    if (filter === 'alerts') return n.category === 'alert-log';
    return true;
  });

  return (
    <div className="flex flex-col w-full px-4 pt-2 pb-36 max-w-lg mx-auto">
      <div className="flex flex-col gap-2 pt-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping inline-block"></span>
            <span className="font-label-caps text-[11px] uppercase tracking-wider text-error font-bold">
              Rapid Response Queue
            </span>
          </div>
          <div className="bg-surface-container-high px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-primary text-[15px]">verified_user</span>
            <span className="font-data-mono text-[11px] text-on-surface-variant font-bold">Dr. Shiv Gupta</span>
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <h1 className="font-headline-lg text-2xl font-bold text-on-surface">Triage & Alerts</h1>
          <span className="font-data-mono text-[12px] text-on-surface-variant">SYNC: 14:02 IST</span>
        </div>
      </div>

      {/* Critical Triage Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 flex flex-col gap-3 relative overflow-hidden border border-outline-variant/30 mb-6">
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${urgentAcknowledged ? 'bg-primary' : 'bg-error'}`}></div>
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex gap-3 items-center">
            <div className="w-11 h-11 rounded-xl bg-error-container text-on-error-container flex items-center justify-center font-bold text-base">RS</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline-md text-[16px] font-bold text-on-surface">Rahul Sharma</span>
                <span className="bg-surface-container-high font-data-mono text-[11px] px-1.5 py-0.5 rounded">45 M</span>
              </div>
              <span className="font-data-mono text-[11px] text-on-surface-variant">ID: MED-99428-DL</span>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full font-label-caps text-[10px] uppercase font-bold ${urgentAcknowledged ? 'bg-primary text-white' : 'bg-error-container text-on-error-container'}`}>
            {urgentAcknowledged ? 'Assigned' : '1 Urgent'}
          </span>
        </div>

        <div className="bg-surface-container-low rounded-lg p-3">
          <span className="font-label-caps text-[11px] uppercase text-error font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">vital_signs</span> Clinical Presentation
          </span>
          <p className="font-body-md text-[13px] text-on-surface mt-1">Severe sudden retrosternal chest pain radiating to left arm, acute dizziness, diaphoresis.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-surface-container rounded-lg p-2.5 text-[12px]">
          <div>
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Facility</span>
            <strong className="text-on-surface">City Care Hospital</strong>
            <div className="font-data-mono text-[11px] text-on-surface-variant">Room 304</div>
          </div>
          <div>
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase block">Distance</span>
            <strong className="text-on-surface">2.4 km away</strong>
            <div className="font-data-mono text-[11px] text-primary font-bold">Est. 7m arrival</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button onClick={onOpenEHR} className="bg-surface-container-high py-2.5 px-3 rounded-lg font-label-caps text-xs uppercase font-bold flex items-center justify-center gap-1 cursor-pointer">
            <span className="material-symbols-outlined text-[17px]">folder_shared</span> View EHR
          </button>
          <button onClick={onOpenEmergencyIntake} className="bg-surface-container-high py-2.5 px-3 rounded-lg font-label-caps text-xs uppercase font-bold flex items-center justify-center gap-1 cursor-pointer">
            <span className="material-symbols-outlined text-[17px]">clinical_notes</span> Triage Intake
          </button>
        </div>

        <button
          onClick={onAcknowledgeEmergency}
          className={`w-full py-3 rounded-lg font-label-caps text-xs uppercase font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
            urgentAcknowledged ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary text-white hover:bg-primary-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
          <span>{urgentAcknowledged ? 'Acknowledged & Active' : 'Acknowledge & Accept Case'}</span>
        </button>
      </div>

      {/* Notifications */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-headline-md text-[17px] font-bold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[20px]">notifications_active</span> Notifications
        </h2>
        <button onClick={onMarkAllRead} className="text-primary font-label-caps text-xs uppercase font-bold cursor-pointer hover:underline">
          Mark all read
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        {(['all', 'unread', 'alerts'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full font-label-caps text-xs font-bold uppercase transition-all cursor-pointer ${
              filter === f ? 'bg-primary text-white shadow-xs' : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {filteredNotifs.map((n) => (
          <article
            key={n.id}
            onClick={() => onSelectNotification(n)}
            className={`rounded-xl p-3.5 shadow-sm flex items-start gap-3 cursor-pointer border border-outline-variant/20 ${
              n.unread ? 'bg-surface-container-lowest' : 'bg-surface-container'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-primary-fixed/40 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">{n.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[10px] uppercase font-bold text-primary">{n.type}</span>
                <span className="font-data-mono text-[10px] text-on-surface-variant">{n.timeAgo}</span>
              </div>
              <p className="font-headline-md text-[14px] font-bold text-on-surface mt-0.5 truncate">{n.title}</p>
              <p className="text-xs text-on-surface-variant line-clamp-1">{n.summary}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
