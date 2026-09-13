import React, { useState, useMemo } from 'react';
import { MedicalRecord, MedicalRecordCategory } from '../../types';

interface MedicalRecordsViewProps {
  records: MedicalRecord[];
  onShowToast: (msg: string) => void;
}

const ALL_CATEGORIES: ('All' | MedicalRecordCategory)[] = [
  'All',
  'Lab Report',
  'Imaging',
  'Prescription',
  'Discharge Summary',
  'Surgical Note',
  'Follow-Up Note',
  'Other',
];

const DATE_PRESETS = [
  { label: 'All Time', days: 0 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'Last Year', days: 365 },
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

const UPLOADED_BY_BADGE: Record<string, { label: string; cls: string }> = {
  doctor: { label: 'Doctor', cls: 'bg-primary/10 text-primary' },
  patient: { label: 'Patient Upload', cls: 'bg-secondary-container text-on-secondary-container' },
  system: { label: 'System', cls: 'bg-surface-container-high text-on-surface-variant' },
};

export const MedicalRecordsView: React.FC<MedicalRecordsViewProps> = ({
  records,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | MedicalRecordCategory>('All');
  const [patientFilter, setPatientFilter] = useState('All');
  const [datePreset, setDatePreset] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Unique patient names for filter
  const uniquePatients = useMemo(() => {
    const names = Array.from(new Set(records.map((r) => r.patientName)));
    return ['All', ...names.sort()];
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    let list = [...records];

    // Category filter
    if (categoryFilter !== 'All') {
      list = list.filter((r) => r.category === categoryFilter);
    }

    // Patient filter
    if (patientFilter !== 'All') {
      list = list.filter((r) => r.patientName === patientFilter);
    }

    // Date filter
    if (datePreset > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - datePreset);
      list = list.filter((r) => {
        const d = new Date(r.date);
        return !isNaN(d.getTime()) && d >= cutoff;
      });
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.patientName.toLowerCase().includes(q) ||
          r.patientMrn.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.doctor.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          r.notes.toLowerCase().includes(q)
      );
    }

    // Sort by date descending
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return list;
  }, [records, categoryFilter, patientFilter, datePreset, search]);

  return (
    <div className="flex flex-col w-full px-4 pt-2 pb-36 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mt-1 mb-3">
        <div>
          <span className="font-label-caps text-primary tracking-widest uppercase text-[11px] font-bold">Clinical Archive</span>
          <h1 className="font-headline-md text-2xl font-bold text-on-surface">Medical Records</h1>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant font-data-mono text-[12px] shadow-sm font-semibold">
          <span className="material-symbols-outlined text-[16px] text-primary">folder_open</span>
          <span>{records.length} Records</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col items-center">
          <span className="material-symbols-outlined text-[22px] text-blue-500 mb-1">science</span>
          <div className="font-headline-md text-lg font-bold text-on-surface">
            {records.filter((r) => r.category === 'Lab Report').length}
          </div>
          <div className="font-label-caps text-[9px] text-on-surface-variant uppercase">Lab Reports</div>
        </div>
        <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col items-center">
          <span className="material-symbols-outlined text-[22px] text-purple-500 mb-1">radiology</span>
          <div className="font-headline-md text-lg font-bold text-on-surface">
            {records.filter((r) => r.category === 'Imaging').length}
          </div>
          <div className="font-label-caps text-[9px] text-on-surface-variant uppercase">Imaging</div>
        </div>
        <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col items-center">
          <span className="material-symbols-outlined text-[22px] text-emerald-500 mb-1">medication</span>
          <div className="font-headline-md text-lg font-bold text-on-surface">
            {records.filter((r) => r.category === 'Prescription' || r.category === 'Discharge Summary').length}
          </div>
          <div className="font-label-caps text-[9px] text-on-surface-variant uppercase">Rx & Discharge</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search records, patients, tags, departments..."
          className="w-full pl-10 pr-12 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
            showFilters ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 mb-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[18px] text-primary">filter_list</span>
            <span className="font-label-caps text-[11px] text-primary font-bold uppercase tracking-wider">Advanced Filters</span>
          </div>

          {/* Patient Filter */}
          <div className="mb-3">
            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1.5">Patient</label>
            <select
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              {uniquePatients.map((p) => (
                <option key={p} value={p}>{p === 'All' ? 'All Patients' : p}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="mb-1">
            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1.5">Date Range</label>
            <div className="flex flex-wrap gap-1.5">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.days}
                  onClick={() => setDatePreset(p.days)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold cursor-pointer transition-all ${
                    datePreset === p.days
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar mb-3">
        {ALL_CATEGORIES.map((cat) => {
          const count = cat === 'All' ? records.length : records.filter((r) => r.category === cat).length;
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

      {/* Results Count */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] text-on-surface-variant font-medium">
          {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
        </span>
        {(search || categoryFilter !== 'All' || patientFilter !== 'All' || datePreset > 0) && (
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('All');
              setPatientFilter('All');
              setDatePreset(0);
            }}
            className="text-[12px] text-primary font-semibold cursor-pointer hover:underline flex items-center gap-0.5"
          >
            <span className="material-symbols-outlined text-[14px]">filter_list_off</span>
            Clear All
          </button>
        )}
      </div>

      {/* Records List */}
      <div className="flex flex-col gap-3">
        {filteredRecords.map((rec) => {
          const fileInfo = FILE_TYPE_ICONS[rec.fileType] || FILE_TYPE_ICONS.doc;
          const catColor = CATEGORY_COLORS[rec.category] || CATEGORY_COLORS.Other;
          const uploadBadge = UPLOADED_BY_BADGE[rec.uploadedBy] || UPLOADED_BY_BADGE.system;

          return (
            <div
              key={rec.id}
              className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-2.5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedRecord(rec)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                    <span className={`material-symbols-outlined text-[24px] ${fileInfo.color}`}>{fileInfo.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-headline-md text-[14px] text-on-surface font-bold leading-tight truncate">{rec.title}</div>
                    <div className="font-data-mono text-[11px] text-on-surface-variant mt-0.5">{rec.patientName} • {rec.patientMrn}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${catColor}`}>
                  {rec.category}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-2 rounded-lg text-[12px]">
                <div className="flex items-center gap-1.5 text-on-surface-variant truncate">
                  <span className="material-symbols-outlined text-[15px] text-primary">person</span>
                  <span className="truncate">{rec.doctor}</span>
                </div>
                <div className="flex items-center gap-1.5 text-on-surface-variant truncate">
                  <span className="material-symbols-outlined text-[15px] text-primary">domain</span>
                  <span className="truncate">{rec.department}</span>
                </div>
                <div className="flex items-center gap-1.5 text-on-surface font-semibold">
                  <span className="material-symbols-outlined text-[15px] text-secondary">calendar_today</span>
                  <span className="font-data-mono">{rec.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className={`material-symbols-outlined text-[15px] ${fileInfo.color}`}>{fileInfo.icon}</span>
                  <span className="font-data-mono uppercase text-[11px]">{rec.fileType} • {rec.fileSize}</span>
                </div>
              </div>

              <p className="text-[12px] text-on-surface-variant line-clamp-2">{rec.notes}</p>

              <div className="flex items-center justify-between pt-0.5">
                <div className="flex gap-1.5 flex-wrap">
                  {rec.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-mono">
                      #{tag}
                    </span>
                  ))}
                  {rec.tags.length > 3 && (
                    <span className="text-[10px] text-on-surface-variant">+{rec.tags.length - 3}</span>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${uploadBadge.cls}`}>
                  {uploadBadge.label}
                </span>
              </div>
            </div>
          );
        })}

        {filteredRecords.length === 0 && (
          <div className="p-10 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant">search_off</span>
            <h4 className="font-headline-md text-base font-bold text-on-surface">No Records Found</h4>
            <p className="text-xs text-on-surface-variant max-w-[240px]">
              {search
                ? `No records matching "${search}". Try different keywords or clear filters.`
                : 'No medical records match the current filters.'}
            </p>
          </div>
        )}
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={() => setSelectedRecord(null)}>
          <div
            className="w-full max-w-lg bg-surface rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/30 px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                  <span className={`material-symbols-outlined text-[22px] ${(FILE_TYPE_ICONS[selectedRecord.fileType] || FILE_TYPE_ICONS.doc).color}`}>
                    {(FILE_TYPE_ICONS[selectedRecord.fileType] || FILE_TYPE_ICONS.doc).icon}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-headline-md text-base font-bold text-on-surface truncate">{selectedRecord.title}</h3>
                  <p className="text-[11px] text-on-surface-variant font-mono">{selectedRecord.id.toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-1.5 rounded-full text-gray-500 hover:bg-surface-container cursor-pointer">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <div className="px-5 py-5 flex flex-col gap-4">
              {/* Category & Upload Badge */}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${CATEGORY_COLORS[selectedRecord.category] || CATEGORY_COLORS.Other}`}>
                  {selectedRecord.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${(UPLOADED_BY_BADGE[selectedRecord.uploadedBy] || UPLOADED_BY_BADGE.system).cls}`}>
                  Uploaded by {(UPLOADED_BY_BADGE[selectedRecord.uploadedBy] || UPLOADED_BY_BADGE.system).label}
                </span>
              </div>

              {/* Metadata Grid */}
              <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1">Patient</label>
                    <div className="text-sm font-semibold text-on-surface">{selectedRecord.patientName}</div>
                    <div className="text-[11px] font-mono text-on-surface-variant">{selectedRecord.patientMrn}</div>
                  </div>
                  <div>
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1">Doctor</label>
                    <div className="text-sm font-semibold text-on-surface">{selectedRecord.doctor}</div>
                    <div className="text-[11px] text-on-surface-variant">{selectedRecord.department}</div>
                  </div>
                  <div>
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1">Date</label>
                    <div className="text-sm font-semibold text-on-surface font-data-mono">{selectedRecord.date}</div>
                  </div>
                  <div>
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-1">File</label>
                    <div className="text-sm font-semibold text-on-surface uppercase">{selectedRecord.fileType} • {selectedRecord.fileSize}</div>
                  </div>
                </div>
              </div>

              {/* Clinical Notes */}
              <div>
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-2">Clinical Notes / Findings</label>
                <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20 text-sm text-on-surface leading-relaxed">
                  {selectedRecord.notes}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase block mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {selectedRecord.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Document Preview Placeholder */}
              <div className="bg-surface-container-low rounded-xl p-6 border border-dashed border-outline-variant/50 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant">preview</span>
                <span className="text-sm font-semibold text-on-surface">Document Preview</span>
                <span className="text-[12px] text-on-surface-variant text-center">
                  {selectedRecord.fileType === 'dicom'
                    ? 'DICOM viewer integration required for medical imaging preview'
                    : 'Document preview would render here in a production environment'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    onShowToast(`Downloading ${selectedRecord.title}...`);
                  }}
                  className="py-3 px-4 rounded-xl bg-primary text-on-primary font-label-caps text-xs uppercase flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer font-bold"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Download
                </button>
                <button
                  onClick={() => {
                    onShowToast(`Shared ${selectedRecord.title} via secure link`);
                  }}
                  className="py-3 px-4 rounded-xl bg-surface-container text-on-surface font-label-caps text-xs uppercase flex items-center justify-center gap-2 hover:bg-surface-container-high cursor-pointer font-semibold"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
