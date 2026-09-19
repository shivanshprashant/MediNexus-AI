import React, { useState } from 'react';
import { DepartmentItem, DepartmentBedType, DepartmentDoctor } from '../types';

interface DepartmentDetailModalProps {
  department: DepartmentItem | null;
  onClose: () => void;
  onUpdateBedOccupied: (deptId: string, bedId: string, newOccupied: number) => void;
  onToggleDoctorStatus: (
    deptId: string,
    doctorId: string,
    newStatus: 'ON DUTY' | 'OFF DUTY' | 'ON LEAVE'
  ) => void;
  onAddBedType: (deptId: string, bed: DepartmentBedType) => void;
  onAddDoctor: (deptId: string, doctor: DepartmentDoctor) => void;
}

export const DepartmentDetailModal: React.FC<DepartmentDetailModalProps> = ({
  department,
  onClose,
  onUpdateBedOccupied,
  onToggleDoctorStatus,
  onAddBedType,
  onAddDoctor,
}) => {
  if (!department) return null;

  const [activeTab, setActiveTab] = useState<'beds' | 'doctors' | 'services'>('beds');

  // Local state for adding bed type inline
  const [showAddBedForm, setShowAddBedForm] = useState(false);
  const [newBedType, setNewBedType] = useState('General Ward Beds');
  const [newBedTotal, setNewBedTotal] = useState(20);
  const [newBedOccupied, setNewBedOccupied] = useState(12);
  const [newBedWard, setNewBedWard] = useState('Ward 2B');

  // Local state for adding doctor inline
  const [showAddDocForm, setShowAddDocForm] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpec, setNewDocSpec] = useState(department.name + ' Specialist');
  const [newDocQual, setNewDocQual] = useState('MD, DNB');
  const [newDocExp, setNewDocExp] = useState(7);
  const [newDocPhone, setNewDocPhone] = useState('');
  const [newDocShift, setNewDocShift] = useState('Day Shift (09:00 - 17:00)');
  const [newDocStatus, setNewDocStatus] = useState<'ON DUTY' | 'OFF DUTY' | 'ON LEAVE'>('ON DUTY');

  const handleCreateBed = () => {
    const total = Math.max(1, newBedTotal);
    const occupied = Math.max(0, Math.min(total, newBedOccupied));
    const available = total - occupied;

    const newBed: DepartmentBedType = {
      id: `b-${Date.now()}`,
      bedType: newBedType,
      total,
      occupied,
      available,
      floorWard: newBedWard,
    };
    onAddBedType(department.id, newBed);
    setShowAddBedForm(false);
  };

  const handleCreateDoctor = () => {
    if (!newDocName) return;

    const newDoc: DepartmentDoctor = {
      id: `doc-${Date.now()}`,
      doctorCode: `DOC-${Math.floor(100 + Math.random() * 900)}`,
      name: newDocName.startsWith('Dr.') ? newDocName : `Dr. ${newDocName}`,
      specialization: newDocSpec,
      qualification: newDocQual,
      experienceYears: Number(newDocExp) || 5,
      contactPhone: newDocPhone || '+91 98100 00000',
      email: `${newDocName.toLowerCase().replace(/[^a-z]/g, '')}@citycare.org`,
      shift: newDocShift,
      availability: newDocStatus,
    };
    onAddDoctor(department.id, newDoc);
    setShowAddDocForm(false);
    setNewDocName('');
  };

  const totalBeds = department.beds.reduce((acc, b) => acc + b.total, 0);
  const totalOccupied = department.beds.reduce((acc, b) => acc + b.occupied, 0);
  const totalAvailable = department.beds.reduce((acc, b) => acc + b.available, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 antialiased">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-lg bg-white border border-[#d2e2d8] rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#1b3b32] text-white border-b border-[#2a5448] flex items-center justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#254d41] text-[#7ce7ba]">
                {department.code}
              </span>
              <span className="text-xs font-mono text-[#a0c5b7]">
                Floor: {department.locationFloor}
              </span>
              {department.is24x7 && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#0ca678] text-white font-bold">
                  24x7 OPEN
                </span>
              )}
            </div>
            <h2 className="text-base font-bold mt-0.5 tracking-tight font-headline-md">
              {department.name} Department
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#254d41] text-[#a0c5b7] hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Quick Department Metrics */}
        <div className="bg-[#fafdfb] border-b border-gray-200 p-3 flex flex-col space-y-2">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-200">
            <span className="text-[10px] font-mono uppercase text-[#526860] font-semibold">
              Department Beds
            </span>
            <span className="text-xs font-extrabold text-[#142620] font-mono">
              {totalBeds} Total / <strong className="text-[#1b3b32]">{totalAvailable} Available</strong>
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-200">
            <span className="text-[10px] font-mono uppercase text-[#526860] font-semibold">
              Physicians Roster
            </span>
            <span className="text-xs font-extrabold text-[#142620] font-mono">
              {department.doctors.length} Doctors /{' '}
              <strong className="text-[#0ca678]">
                {department.doctors.filter((d) => d.availability === 'ON DUTY').length} On Duty
              </strong>
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-200">
            <span className="text-[10px] font-mono uppercase text-[#526860] font-semibold">
              Operating Hours
            </span>
            <span className="text-xs font-mono font-bold text-gray-800">
              {department.operatingHours}
            </span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('beds')}
            className={`flex-1 py-2.5 px-3 text-xs font-mono font-bold border-b-2 text-center transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'beds'
                ? 'border-[#1b3b32] text-[#1b3b32] bg-[#f4f8f5]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Beds ({department.beds.length})
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`flex-1 py-2.5 px-3 text-xs font-mono font-bold border-b-2 text-center transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'doctors'
                ? 'border-[#1b3b32] text-[#1b3b32] bg-[#f4f8f5]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Doctors ({department.doctors.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 py-2.5 px-3 text-xs font-mono font-bold border-b-2 text-center transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'services'
                ? 'border-[#1b3b32] text-[#1b3b32] bg-[#f4f8f5]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Services ({department.services.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs text-gray-800">
          {/* TAB 1: BEDS */}
          {activeTab === 'beds' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#1b3b32]">
                  Department Bed Allocation
                </span>
                <button
                  onClick={() => setShowAddBedForm(!showAddBedForm)}
                  className="px-3 py-1.5 rounded-lg bg-[#1b3b32] hover:bg-[#122822] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs min-h-[36px]"
                >
                  {showAddBedForm ? 'Cancel' : '+ Add Bed Unit'}
                </button>
              </div>

              {showAddBedForm && (
                <div className="p-4 rounded-xl bg-[#fafdfb] border border-[#dce8e1] space-y-3">
                  <span className="text-xs font-bold text-[#1b3b32] font-mono block">
                    New Bed Unit for {department.name}
                  </span>

                  <div className="flex flex-col space-y-2">
                    <input
                      type="text"
                      value={newBedType}
                      onChange={(e) => setNewBedType(e.target.value)}
                      placeholder="Bed Category Name (e.g. CCU Beds)"
                      className="text-xs rounded-xl border border-gray-300 py-2 px-3 outline-none"
                    />
                    <input
                      type="text"
                      value={newBedWard}
                      onChange={(e) => setNewBedWard(e.target.value)}
                      placeholder="Floor / Ward Location"
                      className="text-xs rounded-xl border border-gray-300 py-2 px-3 outline-none"
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono text-gray-600">Total Capacity</label>
                      <input
                        type="number"
                        value={newBedTotal}
                        onChange={(e) => setNewBedTotal(Number(e.target.value))}
                        className="w-24 text-xs font-mono font-bold rounded-xl border py-1.5 px-2 text-center"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono text-gray-600">Occupied Count</label>
                      <input
                        type="number"
                        value={newBedOccupied}
                        onChange={(e) => setNewBedOccupied(Number(e.target.value))}
                        className="w-24 text-xs font-mono font-bold rounded-xl border py-1.5 px-2 text-center"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono text-[#1b3b32] font-bold">
                        Calculated Vacancy
                      </label>
                      <div className="w-24 text-xs font-mono font-extrabold rounded-xl bg-[#e1eee7] text-[#1b3b32] border border-[#b8dbc0] py-1.5 px-2 text-center">
                        {Math.max(0, newBedTotal - newBedOccupied)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={handleCreateBed}
                      className="w-full py-2.5 rounded-xl bg-[#1b3b32] text-white text-xs font-bold transition-all cursor-pointer min-h-[44px]"
                    >
                      Save Bed Unit
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col space-y-3">
                {department.beds.map((b) => {
                  const percent = Math.round((b.occupied / b.total) * 100);

                  return (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl bg-[#fafdfb] border border-gray-200 flex flex-col space-y-2"
                    >
                      <div className="flex justify-between items-center text-xs font-mono font-bold">
                        <span className="text-[#142620]">{b.bedType}</span>
                        <span className="text-[10px] text-[#526860] font-normal">
                          {b.floorWard} • {percent}% Full
                        </span>
                      </div>

                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
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
                          <span>Available: <strong className="text-[#1b3b32]">{b.available}</strong></span>
                        </div>

                        <div className="flex items-center justify-between font-mono pt-1">
                          <span className="text-[10px] text-gray-500">Adjust Occupied:</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                onUpdateBedOccupied(
                                  department.id,
                                  b.id,
                                  Math.max(0, b.occupied - 1)
                                )
                              }
                              className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold flex items-center justify-center cursor-pointer text-sm"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold text-xs">{b.occupied}</span>
                            <button
                              onClick={() =>
                                onUpdateBedOccupied(
                                  department.id,
                                  b.id,
                                  Math.min(b.total, b.occupied + 1)
                                )
                              }
                              className="w-8 h-8 rounded-lg bg-[#1b3b32] text-white hover:bg-[#122822] font-bold flex items-center justify-center cursor-pointer text-sm"
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
          )}

          {/* TAB 2: DOCTORS */}
          {activeTab === 'doctors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#1b3b32]">
                  Physicians & Staff Roster
                </span>
                <button
                  onClick={() => setShowAddDocForm(!showAddDocForm)}
                  className="px-3 py-1 rounded-lg bg-[#1b3b32] hover:bg-[#122822] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  {showAddDocForm ? 'Cancel' : '+ Add Physician'}
                </button>
              </div>

              {showAddDocForm && (
                <div className="p-4 rounded-xl bg-[#fafdfb] border border-[#dce8e1] space-y-3">
                  <span className="text-xs font-bold text-[#1b3b32] font-mono block">
                    New Doctor for {department.name}
                  </span>

                  <div className="flex flex-col space-y-2">
                    <input
                      type="text"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      placeholder="Doctor Name (e.g. Dr. Shiv Gupta)"
                      className="text-xs rounded-xl border border-gray-300 py-2.5 px-3 outline-none"
                    />
                    <input
                      type="text"
                      value={newDocSpec}
                      onChange={(e) => setNewDocSpec(e.target.value)}
                      placeholder="Specialization"
                      className="text-xs rounded-xl border border-gray-300 py-2.5 px-3 outline-none"
                    />
                    <input
                      type="text"
                      value={newDocQual}
                      onChange={(e) => setNewDocQual(e.target.value)}
                      placeholder="Qualification (e.g. MD, DNB)"
                      className="text-xs rounded-xl border border-gray-300 py-2.5 px-3 outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={newDocExp}
                        onChange={(e) => setNewDocExp(Number(e.target.value))}
                        placeholder="Exp (Yrs)"
                        className="w-1/2 text-xs font-mono rounded-xl border border-gray-300 py-2 px-3 text-center"
                      />
                      <select
                        value={newDocStatus}
                        onChange={(e) =>
                          setNewDocStatus(e.target.value as 'ON DUTY' | 'OFF DUTY' | 'ON LEAVE')
                        }
                        className="w-1/2 text-xs font-mono font-bold rounded-xl border border-gray-300 py-2 px-3 bg-white outline-none"
                      >
                        <option value="ON DUTY">ON DUTY</option>
                        <option value="OFF DUTY">OFF DUTY</option>
                        <option value="ON LEAVE">ON LEAVE</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={handleCreateDoctor}
                      className="w-full py-2.5 rounded-xl bg-[#1b3b32] text-white text-xs font-bold transition-all cursor-pointer min-h-[44px]"
                    >
                      Save Physician
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col space-y-3">
                {department.doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl bg-[#fafdfb] border border-gray-200 flex flex-col space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-xs">{doc.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                          {doc.doctorCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#1b3b32] font-medium mt-0.5">
                        {doc.specialization} • {doc.qualification}
                      </div>
                      <div className="text-[10px] font-mono text-gray-500 mt-1">
                        Experience: {doc.experienceYears}y • Shift: {doc.shift}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-gray-500">Duty Status:</span>
                      <select
                        value={doc.availability}
                        onChange={(e) =>
                          onToggleDoctorStatus(
                            department.id,
                            doc.id,
                            e.target.value as 'ON DUTY' | 'OFF DUTY' | 'ON LEAVE'
                          )
                        }
                        className={`text-[10px] font-mono font-bold rounded-lg border py-1 px-2 outline-none cursor-pointer ${
                          doc.availability === 'ON DUTY'
                            ? 'bg-[#e6fcf5] text-[#0ca678] border-[#96f2d7]'
                            : doc.availability === 'ON LEAVE'
                            ? 'bg-[#fff4e6] text-[#e8590c] border-[#ffd8a8]'
                            : 'bg-gray-100 text-gray-600 border-gray-300'
                        }`}
                      >
                        <option value="ON DUTY">ON DUTY</option>
                        <option value="OFF DUTY">OFF DUTY</option>
                        <option value="ON LEAVE">ON LEAVE</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SERVICES */}
          {activeTab === 'services' && (
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-[#1b3b32]">
                Department Specialization & Procedures
              </span>

              <div className="flex flex-wrap gap-2">
                {department.services.map((svc) => (
                  <span
                    key={svc}
                    className="px-3.5 py-1.5 rounded-xl bg-[#e1eee7] text-[#1b3b32] border border-[#b8dbc0] text-xs font-semibold font-mono"
                  >
                    ✓ {svc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
