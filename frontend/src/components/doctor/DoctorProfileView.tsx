import React, { useState } from 'react';

interface DoctorProfileViewProps {
  onSignOut: () => void;
  onShowToast: (msg: string) => void;
}

export const DoctorProfileView: React.FC<DoctorProfileViewProps> = ({
  onSignOut,
  onShowToast,
}) => {
  const [availableOpd, setAvailableOpd] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [docProfile, setDocProfile] = useState({
    name: 'Dr. Shiv Gupta, MD',
    title: 'Senior Attending Cardiologist',
    hospital: 'Apollo Hospitals, New Delhi',
    license: 'DMC-8948102-DL',
    abhaId: '91-1892-0194-8201',
    room: 'Room 304, Ste 4B, Cardiology Tower',
    hours: '09:00 AM - 04:30 PM IST • Mon-Fri',
  });

  const [editForm, setEditForm] = useState({ ...docProfile });

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(onSignOut, 800);
  };

  const handleSaveDocProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setDocProfile({ ...editForm });
    setShowEditModal(false);
    onShowToast('Doctor profile updated successfully');
  };

  return (
    <div className="flex flex-col w-full px-4 pt-2 pb-36 max-w-lg mx-auto">
      <div className="pt-2 pb-3 flex items-center justify-between">
        <div>
          <h1 className="font-headline-md text-2xl font-bold text-on-surface">Doctor Profile</h1>
          <p className="font-label-caps text-xs text-on-surface-variant uppercase">Clinical Station • ID #9481</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditForm({ ...docProfile });
            setShowEditModal(true);
          }}
          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          <span>Edit Profile</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3 mb-4">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <img
              alt={docProfile.name}
              className="w-16 h-16 rounded-xl object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDE5t9YjgeORyB6vFfCDeIIIaRa432s4mT_3YjpsWo-llKbwGnOLc8BKHDHcqmz5GpOlyJOVFrtuKF5I43P6I7eZZ2uW_BDtLh-A8GN8ZiefSEeSBGN-8ZWibU6JNb0cN76L92nwC5-8twN7TBjX-4GNbXUWCA3psZCFkMY8kAtsadai5vRAwpVRf9INwyO7cSeY9EE8BXPQIDdJd4ajy3WT9SpCfJeFylNWXlkFd86jBdEpw12yohFgg"
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[13px]">verified</span>
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-lg font-bold text-on-surface">{docProfile.name}</h2>
              <span className="font-label-caps text-[10px] px-2 py-0.5 rounded-full bg-primary-fixed font-bold">FACC</span>
            </div>
            <p className="text-xs text-primary font-semibold mt-0.5">{docProfile.title}</p>
            <div className="flex items-center gap-1 text-on-surface-variant text-xs mt-1">
              <span className="material-symbols-outlined text-[15px] text-primary">local_hospital</span>
              <span>{docProfile.hospital}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="bg-surface-container-low rounded-lg p-2">
            <span className="font-label-caps text-[9px] text-on-surface-variant uppercase">Patients</span>
            <div className="font-bold text-sm text-on-surface">1,420+</div>
            <span className="text-[9px] text-primary">YTD</span>
          </div>
          <div className="bg-surface-container-low rounded-lg p-2">
            <span className="font-label-caps text-[9px] text-on-surface-variant uppercase">Experience</span>
            <div className="font-bold text-sm text-on-surface">22 Yrs</div>
            <span className="text-[9px] text-secondary">Cardiology</span>
          </div>
          <div className="bg-surface-container-low rounded-lg p-2">
            <span className="font-label-caps text-[9px] text-on-surface-variant uppercase">Trust</span>
            <div className="font-bold text-sm text-primary">99.4%</div>
            <span className="text-[9px] text-on-surface-variant">Audited</span>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-lg p-2.5 text-xs flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-on-surface-variant uppercase font-semibold">MCI / NMC License</span>
            <span className="font-data-mono bg-white px-2 py-0.5 rounded border border-gray-200">{docProfile.license}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant uppercase font-semibold">Doctor ABHA ID</span>
            <span className="font-data-mono bg-white px-2 py-0.5 rounded border border-gray-200">{docProfile.abhaId}</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3 mb-4">
        <h3 className="font-headline-md text-sm font-bold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[18px]">medical_services</span>
          Practice & Consultation
        </h3>

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low">
          <div>
            <div className="text-xs font-bold text-on-surface">{availableOpd ? 'Available for OPD & Triage' : 'Paused (Rounding)'}</div>
            <div className="text-[11px] text-on-surface-variant">Patient queue alerts active</div>
          </div>
          <button
            type="button"
            onClick={() => { setAvailableOpd(!availableOpd); onShowToast(availableOpd ? 'Paused' : 'Available'); }}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${availableOpd ? 'bg-primary' : 'bg-gray-300'}`}
          >
            <span className={`inline-block w-4 h-4 bg-white rounded-full transition-transform ${availableOpd ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="p-2.5 bg-surface rounded-lg text-xs">
          <span className="text-on-surface-variant uppercase font-bold block text-[10px]">Consultation Room</span>
          <span className="font-bold text-on-surface">{docProfile.room}</span>
          <span className="text-on-surface-variant block text-[11px]">{docProfile.hours}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="p-2.5 bg-surface-container-low rounded-xl flex items-center justify-between text-xs text-on-surface-variant">
          <span className="flex items-center gap-1 font-label-caps uppercase font-bold">
            <span className="material-symbols-outlined text-primary text-[16px]">security</span> ABDM (ABHA) Compliant
          </span>
          <span className="font-data-mono text-[11px]">v4.8.2-SEC</span>
        </div>

        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="w-full py-3 rounded-xl bg-surface-container-highest text-error font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-error-container"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign Out Securely</span>
        </button>
      </div>

      {/* EDIT DOCTOR PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="w-full max-w-md mx-auto bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div>
                <span className="font-label-caps text-[10px] uppercase font-bold text-primary">Doctor Station</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">Edit Doctor Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-full text-gray-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveDocProfile} className="py-4 space-y-3 text-xs">
              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Doctor Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Title & Clinical Specialty</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Hospital / Medical Center</label>
                <input
                  type="text"
                  required
                  value={editForm.hospital}
                  onChange={(e) => setEditForm({ ...editForm, hospital: e.target.value })}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">MCI / NMC Registration License</label>
                <input
                  type="text"
                  required
                  value={editForm.license}
                  onChange={(e) => setEditForm({ ...editForm, license: e.target.value })}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs font-mono text-on-surface"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">OPD Consultation Room</label>
                <input
                  type="text"
                  required
                  value={editForm.room}
                  onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs text-on-surface"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white font-bold text-xs uppercase rounded-xl shadow-sm cursor-pointer hover:bg-primary-container"
                >
                  Save Profile Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="py-3 px-4 bg-surface-container text-on-surface font-bold text-xs uppercase rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
            {!loggingOut ? (
              <>
                <h3 className="font-headline-md text-base font-bold text-on-surface text-center">End Clinical Session?</h3>
                <p className="text-xs text-on-surface-variant text-center">Are you sure you want to sign out of MEDINEXUS AI?</p>
                <div className="flex flex-col gap-2 pt-2">
                  <button onClick={handleLogout} className="py-2.5 rounded-xl bg-error text-white font-bold text-xs uppercase cursor-pointer">
                    Log Out
                  </button>
                  <button onClick={() => setShowLogoutModal(false)} className="py-2.5 rounded-xl bg-surface-container font-bold text-xs uppercase cursor-pointer">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-xs">
                <span className="material-symbols-outlined text-primary text-[32px] animate-spin">progress_activity</span>
                <p className="font-bold mt-2">Terminating Session...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
