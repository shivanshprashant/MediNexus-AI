import React from 'react';
import { PatientTab } from '../../types';

interface PatientHeaderProps {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  unreadCount?: number;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  onOpenNotifications,
  onOpenProfile,
  unreadCount = 1,
}) => {
  return (
    <header className="fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 pt-safe">
      <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={onOpenProfile}>
          <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined text-[20px]">health_and_safety</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-caps uppercase tracking-wider text-primary font-bold text-[10px]">
              MEDINEXUS PATIENT
            </span>
            <span className="font-headline-md text-[15px] leading-tight font-semibold text-on-surface">
              Ananya Sharma
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenNotifications}
            className="w-10 h-10 relative flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error"></span>
            )}
          </button>
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/40 cursor-pointer"
          >
            <img
              alt="Ananya Sharma"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            />
          </button>
        </div>
      </div>
    </header>
  );
};

interface PatientNavProps {
  activeTab: PatientTab;
  onTabChange: (tab: PatientTab) => void;
}

export const PatientNav: React.FC<PatientNavProps> = ({ activeTab, onTabChange }) => {
  const items: { tab: PatientTab; label: string; icon: string }[] = [
    { tab: 'home', label: 'Home', icon: 'home' },
    { tab: 'book', label: 'Book', icon: 'calendar_add_on' },
    { tab: 'records', label: 'Records', icon: 'folder_shared' },
    { tab: 'profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-40 pb-safe bg-surface/90 backdrop-blur-xl border-t border-outline-variant/30 shadow-sm">
      <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
        {items.map((item) => {
          const active = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => onTabChange(item.tab)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] h-14 cursor-pointer transition-colors ${
                active ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              <span className="font-label-caps text-[11px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
