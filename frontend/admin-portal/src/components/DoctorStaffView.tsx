import React, { useState } from 'react';
import { DetailedHospital, DepartmentDoctor } from '../types';

interface DoctorStaffViewProps {
  hospital: DetailedHospital;
  onToggleDoctorStatus: (
    deptId: string,
    doctorId: string,
    newStatus: 'ON DUTY' | 'OFF DUTY' | 'ON LEAVE'
  ) => void;
  onAddDoctorToDepartment: (deptId: string, doctor: DepartmentDoctor) => void;
}

export const DoctorStaffView: React.FC<DoctorStaffViewProps> = ({
  hospital,
  onToggleDoctorStatus,
  onAddDoctorToDepartment,
}) => {
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  // Form state for adding doctor
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [targetDeptId, setTargetDeptId] = useState<string>(
    hospital.departments[0]?.id || ''
  );
  const [docName, setDocName] = useState('');
  const [docSpec, setDocSpec] = useState('');
  const [docQual, setDocQual] = useState('MD, DNB');
  const [docExp, setDocExp] = useState(8);
  const [docPhone, setDocPhone] = useState('');
  const [docShift, setDocShift] = useState('Day Shift (09:00 - 17:00)');
  const [docStatus, setDocStatus] = useState<'ON DUTY' | 'OFF DUTY' | 'ON LEAVE'>('ON DUTY');

  const filteredDepts = hospital.departments.filter(
    (d) => departmentFilter === 'ALL' || d.id === departmentFilter
  );

  let totalDoctorsCount = 0;
  let onDutyDoctorsCount = 0;

  hospital.departments.forEach((d) => {
    d.doctors.forEach((doc) => {
      totalDoctorsCount += 1;
      if (doc.availability === 'ON DUTY') {
        onDutyDoctorsCount += 1;
      }
    });
  });

  const handleCreateDoctor = () => {
    if (!docName || !targetDeptId) return;

    const newDoc: DepartmentDoctor = {
      id: `doc-${Date.now()}`,
      doctorCode: `DOC-${Math.floor(100 + Math.random() * 900)}`,
      name: docName.startsWith('Dr.') ? docName : `Dr. ${docName}`,
      specialization: docSpec || 'Department Specialist',
      qualification: docQual,
      experienceYears: Number(docExp) || 5,
      contactPhone: docPhone || hospital.phone,
      email: `${docName.toLowerCase().replace(/[^a-z]/g, '')}@citycare.org`,
      shift: docShift,
      availability: docStatus,
    };

    onAddDoctorToDepartment(targetDeptId, newDoc);
    setShowAddDocModal(false);
    setDocName('');
    setDocSpec('');
  };

  return (
    <div className="space-y-6 antialiased pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs flex flex-col space-y-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1b3b32] px-2 py-0.5 bg-[#e1eee7] rounded border border-[#b8dbc0]">
              Department Roster
            </span>
            <span className="text-xs text-[#526860] font-mono">
              Node HSP-001 ({hospital.name})
            </span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight font-headline-md">
            Doctor Roster & Shift Status
          </h2>
          <p className="text-xs text-[#526860]">
            Manage physician availability per clinical department unit (`ON DUTY`, `OFF DUTY`, `ON LEAVE`).
          </p>
        </div>

        <div className="flex flex-col space-y-2 pt-1 border-t border-gray-100">
          <div className="flex items-center justify-between bg-[#f0f6f2] p-2.5 rounded-xl border border-[#d2e2d8]">
            <span className="text-[11px] text-[#526860] uppercase font-mono font-semibold">Physicians Active</span>
            <span className="text-xs font-bold text-[#0ca678] font-mono">
              {onDutyDoctorsCount} / {totalDoctorsCount} On Duty
            </span>
          </div>

          <button
            onClick={() => setShowAddDocModal(!showAddDocModal)}
            className="w-full py-2.5 rounded-xl bg-[#1b3b32] hover:bg-[#122822] text-white text-xs font-bold font-mono transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>+ Add Physician</span>
          </button>
        </div>
      </div>

      {/* Add Doctor Inline Modal / Form */}
      {showAddDocModal && (
        <div className="p-4 rounded-2xl bg-white border border-[#d2e2d8] shadow-md flex flex-col space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold text-gray-900 font-headline-md">
              Add New Physician to Roster
            </h3>
            <button
              onClick={() => setShowAddDocModal(false)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg font-bold px-1"
            >
              ×
            </button>
          </div>

          <div className="flex flex-col space-y-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Target Department *
              </label>
              <select
                value={targetDeptId}
                onChange={(e) => setTargetDeptId(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-gray-300 py-2.5 px-3 bg-white outline-none"
              >
                {hospital.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Doctor Name *
              </label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Dr. Shiv Gupta"
                className="w-full text-xs rounded-xl border border-gray-300 py-2.5 px-3 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Specialization
              </label>
              <input
                type="text"
                value={docSpec}
                onChange={(e) => setDocSpec(e.target.value)}
                placeholder="Interventional Cardiologist"
                className="w-full text-xs rounded-xl border border-gray-300 py-2.5 px-3 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Qualification
              </label>
              <input
                type="text"
                value={docQual}
                onChange={(e) => setDocQual(e.target.value)}
                placeholder="MD, DM, FACC"
                className="w-full text-xs rounded-xl border border-gray-300 py-2.5 px-3 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="w-1/2">
                <label className="block text-[10px] font-semibold text-gray-700 mb-1">
                  Experience (Yrs)
                </label>
                <input
                  type="number"
                  value={docExp}
                  onChange={(e) => setDocExp(Number(e.target.value))}
                  className="w-full text-xs font-mono rounded-xl border border-gray-300 py-2 px-3 text-center"
                />
              </div>

              <div className="w-1/2">
                <label className="block text-[10px] font-semibold text-gray-700 mb-1">
                  Duty Availability
                </label>
                <select
                  value={docStatus}
                  onChange={(e) =>
                    setDocStatus(e.target.value as 'ON DUTY' | 'OFF DUTY' | 'ON LEAVE')
                  }
                  className="w-full text-xs font-mono font-bold rounded-xl border border-gray-300 py-2 px-2 bg-white outline-none"
                >
                  <option value="ON DUTY">ON DUTY</option>
                  <option value="OFF DUTY">OFF DUTY</option>
                  <option value="ON LEAVE">ON LEAVE</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleCreateDoctor}
              className="w-full py-2.5 rounded-xl bg-[#1b3b32] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs min-h-[44px]"
            >
              Save Physician to Department
            </button>
          </div>
        </div>
      )}

      {/* Department Filter Bar */}
      <div className="bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs flex flex-col space-y-2">
        <div className="text-xs font-bold text-gray-900 font-mono">
          Filter Department Roster
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

      {/* Department-Wise Doctor Cards List */}
      <div className="flex flex-col space-y-4">
        {filteredDepts.map((dept) => {
          const deptOnDutyCount = dept.doctors.filter((d) => d.availability === 'ON DUTY').length;

          return (
            <div
              key={dept.id}
              className="bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs flex flex-col space-y-3"
            >
              {/* Department Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#1b3b32] text-[18px]">
                    account_tree
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 font-headline-md">
                    {dept.name}
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#e1eee7] text-[#1b3b32] border border-[#b8dbc0]">
                    {dept.code}
                  </span>
                </div>

                <span className="text-[10px] font-mono font-bold text-[#0ca678] bg-[#e6fcf5] px-2 py-0.5 rounded border border-[#96f2d7]">
                  {deptOnDutyCount}/{dept.doctors.length} On Duty
                </span>
              </div>

              {/* Doctors Stack */}
              <div className="flex flex-col space-y-3">
                {dept.doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl bg-[#fafdfb] border border-gray-200 flex flex-col space-y-2"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 leading-tight">
                            {doc.name}
                          </h4>
                          <div className="text-[11px] text-[#1b3b32] font-semibold mt-0.5">
                            {doc.specialization}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                          {doc.doctorCode}
                        </span>
                      </div>

                      <div className="text-[10px] text-gray-600 mt-2 space-y-0.5 font-mono">
                        <div>Qual: {doc.qualification} • Exp: {doc.experienceYears} Yrs</div>
                        <div>Shift: {doc.shift}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-gray-500">Duty Status:</span>
                      <select
                        value={doc.availability}
                        onChange={(e) =>
                          onToggleDoctorStatus(
                            dept.id,
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
          );
        })}
      </div>
    </div>
  );
};
