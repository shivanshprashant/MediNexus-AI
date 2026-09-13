import React, { useState } from 'react';
import { HospitalProfile } from '../types';

interface HospitalProfileViewProps {
  profile: HospitalProfile;
  onUpdateProfile: (updated: HospitalProfile) => void;
  onShowToast: (msg: string) => void;
  onSignOut: () => void;
}

export const HospitalProfileView: React.FC<HospitalProfileViewProps> = ({
  profile,
  onUpdateProfile,
  onShowToast,
  onSignOut,
}) => {
  const [name, setName] = useState(profile.name);
  const [address, setAddress] = useState(profile.address);
  const [contactPhone, setContactPhone] = useState(profile.contactPhone);
  const [emergencyDept, setEmergencyDept] = useState(profile.emergencyDepartment);
  const [adminName, setAdminName] = useState(profile.adminName);
  const [adminEmail, setAdminEmail] = useState(profile.adminEmail);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: HospitalProfile = {
      ...profile,
      name,
      address,
      contactPhone,
      emergencyDepartment: emergencyDept,
      adminName,
      adminEmail,
    };
    onUpdateProfile(updated);
    onShowToast('Hospital profile settings updated successfully!');
  };

  return (
    <div className="space-y-6 antialiased pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-[#d2e2d8] rounded-2xl p-5 md:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1b3b32] px-2 py-0.5 bg-[#e1eee7] rounded border border-[#b8dbc0]">
              Facility Settings
            </span>
            <span className="text-xs text-[#526860] font-mono">
              Hospital ID: {profile.hospitalCode}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-1 tracking-tight font-headline-md">
            Hospital Profile & Admin Settings
          </h2>
          <p className="text-xs text-[#526860] mt-0.5">
            Configure hospital identity, emergency department details, contact numbers, and administrative credentials.
          </p>
        </div>

        <button
          onClick={onSignOut}
          className="px-4 py-2 rounded-xl bg-[#2a1d20] hover:bg-[#3d252a] text-[#ff8a93] hover:text-white border border-[#4d2d33] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign Out Admin</span>
        </button>
      </div>

      {/* Main Profile Form Card */}
      <div className="bg-white border border-[#d2e2d8] rounded-2xl p-6 shadow-2xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 font-headline-md">
              Hospital Information
            </h3>
            <p className="text-xs text-[#526860]">
              Public identity details for emergency network discovery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Hospital Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Hospital Network Code (Read Only)
              </label>
              <input
                type="text"
                disabled
                value={profile.hospitalCode}
                className="w-full text-xs font-mono font-bold rounded-xl border border-gray-200 bg-gray-100 text-gray-600 py-2.5 px-3 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Hospital Address
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Emergency Contact Phone
              </label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full text-xs font-mono rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Emergency Department Specification
            </label>
            <input
              type="text"
              required
              value={emergencyDept}
              onChange={(e) => setEmergencyDept(e.target.value)}
              className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3 outline-none"
            />
          </div>

          <div className="border-t border-b border-gray-100 py-4 my-2 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-headline-md">
                Administrator Profile
              </h3>
              <p className="text-xs text-[#526860]">
                Designated operational lead for CityCare Node
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Administrator Full Name
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Admin Official Email
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] bg-[#fafdfb] text-gray-900 py-2.5 px-3 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Available Specialty Services
            </label>
            <div className="flex flex-wrap gap-2">
              {profile.availableServices.map((svc) => (
                <span
                  key={svc}
                  className="px-3 py-1 rounded-lg bg-[#f0f6f2] text-[#1b3b32] border border-[#c4ded3] text-xs font-semibold font-mono"
                >
                  ✓ {svc}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#1b3b32] hover:bg-[#122822] text-white text-xs font-bold tracking-wide transition-all cursor-pointer shadow-xs flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Save Hospital Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
