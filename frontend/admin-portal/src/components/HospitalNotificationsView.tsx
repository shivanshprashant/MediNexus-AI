import React from 'react';
import { NotificationItem } from '../types';

interface HospitalNotificationsViewProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const HospitalNotificationsView: React.FC<HospitalNotificationsViewProps> = ({
  notifications,
  onMarkAllRead,
}) => {
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="space-y-6 antialiased pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-[#d2e2d8] rounded-2xl p-5 md:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1b3b32] px-2 py-0.5 bg-[#e1eee7] rounded border border-[#b8dbc0]">
              Operational Alerts
            </span>
            <span className="text-xs text-[#526860] font-mono">
              Node HSP-001 (CityCare Hospital)
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-1 tracking-tight font-headline-md">
            Hospital Notifications & Logs
          </h2>
          <p className="text-xs text-[#526860] mt-0.5">
            Real-time feed of emergency intakes, duty updates, bed allocation alerts, and system notices.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="px-4 py-2 rounded-xl bg-[#1b3b32] hover:bg-[#122822] text-white text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-xs flex items-center gap-1.5 self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Notifications Feed Container */}
      <div className="bg-white border border-[#d2e2d8] rounded-2xl p-5 shadow-2xs space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                notif.unread
                  ? 'bg-[#f4f9f6] border-[#b8dbc0] shadow-2xs'
                  : 'bg-white border-gray-100 opacity-90'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    notif.type === 'EMERGENCY'
                      ? 'bg-[#fce8e8] text-[#c92a2a] border border-[#f8c6c6]'
                      : notif.type === 'STAFF'
                      ? 'bg-[#e7f5ff] text-[#1971c2] border border-[#a5d8ff]'
                      : 'bg-[#e1eee7] text-[#1b3b32] border border-[#b8dbc0]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {notif.type === 'EMERGENCY'
                      ? 'e911_emergency'
                      : notif.type === 'STAFF'
                      ? 'badge'
                      : 'notifications'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">
                      {notif.title}
                    </h3>
                    {notif.unread && (
                      <span className="w-2 h-2 rounded-full bg-[#1b3b32]" />
                    )}
                  </div>
                  <p className="text-xs text-[#526860] leading-relaxed mt-1 font-medium">
                    {notif.desc}
                  </p>
                  <span className="text-[10px] font-mono text-gray-400 mt-1 block">
                    {notif.time || 'Just now'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-xs text-[#526860] font-mono">
            No notifications available.
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-[#fafdfb] border border-[#dce8e1] text-xs text-[#526860] font-mono flex items-center gap-2">
        <span className="material-symbols-outlined text-[#1b3b32] text-[18px]">cell_tower</span>
        <span>SSE/WebSocket Ready — Designed to receive server-sent events from FastAPI backend `/api/v1/hospital/notifications/stream`.</span>
      </div>
    </div>
  );
};
