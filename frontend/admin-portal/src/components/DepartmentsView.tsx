import React, { useState } from 'react';
import { DepartmentItem } from '../types';

interface DepartmentsViewProps {
  departments: DepartmentItem[];
  onOpenDepartmentDetail: (dept: DepartmentItem) => void;
}

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({
  departments,
  onOpenDepartmentDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDepts = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 antialiased pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs flex flex-col space-y-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1b3b32] px-2 py-0.5 bg-[#e1eee7] rounded border border-[#b8dbc0]">
              Clinical Structure
            </span>
            <span className="text-xs text-[#526860] font-mono">
              Node HSP-001 (CityCare)
            </span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight font-headline-md">
            Department-Wise Infrastructure & Roster
          </h2>
          <p className="text-xs text-[#526860]">
            Inspect individual units, bed allocations, physician schedules, and emergency support.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#f0f6f2] p-3 rounded-xl border border-[#d2e2d8]">
          <span className="material-symbols-outlined text-[#1b3b32] text-[20px]">account_tree</span>
          <span className="text-xs font-mono font-bold text-[#142620]">
            {departments.length} Active Clinical Departments
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Department Name or Code..."
            className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] pl-9 pr-3 py-2.5 bg-[#fafdfb] text-gray-900 outline-none"
          />
        </div>
      </div>

      {/* Department Cards List (Vertical Stack) */}
      <div className="flex flex-col space-y-4">
        {filteredDepts.map((dept) => {
          const totalBeds = dept.beds.reduce((acc, b) => acc + b.total, 0);
          const availableBeds = dept.beds.reduce((acc, b) => acc + b.available, 0);
          const totalDocs = dept.doctors.length;
          const onDutyDocs = dept.doctors.filter((d) => d.availability === 'ON DUTY').length;

          return (
            <div
              key={dept.id}
              className="bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs flex flex-col space-y-3 hover:border-[#1b3b32] transition-all"
            >
              <div>
                {/* Dept Header */}
                <div className="flex items-start justify-between border-b border-gray-100 pb-2 mb-2">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 font-headline-md leading-tight">
                      {dept.name}
                    </h3>
                    <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#e1eee7] text-[#1b3b32] border border-[#b8dbc0] mt-1">
                      {dept.code}
                    </span>
                  </div>

                  {dept.is24x7 && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#e6fcf5] text-[#0ca678] border border-[#96f2d7]">
                      24x7 OPEN
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#526860] leading-relaxed line-clamp-2">
                  {dept.description}
                </p>

                {/* Vertical Key Metric Blocks */}
                <div className="flex flex-col space-y-2 mt-3">
                  <div className="p-2.5 bg-[#fafdfb] rounded-xl border border-gray-200 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#526860] uppercase font-semibold">
                      Beds Available
                    </span>
                    <span className="text-sm font-bold text-[#1b3b32] font-mono">
                      {availableBeds} / {totalBeds}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#fafdfb] rounded-xl border border-gray-200 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#526860] uppercase font-semibold">
                      Doctors On Duty
                    </span>
                    <span className="text-sm font-bold text-[#0ca678] font-mono">
                      {onDutyDocs} / {totalDocs}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] font-mono text-gray-500 flex flex-col space-y-1">
                  <div>Floor / Ward: {dept.locationFloor}</div>
                  <div>Hours: {dept.operatingHours}</div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => onOpenDepartmentDetail(dept)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1b3b32] hover:bg-[#122822] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <span>View Department Details</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
