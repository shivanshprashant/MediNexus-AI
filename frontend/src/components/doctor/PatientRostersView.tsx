import React, { useState } from 'react';
import { Patient } from '../../types';

interface PatientRostersViewProps {
  patients: Patient[];
  onOpenPatientModal: (patient: Patient) => void;
  onShowToast: (msg: string) => void;
}

export const PatientRostersView: React.FC<PatientRostersViewProps> = ({
  patients,
  onOpenPatientModal,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'high' | 'waiting' | 'cardio'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Extended filter modal state
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'HIGH' | 'NORMAL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'WAITING' | 'COMPLETED'>('ALL');
  const [filterSort, setFilterSort] = useState<'RECENT' | 'NAME'>('RECENT');

  const q = search.toLowerCase().trim();

  let filtered = patients.filter((p) => {
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q);
    const matchesPriority = filterPriority === 'ALL' || p.priority === filterPriority;
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    
    let matchesQuick = true;
    if (quickFilter === 'high') matchesQuick = p.priority === 'HIGH';
    if (quickFilter === 'waiting') matchesQuick = p.status === 'WAITING';
    if (quickFilter === 'cardio') matchesQuick = p.dept.toLowerCase().includes('cardio');

    return matchesSearch && matchesPriority && matchesStatus && matchesQuick;
  });

  if (filterSort === 'NAME') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  const resetAllFilters = () => {
    setSearch('');
    setQuickFilter('all');
    setFilterPriority('ALL');
    setFilterStatus('ALL');
    setFilterSort('RECENT');
    setShowFilterModal(false);
    onShowToast('Filters reset to default');
  };

  const hasAdvancedFilters = filterPriority !== 'ALL' || filterStatus !== 'ALL' || filterSort !== 'RECENT';

  return (
    <div className="flex flex-col w-full px-4 pt-2 pb-36 max-w-lg mx-auto">
      {/* Directory & EHR Sub-header */}
      <div className="flex items-center justify-between pt-1 mb-3">
        <div>
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest font-bold">
            Directory & EHR
          </span>
          <h2 className="font-headline-md text-2xl font-bold text-on-surface">Patient Rosters</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-surface-container-high px-3 py-1.5 rounded-full shadow-sm">
          <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
          <span className="font-data-mono text-[12px] font-bold text-on-surface">
            {filtered.length} Active
          </span>
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 flex items-center bg-surface-container rounded-xl shadow-sm">
          <span className="material-symbols-outlined absolute left-3 text-[20px] text-on-surface-variant">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent pl-10 pr-9 py-2.5 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none"
            placeholder="Search name or MRN (e.g. MN-9921)..."
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 text-on-surface-variant hover:text-on-surface flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilterModal(true)}
          aria-label="Filter Options"
          className="relative flex items-center justify-center w-11 h-11 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
          {hasAdvancedFilters && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-surface"></span>
          )}
        </button>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 mb-3.5">
        <button
          type="button"
          onClick={() => setQuickFilter('all')}
          className={`px-3.5 py-1.5 rounded-full font-label-caps text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
            quickFilter === 'all'
              ? 'bg-primary text-on-primary font-bold shadow-sm'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter('high')}
          className={`px-3.5 py-1.5 rounded-full font-label-caps text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
            quickFilter === 'high'
              ? 'bg-primary text-on-primary font-bold shadow-sm'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
          }`}
        >
          High Priority
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter('waiting')}
          className={`px-3.5 py-1.5 rounded-full font-label-caps text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
            quickFilter === 'waiting'
              ? 'bg-primary text-on-primary font-bold shadow-sm'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
          }`}
        >
          Waiting
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter('cardio')}
          className={`px-3.5 py-1.5 rounded-full font-label-caps text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
            quickFilter === 'cardio'
              ? 'bg-primary text-on-primary font-bold shadow-sm'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
          }`}
        >
          Cardiology
        </button>
      </div>

      {/* Patient Cards Stack */}
      <div className="flex flex-col space-y-3.5">
        {filtered.map((p) => {
          const isHigh = p.priority === 'HIGH';
          return (
            <div
              key={p.id}
              onClick={() => onOpenPatientModal(p)}
              className="w-full bg-surface-container-lowest hover:bg-surface-container-low transition-colors rounded-2xl p-4 shadow-sm cursor-pointer flex flex-col space-y-2.5 active:scale-[0.99] border border-outline-variant/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center border border-outline-variant/30 shrink-0">
                    <span className="material-symbols-outlined text-[28px] text-primary/70">person</span>
                    {isHigh && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-error ring-2 ring-surface-container-lowest"></span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-headline-md text-[17px] font-bold text-on-surface leading-snug">
                        {p.name}
                      </h3>
                      <span className="font-data-mono text-[11px] bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant font-semibold">
                        {p.mrn}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-on-surface-variant font-body-md text-[13px] flex-wrap">
                      <span>{p.age}y ({p.gender === 'Male' ? 'M' : 'F'})</span>
                      <span>•</span>
                      <span className="font-data-mono font-semibold">{p.blood}</span>
                      <span>•</span>
                      <span className="text-primary font-semibold">{p.dept}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  {isHigh ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-caps text-[10px] uppercase font-bold tracking-wider">
                      HIGH PRIORITY
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-caps text-[10px] uppercase font-bold tracking-wider">
                      NORMAL
                    </span>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    {p.status === 'WAITING' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        <span className="font-label-caps text-[11px] text-primary font-bold">Waiting</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-on-surface-variant/40"></span>
                        <span className="font-label-caps text-[11px] text-on-surface-variant">Completed</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between bg-surface-container-low/60 px-3 py-2 rounded-xl font-body-md text-[12px] text-on-surface-variant">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-[15px] text-secondary">history</span>
                  <span className="truncate">Last visit: {p.lastVisit}</span>
                </div>
                <span className="font-label-caps text-[11px] text-primary font-bold flex items-center gap-0.5 shrink-0">
                  Details <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-3">
              <span className="material-symbols-outlined text-[32px]">person_search</span>
            </div>
            <h3 className="font-headline-md text-[18px] leading-snug font-bold text-on-surface">
              No patients found
            </h3>
            <p className="font-body-md text-[14px] text-on-surface-variant mt-1 max-w-xs">
              We couldn't find any patient records matching your active search query or filter set.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-4 px-4 py-2 bg-primary text-on-primary font-label-caps text-[12px] uppercase tracking-wider rounded-lg shadow-sm hover:opacity-95 transition-opacity cursor-pointer font-bold"
            >
              Clear Filters & Search
            </button>
          </div>
        )}
      </div>

      {/* Filter Sheet Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex flex-col justify-end">
          <div className="w-full bg-surface-container-lowest rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto max-w-md mx-auto animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 bg-surface-container-highest rounded-full mx-auto mb-4"></div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">filter_list</span>
                <h3 className="font-headline-md text-[19px] font-bold text-on-surface">
                  Filter Patient Directory
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <label className="font-label-caps text-[11px] text-on-surface-variant uppercase font-bold">
                  Triage Priority
                </label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(['ALL', 'HIGH', 'NORMAL'] as const).map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setFilterPriority(pr)}
                      className={`px-3 py-2 rounded-xl text-center font-label-caps text-[12px] cursor-pointer ${
                        filterPriority === pr
                          ? 'bg-primary text-on-primary font-bold shadow-xs'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                      }`}
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-label-caps text-[11px] text-on-surface-variant uppercase font-bold">
                  Clinical Status
                </label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(['ALL', 'WAITING', 'COMPLETED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFilterStatus(st)}
                      className={`px-3 py-2 rounded-xl text-center font-label-caps text-[12px] cursor-pointer ${
                        filterStatus === st
                          ? 'bg-primary text-on-primary font-bold shadow-xs'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-label-caps text-[11px] text-on-surface-variant uppercase font-bold">
                  Sort Ordering
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(['RECENT', 'NAME'] as const).map((so) => (
                    <button
                      key={so}
                      type="button"
                      onClick={() => setFilterSort(so)}
                      className={`px-3 py-2 rounded-xl text-center font-label-caps text-[12px] cursor-pointer ${
                        filterSort === so
                          ? 'bg-primary text-on-primary font-bold shadow-xs'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                      }`}
                    >
                      {so === 'RECENT' ? 'RECENT VISIT' : 'NAME (A-Z)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-6 pb-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex-1 py-3 bg-surface-container text-on-surface font-label-caps text-xs uppercase rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer font-semibold"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFilterModal(false);
                  onShowToast('Filters applied');
                }}
                className="flex-1 py-3 bg-primary text-on-primary font-label-caps text-xs uppercase rounded-xl shadow-sm font-bold hover:bg-primary-container transition-colors cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
