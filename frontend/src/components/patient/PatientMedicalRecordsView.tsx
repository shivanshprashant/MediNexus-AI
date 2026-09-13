import React, { useState, useRef, useMemo } from 'react';
import { MedicalRecord, MedicalRecordCategory } from '../../types';

interface PatientMedicalRecordsViewProps {
  records: MedicalRecord[];
  onUploadRecord: (record: MedicalRecord) => void;
  onShowToast: (msg: string) => void;
}

const CATEGORIES: MedicalRecordCategory[] = [
  'Lab Report',
  'Imaging',
  'Prescription',
  'Discharge Summary',
  'Surgical Note',
  'Follow-Up Note',
  'Other',
];

const FILE_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  pdf: { icon: 'picture_as_pdf', color: 'text-red-500' },
  image: { icon: 'image', color: 'text-blue-500' },
  dicom: { icon: 'radiology', color: 'text-purple-500' },
  doc: { icon: 'description', color: 'text-teal-500' },
};

const CATEGORY_COLORS: Record<string, string> = {
  'Lab Report': 'bg-blue-100 text-blue-700',
  'Imaging': 'bg-purple-100 text-purple-700',
  'Prescription': 'bg-emerald-100 text-emerald-700',
  'Discharge Summary': 'bg-amber-100 text-amber-700',
  'Surgical Note': 'bg-red-100 text-red-700',
  'Follow-Up Note': 'bg-teal-100 text-teal-700',
  'Other': 'bg-gray-100 text-gray-700',
};

export const PatientMedicalRecordsView: React.FC<PatientMedicalRecordsViewProps> = ({
  records,
  onUploadRecord,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | MedicalRecordCategory>('All');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<MedicalRecordCategory>('Lab Report');
  const [uploadDate, setUploadDate] = useState('');
  const [uploadDoctor, setUploadDoctor] = useState('');
  const [uploadDepartment, setUploadDepartment] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Patient records only (filter to Ananya Sharma / patient records)
  // In real app this would filter by logged-in patient ID
  const patientRecords = records;

  const filteredRecords = useMemo(() => {
    let list = [...patientRecords];

    if (categoryFilter !== 'All') {
      list = list.filter((r) => r.category === categoryFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.doctor.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [patientRecords, categoryFilter, search]);

  const resetUploadForm = () => {
    setUploadTitle('');
    setUploadCategory('Lab Report');
    setUploadDate('');
    setUploadDoctor('');
    setUploadDepartment('');
    setUploadNotes('');
    setUploadTags('');
    setUploadFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadSuccess(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      // Auto-fill title from filename if empty
      if (!uploadTitle) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setUploadTitle(nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1));
      }
    }
  };

  const getFileType = (file: File): 'pdf' | 'image' | 'dicom' | 'doc' => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
    if (['dcm', 'dicom'].includes(ext)) return 'dicom';
    return 'doc';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const handleUploadSubmit = () => {
    if (!uploadTitle.trim() || !uploadFile) {
      onShowToast('Please provide a title and select a file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate cloud upload with progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Accelerating progress for natural feel
        const increment = prev < 30 ? 8 : prev < 60 ? 12 : prev < 85 ? 6 : 3;
        return Math.min(prev + increment, 100);
      });
    }, 120);

    // Complete upload after animation
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);

      const newRecord: MedicalRecord = {
        id: `rec-patient-${Date.now()}`,
        patientId: 'patient-self',
        patientName: 'Ananya Sharma',
        patientMrn: 'MN-PT-4091',
        title: uploadTitle.trim(),
        category: uploadCategory,
        date: uploadDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        doctor: uploadDoctor || 'Self-uploaded',
        department: uploadDepartment || 'General',
        fileUrl: '',
        fileType: getFileType(uploadFile!),
        fileSize: formatFileSize(uploadFile!.size),
        notes: uploadNotes,
        uploadedBy: 'patient',
        tags: uploadTags.split(',').map((t) => t.trim()).filter(Boolean),
      };

      setUploadSuccess(true);

      setTimeout(() => {
        onUploadRecord(newRecord);
        onShowToast('Medical record uploaded successfully to cloud storage');
        setShowUploadModal(false);
        resetUploadForm();
      }, 1200);
    }, 2000);
  };

  return (
    <div className="flex flex-col w-full px-4 pt-2 pb-36 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mt-1 mb-3">
        <div>
          <span className="font-label-caps text-primary tracking-widest uppercase text-[11px] font-bold">Health Vault</span>
          <h1 className="font-headline-md text-2xl font-bold text-on-surface">My Medical Records</h1>
        </div>
        <button
          onClick={() => {
            resetUploadForm();
            setShowUploadModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-caps text-[11px] uppercase shadow-md active:scale-95 cursor-pointer font-bold transition-all hover:shadow-lg"
        >
          <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
          <span>Upload</span>
        </button>
      </div>

      {/* Cloud Storage Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary-container/50 to-primary/5 rounded-xl p-4 mb-3 border border-primary/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[24px] text-primary">cloud_done</span>
        </div>
        <div>
          <div className="text-sm font-bold text-on-surface">Secure Cloud Storage</div>
          <div className="text-[11px] text-on-surface-variant">Your records are encrypted and stored securely. Upload reports, prescriptions, and imaging for easy access.</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col items-center">
          <span className="material-symbols-outlined text-[20px] text-primary mb-1">folder</span>
          <div className="font-headline-md text-lg font-bold text-on-surface">{patientRecords.length}</div>
          <div className="font-label-caps text-[9px] text-on-surface-variant uppercase">Total</div>
        </div>
        <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col items-center">
          <span className="material-symbols-outlined text-[20px] text-blue-500 mb-1">science</span>
          <div className="font-headline-md text-lg font-bold text-on-surface">
            {patientRecords.filter((r) => r.category === 'Lab Report').length}
          </div>
          <div className="font-label-caps text-[9px] text-on-surface-variant uppercase">Lab Reports</div>
        </div>
        <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col items-center">
          <span className="material-symbols-outlined text-[20px] text-emerald-500 mb-1">cloud_upload</span>
          <div className="font-headline-md text-lg font-bold text-on-surface">
            {patientRecords.filter((r) => r.uploadedBy === 'patient').length}
          </div>
          <div className="font-label-caps text-[9px] text-on-surface-variant uppercase">Uploaded</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search records, doctors, categories..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar mb-3">
        {(['All', ...CATEGORIES] as const).map((cat) => {
          const count = cat === 'All' ? patientRecords.length : patientRecords.filter((r) => r.category === cat).length;
          if (count === 0 && cat !== 'All') return null;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full font-label-caps text-[11px] uppercase whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-primary text-on-primary shadow-sm font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span>{cat}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${categoryFilter === cat ? 'bg-white/20 text-white' : 'bg-black/10'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Records List */}
      <div className="flex flex-col gap-3">
        {filteredRecords.map((rec) => {
          const fileInfo = FILE_TYPE_ICONS[rec.fileType] || FILE_TYPE_ICONS.doc;
          const catColor = CATEGORY_COLORS[rec.category] || CATEGORY_COLORS.Other;

          return (
            <div
              key={rec.id}
              className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-2 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedRecord(rec)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                    <span className={`material-symbols-outlined text-[22px] ${fileInfo.color}`}>{fileInfo.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] text-on-surface font-bold leading-tight truncate">{rec.title}</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5 font-data-mono">{rec.date} • {rec.doctor}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${catColor}`}>
                  {rec.category}
                </span>
              </div>

              <p className="text-[12px] text-on-surface-variant line-clamp-2 pl-[52px]">{rec.notes}</p>

              <div className="flex items-center justify-between pl-[52px]">
                <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                  <span className="font-mono uppercase">{rec.fileType}</span>
                  <span>•</span>
                  <span>{rec.fileSize}</span>
                </div>
                {rec.uploadedBy === 'patient' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary-container text-on-secondary-container">
                    My Upload
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredRecords.length === 0 && (
          <div className="p-10 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant">
              {search ? 'search_off' : 'folder_off'}
            </span>
            <h4 className="font-headline-md text-base font-bold text-on-surface">
              {search ? 'No Matching Records' : 'No Records Yet'}
            </h4>
            <p className="text-xs text-on-surface-variant max-w-[240px]">
              {search
                ? `No records found for "${search}".`
                : 'Upload your medical reports, prescriptions, and imaging to keep everything in one place.'}
            </p>
            {!search && (
              <button
                onClick={() => { resetUploadForm(); setShowUploadModal(true); }}
                className="mt-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold cursor-pointer active:scale-95"
              >
                Upload Your First Record
              </button>
            )}
          </div>
        )}
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={() => setSelectedRecord(null)}>
          <div
            className="w-full max-w-lg bg-surface rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/30 px-5 py-4 flex items-center justify-between z-10">
              <h3 className="font-headline-md text-base font-bold text-on-surface truncate">{selectedRecord.title}</h3>
              <button onClick={() => setSelectedRecord(null)} className="p-1.5 rounded-full text-gray-500 hover:bg-surface-container cursor-pointer">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <div className="px-5 py-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${CATEGORY_COLORS[selectedRecord.category] || CATEGORY_COLORS.Other}`}>
                  {selectedRecord.category}
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-surface-container text-on-surface-variant">
                  {selectedRecord.fileType.toUpperCase()} • {selectedRecord.fileSize}
                </span>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20 grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1">Doctor</label>
                  <div className="text-sm font-semibold text-on-surface">{selectedRecord.doctor}</div>
                </div>
                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1">Department</label>
                  <div className="text-sm font-semibold text-on-surface">{selectedRecord.department}</div>
                </div>
                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1">Date</label>
                  <div className="text-sm font-semibold text-on-surface font-data-mono">{selectedRecord.date}</div>
                </div>
                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1">Source</label>
                  <div className="text-sm font-semibold text-on-surface capitalize">{selectedRecord.uploadedBy}</div>
                </div>
              </div>

              {selectedRecord.notes && (
                <div>
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-2">Notes</label>
                  <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20 text-sm text-on-surface leading-relaxed">
                    {selectedRecord.notes}
                  </div>
                </div>
              )}

              {selectedRecord.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedRecord.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-mono">#{tag}</span>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  onShowToast(`Downloading ${selectedRecord.title}...`);
                }}
                className="w-full py-3 rounded-xl bg-primary text-on-primary font-label-caps text-xs uppercase flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={() => { if (!isUploading) { setShowUploadModal(false); resetUploadForm(); } }}>
          <div
            className="w-full max-w-lg bg-surface rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/30 px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-primary">cloud_upload</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">Upload Medical Record</h3>
              </div>
              {!isUploading && (
                <button onClick={() => { setShowUploadModal(false); resetUploadForm(); }} className="p-1.5 rounded-full text-gray-500 hover:bg-surface-container cursor-pointer">
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              )}
            </div>

            <div className="px-5 py-5 flex flex-col gap-4">
              {/* Upload Progress / Success State */}
              {isUploading ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  {uploadSuccess ? (
                    <>
                      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center animate-in zoom-in duration-300">
                        <span className="material-symbols-outlined text-[40px] text-emerald-600">cloud_done</span>
                      </div>
                      <div className="text-center">
                        <h4 className="font-headline-md text-lg font-bold text-on-surface">Upload Complete!</h4>
                        <p className="text-sm text-on-surface-variant mt-1">Your record has been securely stored in the cloud.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center relative">
                        <span className="material-symbols-outlined text-[36px] text-primary animate-pulse">cloud_upload</span>
                        <svg className="absolute inset-0 w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="3" className="text-surface-container" />
                          <circle
                            cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="3"
                            className="text-primary"
                            strokeDasharray={`${2 * Math.PI * 36}`}
                            strokeDashoffset={`${2 * Math.PI * 36 * (1 - uploadProgress / 100)}`}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.15s ease' }}
                          />
                        </svg>
                      </div>
                      <div className="text-center">
                        <h4 className="font-headline-md text-lg font-bold text-on-surface">Uploading to Cloud...</h4>
                        <p className="text-sm text-on-surface-variant mt-1">Encrypting and storing your medical record securely.</p>
                      </div>
                      <div className="w-full max-w-[280px]">
                        <div className="flex justify-between text-[11px] text-on-surface-variant mb-1.5">
                          <span>{uploadFile?.name}</span>
                          <span className="font-mono font-bold text-primary">{uploadProgress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-150 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* File Picker */}
                  <div>
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-2">Select File *</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.dcm,.dicom,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {uploadFile ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest border border-primary/30">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <span className={`material-symbols-outlined text-[22px] ${(FILE_TYPE_ICONS[getFileType(uploadFile)] || FILE_TYPE_ICONS.doc).color}`}>
                            {(FILE_TYPE_ICONS[getFileType(uploadFile)] || FILE_TYPE_ICONS.doc).icon}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-on-surface truncate">{uploadFile.name}</div>
                          <div className="text-[11px] text-on-surface-variant">{formatFileSize(uploadFile.size)} • {getFileType(uploadFile).toUpperCase()}</div>
                        </div>
                        <button onClick={() => setUploadFile(null)} className="p-1 rounded-full hover:bg-surface-container cursor-pointer">
                          <span className="material-symbols-outlined text-[18px] text-error">close</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-6 rounded-xl border-2 border-dashed border-outline-variant/50 bg-surface-container-lowest hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[32px] text-on-surface-variant">upload_file</span>
                        <span className="text-sm font-semibold text-on-surface">Choose File</span>
                        <span className="text-[11px] text-on-surface-variant">PDF, Images, DICOM, Documents</span>
                      </button>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1.5">Record Title *</label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="e.g., Blood Test Report - September 2026"
                      className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  {/* Category & Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1.5">Category</label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value as MedicalRecordCategory)}
                        className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1.5">Report Date</label>
                      <input
                        type="date"
                        value={uploadDate}
                        onChange={(e) => setUploadDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Doctor & Department */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1.5">Doctor Name</label>
                      <input
                        type="text"
                        value={uploadDoctor}
                        onChange={(e) => setUploadDoctor(e.target.value)}
                        placeholder="e.g., Dr. Kumar"
                        className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1.5">Department</label>
                      <input
                        type="text"
                        value={uploadDepartment}
                        onChange={(e) => setUploadDepartment(e.target.value)}
                        placeholder="e.g., Cardiology"
                        className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1.5">Notes (optional)</label>
                    <textarea
                      value={uploadNotes}
                      onChange={(e) => setUploadNotes(e.target.value)}
                      placeholder="Any additional notes about this report..."
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1.5">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="e.g., blood test, cholesterol, annual checkup"
                      className="w-full px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleUploadSubmit}
                    disabled={!uploadTitle.trim() || !uploadFile}
                    className={`w-full py-3.5 rounded-xl font-label-caps text-sm uppercase flex items-center justify-center gap-2 font-bold transition-all ${
                      uploadTitle.trim() && uploadFile
                        ? 'bg-primary text-on-primary shadow-md active:scale-95 cursor-pointer hover:shadow-lg'
                        : 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                    Upload to Cloud
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
