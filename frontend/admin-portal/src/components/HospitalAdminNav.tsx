import React from 'react';
import { HospitalAdminTab } from '../types';

interface HospitalAdminNavProps {
  activeTab: HospitalAdminTab;
  onTabChange: (tab: HospitalAdminTab) => void;
  unreadNotificationsCount?: number;
  emergencyRequestsCount?: number;
}

export const HospitalAdminNav: React.FC<HospitalAdminNavProps> = ({
  activeTab,
  onTabChange,
  unreadNotificationsCount = 0,
  emergencyRequestsCount = 0,
}) => {
  const navItems: { tab: HospitalAdminTab; label: string; icon: string; badge?: number }[] = [
    { tab: 'dashboard', label: 'Home', icon: 'dashboard' },
    { tab: 'departments', label: 'Depts', icon: 'account_tree' },
    { tab: 'emergency-requests', label: 'Emergency', icon: 'crisis_alert', badge: emergencyRequestsCount },
    { tab: 'beds', label: 'Beds', icon: 'single_bed' },
    { tab: 'doctors', label: 'Doctors', icon: 'stethoscope' },
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
              className={`flex flex-col items-center justify-center min-w-[48px] sm:min-w-[56px] min-h-[44px] h-14 transition-colors cursor-pointer relative ${
                isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[22px] sm:text-[24px]">{item.icon}</span>
              <span className="font-label-caps text-[10px] sm:text-[11px] tracking-tight mt-0.5">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-2 right-2 sm:right-3 w-2 h-2 rounded-full bg-error ring-2 ring-surface"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
