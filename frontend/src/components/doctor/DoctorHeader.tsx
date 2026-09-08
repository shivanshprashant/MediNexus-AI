import React from 'react';
import { DoctorTab } from '../../types';

interface DoctorHeaderProps {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  unreadNotificationsCount: number;
}

export const DoctorHeader: React.FC<DoctorHeaderProps> = ({
  onOpenNotifications,
  onOpenProfile,
  unreadNotificationsCount,
}) => {
  return (
    <header className="fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 pt-safe transition-shadow duration-200">
      <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-4xl mx-auto">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={onOpenProfile}>
          <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
            <span className="material-symbols-outlined text-[20px]">vital_signs</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-caps uppercase tracking-wider text-primary font-bold text-[11px]">
              MEDINEXUS AI
            </span>
            <span className="font-headline-md text-[15px] leading-tight font-semibold text-on-surface truncate">
              Dr. Shiv Gupta
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="w-10 h-10 relative flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
            onClick={onOpenNotifications}
          >
            <span className="material-symbols-outlined text-[23px]">notifications</span>
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-error ring-2 ring-surface"></span>
            )}
          </button>

          <button
            type="button"
            aria-label="Doctor Profile"
            className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
            onClick={onOpenProfile}
          >
            <img
              alt="Dr. Shiv Gupta"
              className="w-8 h-8 rounded-full object-cover border border-outline-variant/40"
              src="https://lh3.googleusercontent.com/aida/AEtjO1WdsLknfBntsioHzvTNxERoyz2hVIQA5HhaO5cCN1i-10yxl6xUHh2PPNmqm2wd_E8helijvNtRZetVOoxy7oiqmYdZ342pdxHfW3hjbPZxw_oaQWMW94cI5ieLwWASG3leEiKlrmnw_hfUJsK5NQVcJoPO4qBLP9ZS3wgv0IUJq-UYpwylhakjjAX7sG10_nXQZm9gveWTqJS1HhOl6FHD_SGX6EMiUN7_PszWs0slLRGsPbCBuDxRpsiH"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-surface"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
