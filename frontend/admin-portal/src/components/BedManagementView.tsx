import React, { useState } from 'react';
import { DetailedHospital } from '../types';

interface BedManagementViewProps {
  hospital: DetailedHospital;
  onUpdateBedOccupied: (deptId: string, bedId: string, newOccupied: number) => void;
}

export const BedManagementView: React.FC<BedManagementViewProps> = ({
  hospital,
  onUpdateBedOccupied,
}) => {
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  const filteredDepts = hospital.departments.filter(
    (d) => departmentFilter === 'ALL' || d.id === departmentFilter
  );

  let totalBedsSum = 0;
  let availableBedsSum = 0;

  hospital.departments.forEach((d) => {
    d.beds.forEach((b) => {
      totalBedsSum += b.total;
      availableBedsSum += b.available;
    });
  });

  return (
    <div className="space-y-6 antialiased pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs flex flex-col space-y-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1b3b32] px-2 py-0.5 bg-[#e1eee7] rounded border border-[#b8dbc0]">
              Bed Control
            </span>
            <span className="text-xs text-[#526860] font-mono">
              Node HSP-001 ({hospital.name})
            </span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight font-headline-md">
            Department Bed Capacity Management
          </h2>
          <p className="text-xs text-[#526860]">
            Monitor and adjust bed occupancy per department unit. Vacancies update live: <strong className="font-mono text-[#1b3b32]">Available = Total - Occupied</strong>.
          </p>
        </div>

        <div className="bg-[#f0f6f2] p-3 rounded-xl border border-[#d2e2d8] flex items-center justify-between font-mono">
          <span className="text-[11px] text-[#526860] uppercase font-semibold">Total Hospital Vacancy</span>
          <span className="text-sm font-bold text-[#142620]">
            {availableBedsSum} / {totalBedsSum} Available
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs flex flex-col space-y-2">
        <div className="text-xs font-bold text-gray-900 font-mono">
          Filter Department Unit
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-full text-xs font-mono rounded-xl border border-gray-300 bg-[#fafdfb] px-3.5 py-2.5 text-gray-800 outline-none focus:border-[#1b3b32]"
        >
          <option value="ALL">Show All Departments</option>
          {hospital.departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>
      </div>

      {/* Department-Wise Beds List */}
      <div className="flex flex-col space-y-4">
        {filteredDepts.map((dept) => {
          const deptTotal = dept.beds.reduce((acc, b) => acc + b.total, 0);
          const deptOccupied = dept.beds.reduce((acc, b) => acc + b.occupied, 0);
          const deptAvailable = dept.beds.reduce((acc, b) => acc + b.available, 0);
          const deptPercent = deptTotal > 0 ? Math.round((deptOccupied / deptTotal) * 100) : 0;

          return (
            <div
              key={dept.id}
              className="bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs flex flex-col space-y-3"
            >
              {/* Department Header */}
              <div className="flex flex-col space-y-2 border-b border-gray-100 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#1b3b32] text-[18px]">
                      account_tree
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 font-headline-md">
                      {dept.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#e1eee7] text-[#1b3b32] border border-[#b8dbc0]">
                    {dept.code}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#526860]">Floor: {dept.locationFloor}</span>
                  <span className="px-2 py-0.5 rounded bg-[#f0f6f2] text-[#1b3b32] font-bold border border-[#c4ded3]">
                    {deptAvailable}/{deptTotal} Available ({deptPercent}% Full)
                  </span>
                </div>
              </div>

              {/* Department Bed Units Stack */}
              <div className="flex flex-col space-y-3">
                {dept.beds.map((b) => {
                  const percent = Math.round((b.occupied / b.total) * 100);

                  return (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl bg-[#fafdfb] border border-gray-200 flex flex-col space-y-2"
                    >
                      <div className="flex justify-between items-center text-xs font-mono font-bold">
                        <span className="text-gray-900">{b.bedType}</span>
                        <span className="text-[10px] text-[#526860] font-normal">
                          {b.floorWard} • {percent}% Full
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
                        <div
                          className={`h-full transition-all duration-300 ${
                            percent > 85
                              ? 'bg-[#e63946]'
                              : percent > 60
                              ? 'bg-[#f59f00]'
                              : 'bg-[#2b8a66]'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex flex-col space-y-2 pt-1 border-t border-gray-100">
                        <div className="text-[11px] font-mono text-gray-600 flex justify-between">
                          <span>Total: <strong>{b.total}</strong></span>
                          <span>Occupied: <strong>{b.occupied}</strong></span>
                          <span>Vacant: <strong className="text-[#1b3b32]">{b.available}</strong></span>
                        </div>

                        <div className="flex items-center justify-between font-mono pt-1">
                          <span className="text-[10px] text-gray-500">Adjust Occupied:</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                onUpdateBedOccupied(dept.id, b.id, Math.max(0, b.occupied - 1))
                              }
                              className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold flex items-center justify-center cursor-pointer text-sm"
                              title="Decrease Occupied (-1)"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold text-xs">{b.occupied}</span>
                            <button
                              onClick={() =>
                                onUpdateBedOccupied(dept.id, b.id, Math.min(b.total, b.occupied + 1))
                              }
                              className="w-8 h-8 rounded-lg bg-[#1b3b32] hover:bg-[#122822] text-white font-bold flex items-center justify-center cursor-pointer text-sm shadow-2xs"
                              title="Increase Occupied (+1)"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
