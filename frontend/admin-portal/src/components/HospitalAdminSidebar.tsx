import React from 'react';
import { HospitalAdminTab } from '../types';

interface HospitalAdminSidebarProps {
  activeTab: HospitalAdminTab;
  onTabChange: (tab: HospitalAdminTab) => void;
  onSignOut: () => void;
  departmentsCount: number;
  emergencyRequestsCount: number;
  unreadNotificationsCount: number;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const HospitalAdminSidebar: React.FC<HospitalAdminSidebarProps> = ({
  activeTab,
  onTabChange,
  onSignOut,
  departmentsCount,
  emergencyRequestsCount,
  unreadNotificationsCount,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems: {
    id: HospitalAdminTab;
    label: string;
    icon: string;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Overview',
      icon: 'grid_view',
    },
    {
      id: 'departments',
      label: 'Clinical Departments',
      icon: 'account_tree',
      badge: departmentsCount,
      badgeColor: 'bg-[#254d41] text-[#7ce7ba]',
    },
    {
      id: 'emergency-requests',
      label: 'Emergency Requests',
      icon: 'e911_emergency',
      badge: emergencyRequestsCount,
      badgeColor: 'bg-[#d63d4a] text-white',
    },
    {
      id: 'beds',
      label: 'Bed Management',
      icon: 'single_bed',
    },
    {
      id: 'doctors',
      label: 'Doctors & Staff',
      icon: 'stethoscope',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: 'notifications',
      badge: unreadNotificationsCount,
      badgeColor: 'bg-[#1b3b32] text-[#4edea3]',
    },
    {
      id: 'profile',
      label: 'Hospital Profile',
      icon: 'domain',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1b322a] text-white border-r border-[#27463c] w-64 antialiased selection:bg-[#2e594d] selection:text-white">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#27463c] bg-[#162a24]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4edea3]">
            MediNexus AI
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#254d41] text-[#91c9b6]">
            v2.0 Admin
          </span>
        </div>
        <div className="text-xs text-[#a0c5b7] font-sans font-medium mt-0.5">
          Standalone Hospital Admin Console
        </div>
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-mono uppercase font-bold text-[#729c8e] tracking-widest">
          Main Console
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#294c40] text-white shadow-xs border border-[#3b6657]'
                  : 'text-[#b0d2c6] hover:bg-[#213e34] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isActive ? 'text-[#4edea3]' : 'text-[#7caaa0]'
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    item.badgeColor || 'bg-[#203a32] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info & Sign Out */}
      <div className="p-3 border-t border-[#27463c] bg-[#162a24] space-y-2">
        <div className="p-2.5 rounded-xl bg-[#1d372f] border border-[#294c40] text-[11px]">
          <div className="font-mono font-bold text-[#8adbb7] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            <span>Single Hospital Isolation</span>
          </div>
          <p className="text-[10px] text-[#7da698] font-mono mt-0.5 leading-tight">
            Node HSP-001 (CityCare Hospital)
          </p>
        </div>

        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#2a1d20] hover:bg-[#3d252a] text-[#ff8a93] hover:text-white border border-[#4d2d33] text-xs font-semibold transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign Out Admin</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-16 bottom-0 z-30 w-64">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
