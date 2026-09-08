import React, { useState } from 'react';

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

interface PatientProfileViewProps {
  onSignOut: () => void;
  onShowToast: (msg: string) => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  onSignOut,
  onShowToast,
}) => {
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);

  // Profile State
  const [profile, setProfile] = useState({
    name: 'Ananya Sharma',
    age: '29',
    gender: 'Female',
    city: 'New Delhi',
    bloodGroup: 'O+',
    phone: '+91 98192 83104',
    allergies: 'Penicillin, Sulfa Drugs',
    abhaId: '91-4820-5912-4091@abha',
    insuranceProvider: 'Star Health & Allied Insurance (Optima Secure)',
    policyNo: 'P/191201/01/2026/00912',
    network: 'Cashless (Apollo/Max/Fortis)',
  });

  // Edit Profile Form Buffer State
  const [editForm, setEditForm] = useState({ ...profile });

  // Emergency Contacts State
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    {
      id: 'ec-1',
      name: 'Rajesh Sharma',
      relationship: 'Husband',
      phone: '+91 98192 83104',
      isPrimary: true,
    },
    {
      id: 'ec-2',
      name: 'Sunita Sharma',
      relationship: 'Mother',
      phone: '+91 98201 44812',
      isPrimary: false,
    },
  ]);

  // New Emergency Contact Form State
  const [newContact, setNewContact] = useState({
    name: '',
    relationship: 'Father',
    phone: '+91 ',
    isPrimary: false,
  });

  const reports = [
    { title: 'Comprehensive Lipid Profile & HbA1c', date: 'Oct 18, 2026', doctor: 'Dr. Lal PathLabs', verified: true },
    { title: '12-Lead Electrocardiogram Trace (ECG)', date: 'Aug 10, 2026', doctor: 'Apollo Diagnostics', verified: true },
    { title: 'Complete Blood Count (CBC) & ESR', date: 'Jul 04, 2026', doctor: 'Metropolis Healthcare', verified: true },
    { title: 'Thyroid Profile (T3, T4, TSH)', date: 'May 19, 2026', doctor: 'SRL Diagnostics', verified: true },
  ];

  // Save Profile Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({ ...editForm });
    setShowEditProfileModal(false);
    onShowToast('Profile details updated successfully!');
  };

  // Add Emergency Contact Handler
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim()) return;

    const contact: EmergencyContact = {
      id: `ec-${Date.now()}`,
      name: newContact.name.trim(),
      relationship: newContact.relationship,
      phone: newContact.phone.trim(),
      isPrimary: newContact.isPrimary,
    };

    if (newContact.isPrimary) {
      setEmergencyContacts((prev) =>
        prev.map((c) => ({ ...c, isPrimary: false })).concat(contact)
      );
    } else {
      setEmergencyContacts((prev) => [...prev, contact]);
    }

    setNewContact({ name: '', relationship: 'Father', phone: '+91 ', isPrimary: false });
    setShowAddContactModal(false);
    onShowToast(`Emergency contact "${contact.name}" added successfully`);
  };

  // Delete Emergency Contact Handler
  const handleDeleteContact = (id: string, name: string) => {
    setEmergencyContacts((prev) => prev.filter((c) => c.id !== id));
    onShowToast(`Removed ${name} from emergency contacts`);
  };

  return (
    <div className="flex flex-col w-full px-4 pt-2 pb-36 max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-2 pb-3 flex items-center justify-between">
        <div>
          <h1 className="font-headline-md text-2xl font-bold text-on-surface">Patient Profile & ABHA Vault</h1>
          <p className="text-xs text-on-surface-variant font-data-mono">ABHA ID: {profile.abhaId} • Active EHR</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditForm({ ...profile });
            setShowEditProfileModal(true);
          }}
          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Patient Main Card */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-3 mb-4">
        <div className="flex items-start gap-4">
          <img
            alt={profile.name}
            className="w-16 h-16 rounded-xl object-cover border border-outline-variant/30 shrink-0"
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-lg font-bold text-on-surface">{profile.name}</h2>
              <button
                type="button"
                onClick={() => {
                  setEditForm({ ...profile });
                  setShowEditProfileModal(true);
                }}
                className="text-primary hover:underline text-xs font-bold cursor-pointer"
              >
                Edit
              </button>
            </div>
            <p className="text-xs text-on-surface-variant">{profile.age} Years • {profile.gender} • {profile.city}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-xs">Blood: {profile.bloodGroup}</span>
              <span className="px-2 py-0.5 rounded bg-secondary-container text-secondary font-bold text-xs">ABHA Linked</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-lg p-3 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-on-surface-variant uppercase font-bold text-[10px]">Mobile Phone</span>
            <span className="font-data-mono font-bold text-on-surface">{profile.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant uppercase font-bold text-[10px]">Known Allergies</span>
            <span className="text-error font-bold">{profile.allergies}</span>
          </div>
        </div>
      </div>

      {/* Emergency Contacts Section */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-headline-md text-sm font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-error text-[18px]">phone_in_talk</span>
            Emergency Contacts ({emergencyContacts.length})
          </h3>
          <button
            type="button"
            onClick={() => setShowAddContactModal(true)}
            className="px-2.5 py-1 bg-primary text-white hover:bg-primary-container rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1 shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">add</span> Add Contact
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {emergencyContacts.map((contact) => (
            <div
              key={contact.id}
              className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between border border-outline-variant/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-error-container text-on-error-container flex items-center justify-center font-bold text-xs shrink-0">
                  {contact.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs text-on-surface font-bold">{contact.name}</strong>
                    <span className="text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.2 rounded font-medium">
                      {contact.relationship}
                    </span>
                    {contact.isPrimary && (
                      <span className="text-[9px] uppercase font-bold bg-error text-white px-1.5 py-0.2 rounded">
                        PRIMARY
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-on-surface-variant mt-0.5">
                    {contact.phone}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onShowToast(`Calling ${contact.name} (${contact.phone})...`)}
                  className="p-1.5 text-primary hover:bg-primary/10 rounded-full cursor-pointer"
                  title="Call Contact"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </button>
                {emergencyContacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteContact(contact.id, contact.name)}
                    className="p-1.5 text-gray-400 hover:text-error hover:bg-error/10 rounded-full cursor-pointer transition-colors"
                    title="Remove Contact"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insurance Card (Indian Context) */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-headline-md text-sm font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
            Health Insurance & Ayushman Coverage
          </h3>
          <span className="text-xs text-primary font-bold">Cashless Active</span>
        </div>
        <div className="p-3 bg-primary-container/20 rounded-lg border border-primary/20 flex flex-col gap-1 text-xs">
          <span className="font-bold text-on-surface">{profile.insuranceProvider}</span>
          <div className="flex justify-between text-[11px] text-on-surface-variant mt-1">
            <span>Policy No: <strong>{profile.policyNo}</strong></span>
            <span>Network: <strong>{profile.network}</strong></span>
          </div>
        </div>
      </div>

      {/* Uploaded Diagnostic Records */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-headline-md text-sm font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">folder_open</span>
            Diagnostic Reports & Lab Vault
          </h3>
          <button
            type="button"
            onClick={() => onShowToast('Upload PDF/Scan to ABHA Vault simulated')}
            className="px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded text-[11px] font-bold text-primary cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">upload</span> Upload Report
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {reports.map((r, i) => (
            <div key={i} className="p-2.5 bg-surface-container-low rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[20px]">picture_as_pdf</span>
                <div>
                  <strong className="text-on-surface block truncate max-w-[200px]">{r.title}</strong>
                  <span className="text-[10px] text-on-surface-variant">{r.date} • {r.doctor}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onShowToast(`Downloading ${r.title}`)}
                className="p-1.5 text-primary hover:bg-surface-container rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sign out button */}
      <button
        type="button"
        onClick={() => setShowSignOutModal(true)}
        className="w-full py-3 rounded-xl bg-surface-container-highest text-error font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-error-container"
      >
        <span className="material-symbols-outlined text-[18px]">logout</span>
        <span>Sign Out of Patient Account</span>
      </button>

      {/* MODAL 1: EDIT PROFILE */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="w-full max-w-md mx-auto bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div>
                <span className="font-label-caps text-[10px] uppercase font-bold text-primary">Patient Vault</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">Edit Profile Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="p-1 rounded-full text-gray-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="py-4 space-y-3 text-xs">
              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs text-on-surface"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Age</label>
                  <input
                    type="number"
                    required
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs text-center text-on-surface"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs text-on-surface"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Blood Group</label>
                  <select
                    value={editForm.bloodGroup}
                    onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                    className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs text-on-surface font-mono"
                  >
                    {['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Mobile Phone</label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs text-on-surface font-mono"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">City / Location</label>
                <input
                  type="text"
                  required
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Known Allergies</label>
                <input
                  type="text"
                  value={editForm.allergies}
                  onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs text-error font-medium"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Insurance Provider</label>
                <input
                  type="text"
                  value={editForm.insuranceProvider}
                  onChange={(e) => setEditForm({ ...editForm, insuranceProvider: e.target.value })}
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
                  onClick={() => setShowEditProfileModal(false)}
                  className="py-3 px-4 bg-surface-container text-on-surface font-bold text-xs uppercase rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD EMERGENCY CONTACT */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="w-full max-w-md mx-auto bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div>
                <span className="font-label-caps text-[10px] uppercase font-bold text-error">Emergency Response</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">Add Emergency Contact</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddContactModal(false)}
                className="p-1 rounded-full text-gray-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddContact} className="py-4 space-y-3 text-xs">
              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Contact Person Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Relationship</label>
                <select
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs text-on-surface"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Husband">Husband</option>
                  <option value="Wife">Wife</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Friend">Friend</option>
                  <option value="Doctor">Doctor / Caregiver</option>
                </select>
              </div>

              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs text-on-surface font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primaryContactToggle"
                  checked={newContact.isPrimary}
                  onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="primaryContactToggle" className="text-xs font-bold text-on-surface cursor-pointer">
                  Set as Primary Emergency Contact
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-error text-white font-bold text-xs uppercase rounded-xl shadow-sm cursor-pointer hover:bg-error-container"
                >
                  Add Emergency Contact
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="py-3 px-4 bg-surface-container text-on-surface font-bold text-xs uppercase rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SIGN OUT */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
            <h3 className="font-headline-md text-base font-bold text-on-surface text-center">Log Out Patient Portal?</h3>
            <p className="text-xs text-on-surface-variant text-center">Your ABHA active session will be ended securely.</p>
            <div className="flex flex-col gap-2 pt-2">
              <button onClick={onSignOut} className="py-2.5 rounded-xl bg-error text-white font-bold text-xs uppercase cursor-pointer">
                Confirm Log Out
              </button>
              <button onClick={() => setShowSignOutModal(false)} className="py-2.5 rounded-xl bg-surface-container font-bold text-xs uppercase cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
