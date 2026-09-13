import React, { useState, useRef } from 'react';
import { DoctorProfileInfo } from '../../types';

interface DoctorProfileViewProps {
  onSignOut: () => void;
  onShowToast: (msg: string) => void;
  docProfile?: DoctorProfileInfo;
  onUpdateDocProfile?: (profile: DoctorProfileInfo) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1594824813511-1376d2994eb6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
];

const DEFAULT_PROFILE: DoctorProfileInfo = {
  name: 'Dr. Shiv Gupta, MD',
  title: 'Senior Attending Cardiologist',
  hospital: 'Apollo Hospitals, New Delhi',
  license: 'DMC-8948102-DL',
  abhaId: '91-1892-0194-8201',
  room: 'Room 304, Ste 4B, Cardiology Tower',
  hours: '09:00 AM - 04:30 PM IST • Mon-Fri',
  photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
};

export const DoctorProfileView: React.FC<DoctorProfileViewProps> = ({
  onSignOut,
  onShowToast,
  docProfile: externalDocProfile,
  onUpdateDocProfile,
}) => {
  const [availableOpd, setAvailableOpd] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const directFileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const activeProfile = externalDocProfile || DEFAULT_PROFILE;
  const [editForm, setEditForm] = useState<DoctorProfileInfo>({ ...activeProfile });

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(onSignOut, 800);
  };

  const handleOpenEditModal = () => {
    setEditForm({ ...activeProfile });
    setShowEditModal(true);
  };

  const handleSaveDocProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateDocProfile) {
      onUpdateDocProfile(editForm);
    }
    setShowEditModal(false);
    onShowToast('Doctor profile updated successfully');
  };

  const handleDirectPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const updated = { ...activeProfile, photo: reader.result };
          if (onUpdateDocProfile) {
            onUpdateDocProfile(updated);
          }
          onShowToast('Profile picture updated successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModalPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditForm((prev) => ({ ...prev, photo: reader.result as string }));
          onShowToast('New photo uploaded to form');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col w-full px-4 pt-2 pb-36 max-w-lg mx-auto">
      <input
        type="file"
        ref={directFileInputRef}
        onChange={handleDirectPhotoUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="pt-2 pb-3 flex items-center justify-between">
        <div>
          <h1 className="font-headline-md text-2xl font-bold text-on-surface">Doctor Profile</h1>
          <p className="font-label-caps text-xs text-on-surface-variant uppercase">Clinical Station • ID #9481</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => directFileInputRef.current?.click()}
            className="px-3 py-1.5 bg-secondary-container hover:bg-secondary-container/80 text-on-secondary-container font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
            title="Update Profile Picture"
          >
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            <span>Update Photo</span>
          </button>
          <button
            type="button"
            onClick={handleOpenEditModal}
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3 mb-4">
        <div className="flex items-start gap-4">
          <div
            className="relative shrink-0 group cursor-pointer"
            onClick={() => directFileInputRef.current?.click()}
            title="Click to update profile photo"
          >
            <img
              alt={activeProfile.name}
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-primary/30 group-hover:opacity-85 transition-opacity"
              src={activeProfile.photo || DEFAULT_PROFILE.photo}
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[14px]">photo_camera</span>
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-lg font-bold text-on-surface">{activeProfile.name}</h2>
              <span className="font-label-caps text-[10px] px-2 py-0.5 rounded-full bg-primary-fixed font-bold">FACC</span>
            </div>
            <p className="text-xs text-primary font-semibold mt-0.5">{activeProfile.title}</p>
            <div className="flex items-center gap-1 text-on-surface-variant text-xs mt-1">
              <span className="material-symbols-outlined text-[15px] text-primary">local_hospital</span>
              <span>{activeProfile.hospital}</span>
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
            <span className="font-data-mono bg-white px-2 py-0.5 rounded border border-gray-200">{activeProfile.license}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant uppercase font-semibold">Doctor ABHA ID</span>
            <span className="font-data-mono bg-white px-2 py-0.5 rounded border border-gray-200">{activeProfile.abhaId}</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3 mb-4">
        <h3 className="font-headline-md text-sm font-bold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[18px]">medical_services</span>
          Practice & Consultation
        </h3>

        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 transition-all">
          <div className="flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
                availableOpd ? 'bg-primary animate-pulse' : 'bg-outline-variant'
              }`}
            />
            <div>
              <div className="text-xs font-bold text-on-surface">
                {availableOpd ? 'Available for OPD & Triage' : 'Paused (Rounding)'}
              </div>
              <div className="text-[11px] text-on-surface-variant">
                {availableOpd ? 'Patient queue alerts active' : 'Queue alerts temporarily paused'}
              </div>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={availableOpd}
            aria-label="Toggle OPD and Triage availability"
            onClick={() => {
              const next = !availableOpd;
              setAvailableOpd(next);
              onShowToast(next ? 'Status: Available for OPD & Triage' : 'Status: Paused (Rounding)');
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              availableOpd ? 'bg-primary' : 'bg-surface-container-highest border-outline-variant/40'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                availableOpd ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="p-2.5 bg-surface rounded-lg text-xs">
          <span className="text-on-surface-variant uppercase font-bold block text-[10px]">Consultation Room</span>
          <span className="font-bold text-on-surface">{activeProfile.room}</span>
          <span className="text-on-surface-variant block text-[11px]">{activeProfile.hours}</span>
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

      {/* EDIT DOCTOR PROFILE & PHOTO MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="w-full max-w-md mx-auto bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div>
                <span className="font-label-caps text-[10px] uppercase font-bold text-primary">Doctor Station</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">Edit Profile & Picture</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-full text-gray-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveDocProfile} className="py-4 space-y-4 text-xs">
              {/* Profile Picture Section */}
              <div className="bg-surface-container-low p-3.5 rounded-xl space-y-3">
                <label className="font-bold uppercase text-[10px] text-gray-600 block">Profile Picture</label>
                
                <div className="flex items-center gap-3">
                  <img
                    src={editForm.photo || DEFAULT_PROFILE.photo}
                    alt="Preview"
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-primary/40 shadow-sm"
                  />
                  <div className="flex flex-col gap-1 flex-1">
                    <input
                      type="file"
                      ref={modalFileInputRef}
                      onChange={handleModalPhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => modalFileInputRef.current?.click()}
                      className="py-1.5 px-3 bg-primary text-white font-bold text-[11px] rounded-lg cursor-pointer hover:bg-primary-container flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">upload</span>
                      <span>Upload New Image</span>
                    </button>
                    <span className="text-[10px] text-on-surface-variant">Supports JPG, PNG or WebP</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 block mb-1 font-semibold">Or Select Preset Doctor Avatar:</label>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {PRESET_AVATARS.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Preset ${idx + 1}`}
                        onClick={() => setEditForm((prev) => ({ ...prev, photo: url }))}
                        className={`w-10 h-10 rounded-lg object-cover cursor-pointer transition-all ${
                          editForm.photo === url ? 'ring-2 ring-primary scale-105 shadow-md' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

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
