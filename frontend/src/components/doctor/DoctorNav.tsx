import React from 'react';
import { DoctorTab } from '../../types';

interface DoctorNavProps {
  activeTab: DoctorTab;
  onTabChange: (tab: DoctorTab) => void;
  hasAlerts?: boolean;
}

export const DoctorNav: React.FC<DoctorNavProps> = ({
  activeTab,
  onTabChange,
  hasAlerts = true,
}) => {
  const navItems: { tab: DoctorTab; label: string; icon: string }[] = [
    { tab: 'home', label: 'Home', icon: 'dashboard' },
    { tab: 'patients', label: 'Patients', icon: 'group' },
    { tab: 'schedule', label: 'Schedule', icon: 'calendar_today' },
    { tab: 'alerts', label: 'Alerts', icon: 'crisis_alert' },
    { tab: 'profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-40 pb-safe bg-surface/90 backdrop-blur-xl border-t border-outline-variant/30 shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => onTabChange(item.tab)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] h-14 transition-colors cursor-pointer relative ${
                isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              <span className="font-label-caps text-[11px] tracking-tight mt-0.5">{item.label}</span>
              {item.tab === 'alerts' && hasAlerts && (
                <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-error ring-2 ring-surface"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
