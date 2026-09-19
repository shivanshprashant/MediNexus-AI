import React, { useState, useEffect, useRef } from 'react';
import { updatePatientProfileApi, fetchPatientProfileApi, uploadPatientPhotoApi, uploadPatientReportApi, fetchPatientReportsApi, deletePatientReportApi, API_BASE_URL } from '../../services/api';

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
  patientProfile?: any;
  onProfileUpdated?: (updated: any) => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  onSignOut,
  onShowToast,
  patientProfile,
  onProfileUpdated,
}) => {
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // Profile State
  const [profile, setProfile] = useState({
    name: 'Ananya Sharma',
    age: '29',
    dob: '',
    gender: 'Female',
    city: 'New Delhi',
    bloodGroup: 'O+',
    phone: '+91 98192 83104',
    allergies: 'Penicillin, Sulfa Drugs',
    abhaId: '91-4820-5912-4091@abha',
    insuranceProvider: 'Star Health & Allied Insurance (Optima Secure)',
    policyNo: 'P/191201/01/2026/00912',
    network: 'Cashless (Apollo/Max/Fortis)',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  // Edit Profile Form Buffer State
  const [editForm, setEditForm] = useState({ ...profile });

  const parseCityFromHistory = (hist: string) => {
    if (!hist) return '';
    const match = hist.match(/City:\s*([^,]+)/i);
    return match ? match[1].trim() : '';
  };

  const applyProfileData = (data: any) => {
    if (!data) return;
    const extractedCity = parseCityFromHistory(data.history);
    const newProf = {
      name: data.name || 'Ananya Sharma',
      age: data.age ? String(data.age) : '29',
      dob: data.dob || '',
      gender: data.gender || 'Female',
      city: extractedCity || 'New Delhi',
      bloodGroup: data.blood || 'O+',
      phone: data.phone || '+91 98192 83104',
      allergies: data.allergies || 'None recorded',
      abhaId: data.mrn ? `${data.mrn}@abha` : '91-4820-5912-4091@abha',
      insuranceProvider: 'Star Health & Allied Insurance (Optima Secure)',
      policyNo: 'P/191201/01/2026/00912',
      network: 'Cashless (Apollo/Max/Fortis)',
      photo: data.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };
    setProfile(newProf);
    setEditForm(newProf);
    if (data.emergency_contact) {
      try {
        const parsed = JSON.parse(data.emergency_contact);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEmergencyContacts(parsed);
        } else if (typeof data.emergency_contact === 'string' && data.emergency_contact.trim()) {
          setEmergencyContacts([{
            id: 'ec-1',
            name: data.emergency_contact.split(/[:(]/)[0].trim(),
            relationship: 'Primary Contact',
            phone: data.emergency_contact.includes(':') ? data.emergency_contact.split(':')[1].trim() : data.emergency_contact,
            isPrimary: true,
          }]);
        }
      } catch (e) {
        if (typeof data.emergency_contact === 'string' && data.emergency_contact.trim()) {
          setEmergencyContacts([{
            id: 'ec-1',
            name: data.emergency_contact.split(/[:(]/)[0].trim(),
            relationship: 'Primary Contact',
            phone: data.emergency_contact.includes(':') ? data.emergency_contact.split(':')[1].trim() : data.emergency_contact,
            isPrimary: true,
          }]);
        }
      }
    }
  };

  useEffect(() => {
    if (patientProfile) {
      applyProfileData(patientProfile);
    } else {
      fetchPatientProfileApi().then((data) => {
        if (data) applyProfileData(data);
      });
    }
  }, [patientProfile]);

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
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [newContact, setNewContact] = useState({
    name: '',
    relationship: 'Father',
    phone: '+91 ',
    isPrimary: false,
  });

  const syncEmergencyContactsApi = async (updatedList: EmergencyContact[]) => {
    try {
      const updated = await updatePatientProfileApi({
        emergency_contact: JSON.stringify(updatedList)
      });
      if (updated && onProfileUpdated) {
        onProfileUpdated(updated);
      }
    } catch (err) {
      console.warn('Failed to sync emergency contact to backend:', err);
    }
  };

  const [reports, setReports] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const loadReports = async () => {
    try {
      const data = await fetchPatientReportsApi();
      setReports(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadPatientReportApi(file);
      onShowToast('Report uploaded successfully');
      loadReports();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to upload report');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await deletePatientReportApi(reportId);
      onShowToast('Report deleted');
      loadReports();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete report');
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      onShowToast('Invalid image type. Allowed: JPEG, PNG, WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onShowToast('File size exceeds 5MB limit.');
      return;
    }
    setSelectedPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedPhoto = editForm.photo;
    if (selectedPhotoFile) {
      try {
        const photoRes = await uploadPatientPhotoApi(selectedPhotoFile);
        if (photoRes && photoRes.photo) {
          updatedPhoto = photoRes.photo;
        }
      } catch (err: any) {
        onShowToast(err.message || 'Photo upload failed.');
      }
    }

    const currentForm = { ...editForm, photo: updatedPhoto };
    setProfile(currentForm);
    setShowEditProfileModal(false);
    try {
      const updated = await updatePatientProfileApi({
        name: currentForm.name,
        age: parseInt(currentForm.age) || undefined,
        dob: currentForm.dob || undefined,
        gender: currentForm.gender,
        blood: currentForm.bloodGroup,
        phone: currentForm.phone,
        allergies: currentForm.allergies,
        meds: profile.allergies,
        history: `Age: ${currentForm.age}, Gender: ${currentForm.gender}, City: ${currentForm.city}`,
        photo: updatedPhoto,
      });
      if (updated) {
        applyProfileData(updated);
        if (onProfileUpdated) onProfileUpdated(updated);
      }
    } catch (err) {
      console.warn('Update patient profile API fallback:', err);
    }
    setSelectedPhotoFile(null);
    setPhotoPreviewUrl(null);
    onShowToast('Profile details updated successfully!');
  };

  // Add/Edit Emergency Contact Handler
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim()) return;

    let updatedList: EmergencyContact[];
    if (editingContactId) {
      updatedList = emergencyContacts.map((c) => {
        if (c.id === editingContactId) {
          return {
            ...c,
            name: newContact.name.trim(),
            relationship: newContact.relationship,
            phone: newContact.phone.trim(),
            isPrimary: newContact.isPrimary,
          };
        }
        return newContact.isPrimary ? { ...c, isPrimary: false } : c;
      });
    } else {
      const contact: EmergencyContact = {
        id: `ec-${Date.now()}`,
        name: newContact.name.trim(),
        relationship: newContact.relationship,
        phone: newContact.phone.trim(),
        isPrimary: newContact.isPrimary,
      };
      if (newContact.isPrimary) {
        updatedList = emergencyContacts.map((c) => ({ ...c, isPrimary: false })).concat(contact);
      } else {
        updatedList = [...emergencyContacts, contact];
      }
    }

    setEmergencyContacts(updatedList);
    syncEmergencyContactsApi(updatedList);

    setNewContact({ name: '', relationship: 'Father', phone: '+91 ', isPrimary: false });
    setEditingContactId(null);
    setShowAddContactModal(false);
    onShowToast(`Emergency contact "${newContact.name}" saved successfully`);
  };

  const handleStartEditContact = (contact: EmergencyContact) => {
    setEditingContactId(contact.id);
    setNewContact({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      isPrimary: contact.isPrimary,
    });
    setShowAddContactModal(true);
  };

  // Delete Emergency Contact Handler
  const handleDeleteContact = (id: string, name: string) => {
    const updatedList = emergencyContacts.filter((c) => c.id !== id);
    setEmergencyContacts(updatedList);
    syncEmergencyContactsApi(updatedList);
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
            src={profile.photo}
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
                  onClick={() => handleStartEditContact(contact)}
                  className="p-1.5 text-primary hover:bg-primary/10 rounded-full cursor-pointer"
                  title="Edit Contact"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cleanNumber = contact.phone.replace(/[^\d+]/g, '');
                    onShowToast(`Calling ${contact.name} (${contact.phone})...`);
                    if (cleanNumber) {
                      window.location.href = `tel:${cleanNumber}`;
                    }
                  }}
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
          <label className="px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded text-[11px] font-bold text-primary cursor-pointer flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">{isUploading ? 'hourglass_empty' : 'upload'}</span> 
            {isUploading ? 'Uploading...' : 'Upload Report'}
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          {reports.length === 0 && (
            <div className="text-center p-4 text-xs text-on-surface-variant">
              No reports uploaded yet.
            </div>
          )}
          {reports.map((r) => (
            <div key={r.id} className="p-2.5 bg-surface-container-low rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  {r.fileType?.includes('pdf') ? 'picture_as_pdf' : 'image'}
                </span>
                <div>
                  <strong className="text-on-surface block truncate max-w-[200px]" title={r.fileName}>{r.fileName}</strong>
                  <span className="text-[10px] text-on-surface-variant">
                    {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString() : 'Unknown date'} • 
                    {(r.fileSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={`${API_BASE_URL.replace('/api', '')}${r.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-primary hover:bg-surface-container rounded-full cursor-pointer"
                  title="View/Download"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleDeleteReport(r.id)}
                  className="p-1.5 text-error hover:bg-error-container rounded-full cursor-pointer"
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
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
              <div className="flex items-center gap-3 p-2 bg-surface-container-low rounded-xl border border-gray-200">
                <img
                  src={photoPreviewUrl || editForm.photo || profile.photo}
                  alt={profile.name}
                  className="w-12 h-12 rounded-xl object-cover border border-outline-variant/30 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-on-surface block truncate">Profile Photo</span>
                  <span className="text-[10px] text-gray-500 block">JPEG, PNG, WEBP (Max 5MB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-primary text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-primary-container shrink-0"
                >
                  Change Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
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
                  <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={editForm.dob || ''}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
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
                <h3 className="font-headline-md text-base font-bold text-on-surface">
                  {editingContactId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingContactId(null);
                  setShowAddContactModal(false);
                }}
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
                  {editingContactId ? 'Save Contact' : 'Add Emergency Contact'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingContactId(null);
                    setShowAddContactModal(false);
                  }}
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
