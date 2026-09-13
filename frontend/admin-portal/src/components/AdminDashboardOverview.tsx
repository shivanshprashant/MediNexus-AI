import React from 'react';
import {
  DetailedHospital,
  DepartmentItem,
  HospitalEmergencyRequest,
  HospitalActivityLog,
  HospitalAdminTab,
} from '../types';
import { calculateHospitalSummary } from '../services/hospitalAdminService';

interface AdminDashboardOverviewProps {
  hospital: DetailedHospital;
  emergencyRequests: HospitalEmergencyRequest[];
  activities: HospitalActivityLog[];
  onNavigateTab: (tab: HospitalAdminTab) => void;
  onOpenRequestDetail: (req: HospitalEmergencyRequest) => void;
  onOpenDepartmentDetail: (dept: DepartmentItem) => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  hospital,
  emergencyRequests,
  activities,
  onNavigateTab,
  onOpenRequestDetail,
  onOpenDepartmentDetail,
}) => {
  const summary = calculateHospitalSummary(hospital);

  const pendingEmergencyCount = emergencyRequests.filter(
    (r) => r.status === 'REQUEST CREATED' || r.status === 'HOSPITAL NOTIFIED'
  ).length;

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'EMERGENCY':
        return 'bg-[#fce8e8] text-[#c92a2a] border-[#f8c6c6] font-bold';
      case 'HIGH':
        return 'bg-[#fff4e6] text-[#d9480f] border-[#ffd8a8] font-bold';
      case 'MODERATE':
        return 'bg-[#fff9db] text-[#f59f00] border-[#ffec99] font-bold';
      default:
        return 'bg-[#f1f3f5] text-[#495057] border-[#dee2e6] font-medium';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'REQUEST CREATED':
      case 'HOSPITAL NOTIFIED':
        return 'bg-[#e6fcf5] text-[#0ca678] border-[#96f2d7] animate-pulse';
      case 'ACCEPTED':
        return 'bg-[#e7f5ff] text-[#1971c2] border-[#a5d8ff]';
      case 'IN PROGRESS':
        return 'bg-[#fff4e6] text-[#e8590c] border-[#ffd8a8]';
      case 'COMPLETED':
        return 'bg-[#f1f3f5] text-[#495057] border-[#ced4da]';
      default:
        return 'bg-[#f8f9fa] text-[#6c757d] border-[#e9ecef]';
    }
  };

  return (
    <div className="flex flex-col space-y-4 antialiased pb-12">
      {/* FIRST DIV: Welcome Banner */}
      <div className="bg-[#f0f6f2] border border-[#d2e2d8] rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1b3b32] px-2 py-0.5 bg-[#d8ebd9] rounded border border-[#b8dbc0]">
              Operational Console
            </span>
            <span className="text-xs text-[#526860] font-mono">
              Node: {hospital.hospitalCode}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#142620] mt-1 tracking-tight font-headline-md">
            Welcome, {hospital.adminName}
          </h2>
          <p className="text-xs text-[#526860] mt-0.5 leading-relaxed font-medium">
            Real-time status for <strong className="text-[#142620]">{hospital.name}</strong>. Monitor emergency intake, department capacity, beds, and physician shifts.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={() => onNavigateTab('departments')}
            className="w-full py-2.5 px-3.5 rounded-xl bg-white hover:bg-[#e8f4ee] border border-[#c4e2d2] text-[#1b3b32] text-xs font-mono font-bold flex items-center justify-between shadow-2xs transition-all cursor-pointer min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">account_tree</span>
              <span>All Departments ({summary.totalDepartments})</span>
            </div>
            <span>→</span>
          </button>

          <button
            onClick={() => onNavigateTab('emergency-requests')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1b3b32] hover:bg-[#122822] text-white text-xs font-semibold tracking-wide flex items-center justify-between shadow-xs transition-all cursor-pointer min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">e911_emergency</span>
              <span>Emergency Queue</span>
            </div>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* SECOND DIV: 4 Statistic Cards */}
      <div className="flex flex-col space-y-3">
        {/* Stat Card 1: Emergency Requests */}
        <div className="bg-white border border-[#f0c8c8] rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-[#b92c2c] tracking-wider">
              Emergency Requests
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#fce8e8] text-[#c92a2a] flex items-center justify-center border border-[#f8c6c6]">
              <span className="material-symbols-outlined text-[18px]">e911_emergency</span>
            </div>
          </div>
          <div className="flex flex-col space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#9e1c1c] tracking-tight font-headline-md">
                {emergencyRequests.length} Active Intakes
              </span>
              {pendingEmergencyCount > 0 && (
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[#fa5252] text-white animate-pulse">
                  {pendingEmergencyCount} ACTION REQD
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#783c3c] font-mono">
              {pendingEmergencyCount} pending triage & ER bay assignment
            </p>
          </div>
        </div>

        {/* Stat Card 2: Total Available Beds */}
        <div className="bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-[#2d5649] tracking-wider">
              Available Beds Capacity
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#e8f4ee] text-[#1b3b32] flex items-center justify-center border border-[#c4e2d2]">
              <span className="material-symbols-outlined text-[18px]">single_bed</span>
            </div>
          </div>
          <div className="flex flex-col space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#142620] tracking-tight font-headline-md">
                {summary.availableBeds} Vacant Beds
              </span>
              <span className="text-[11px] text-[#4d7063] font-mono font-medium">
                / {summary.totalBeds} total
              </span>
            </div>
            <p className="text-[11px] text-[#526860] font-mono">
              Across {summary.totalDepartments} Specialized Departments
            </p>
          </div>
        </div>

        {/* Stat Card 3: ICU Available */}
        <div className="bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-[#2d5649] tracking-wider">
              ICU / CCU Vacancy
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#e8f4ee] text-[#1b3b32] flex items-center justify-center border border-[#c4e2d2]">
              <span className="material-symbols-outlined text-[18px]">monitor_heart</span>
            </div>
          </div>
          <div className="flex flex-col space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#142620] tracking-tight font-headline-md">
                {summary.availableIcuBeds} ICU Beds
              </span>
              <span className="text-[10px] font-semibold text-[#1e6b4f] bg-[#e1eee7] px-2 py-0.5 rounded font-mono">
                24x7 Ready
              </span>
            </div>
            <p className="text-[11px] text-[#526860] font-mono">
              Total Critical Beds: {summary.totalIcuBeds}
            </p>
          </div>
        </div>

        {/* Stat Card 4: Doctors On Duty */}
        <div className="bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-[#2d5649] tracking-wider">
              Doctors On Duty Roster
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#e8f4ee] text-[#1b3b32] flex items-center justify-center border border-[#c4e2d2]">
              <span className="material-symbols-outlined text-[18px]">stethoscope</span>
            </div>
          </div>
          <div className="flex flex-col space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#142620] tracking-tight font-headline-md">
                {summary.doctorsOnDuty} Active Physicians
              </span>
              <span className="text-[11px] text-[#4d7063] font-mono font-medium">
                / {summary.totalDoctors} total
              </span>
            </div>
            <p className="text-[11px] text-[#526860] font-mono">
              Active Shift Schedules Across Departments
            </p>
          </div>
        </div>
      </div>

      {/* THIRD DIV: Department-Wise Resource Summary */}
      <div className="bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col space-y-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2 font-headline-md">
              <span className="material-symbols-outlined text-[#1b3b32]">account_tree</span>
              <span>Department-Wise Resource Breakdown</span>
            </h3>
            <p className="text-xs text-[#526860]">
              Real-time bed availability and physician duty status per department
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('departments')}
            className="w-full py-2 px-3 rounded-xl bg-[#f0f7f3] hover:bg-[#e2f0e8] text-[#1b3b32] border border-[#c4ded3] text-xs font-bold font-mono transition-all cursor-pointer text-center flex items-center justify-center gap-1"
          >
            <span>Manage All Clinical Departments</span>
            <span>→</span>
          </button>
        </div>

        <div className="flex flex-col space-y-3">
          {hospital.departments.map((dept) => {
            const totalBeds = dept.beds.reduce((acc, b) => acc + b.total, 0);
            const availableBeds = dept.beds.reduce((acc, b) => acc + b.available, 0);
            const totalDocs = dept.doctors.length;
            const onDutyDocs = dept.doctors.filter((d) => d.availability === 'ON DUTY').length;

            return (
              <div
                key={dept.id}
                className="p-4 rounded-xl bg-[#fafdfb] border border-[#dce8e1] space-y-3 hover:border-[#1b3b32] transition-colors"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#142620]">
                      {dept.name}
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#e1eee7] text-[#1b3b32] font-semibold border border-[#b8dbc0]">
                      {dept.code}
                    </span>
                  </div>
                  {dept.is24x7 && (
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[#e6fcf5] text-[#0ca678]">
                      24x7 ACTIVE
                    </span>
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#526860]">
                      Available Beds:
                    </span>
                    <span className="text-xs font-bold text-[#1b3b32] font-mono">
                      {availableBeds} / {totalBeds} Vacant
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#526860]">
                      Doctors On Duty:
                    </span>
                    <span className="text-xs font-bold text-[#0ca678] font-mono">
                      {onDutyDocs} / {totalDocs} Physicians
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onOpenDepartmentDetail(dept)}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#e1eee7] border border-[#c4ded3] text-[#1b3b32] text-xs font-bold font-mono transition-colors cursor-pointer flex items-center justify-center gap-1 min-h-[42px]"
                >
                  <span>View Department Details</span>
                  <span>→</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOURTH DIV: Active Emergency Requests */}
      <div className="bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col space-y-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2 font-headline-md">
              <span className="material-symbols-outlined text-[#c92a2a]">emergency</span>
              <span>Active Emergency Triage Queue</span>
            </h3>
            <p className="text-xs text-[#526860]">
              Immediate care intakes requiring hospital action
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('emergency-requests')}
            className="w-full py-2 px-3 rounded-xl bg-[#fdf2f2] hover:bg-[#fde2e2] text-[#9e1c1c] border border-[#f8c6c6] text-xs font-bold font-mono transition-all cursor-pointer text-center flex items-center justify-center gap-1"
          >
            <span>View Full Queue ({emergencyRequests.length})</span>
            <span>→</span>
          </button>
        </div>

        <div className="flex flex-col space-y-3">
          {emergencyRequests.slice(0, 4).map((req) => (
            <div
              key={req.id}
              className="p-3.5 rounded-xl bg-[#fcfdfd] border border-gray-200 space-y-2.5 hover:border-[#1b3b32] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#142620]">
                  {req.id} • {req.patientName}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getSeverityBadgeClass(
                    req.severity
                  )}`}
                >
                  {req.severity}
                </span>
              </div>

              <div className="text-xs text-gray-800 font-medium space-y-1">
                <div>
                  <span className="text-gray-500 text-[11px] block">Required Care Unit:</span>
                  <span>{req.requiredCare}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block">Arrival Time:</span>
                  <span className="font-mono text-[11px] text-[#526860]">{req.requestTime} ({req.timestamp})</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getStatusBadgeClass(
                    req.status
                  )}`}
                >
                  {req.status}
                </span>

                <button
                  onClick={() => onOpenRequestDetail(req)}
                  className="px-3 py-1.5 rounded-xl bg-[#1b3b32] hover:bg-[#122822] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <span>View Intake Details</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FIFTH DIV: Recent Activity Feed */}
      <div className="bg-[#ffffff] border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="border-b border-gray-100 pb-2.5 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1b3b32]">history</span>
            <span>Recent Activity Log</span>
          </h3>
          <span className="text-[10px] font-mono text-[#526860] px-2 py-0.5 bg-gray-100 rounded font-semibold">
            Live Stream
          </span>
        </div>

        <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-gray-200 pl-4">
          {activities.slice(0, 5).map((act) => (
            <div key={act.id} className="relative text-xs">
              <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-[#1b3b32] ring-4 ring-white" />
              <div className="text-[10px] font-mono text-[#526860] font-semibold">
                {act.time}
              </div>
              <div className="text-gray-800 font-medium leading-snug mt-0.5">
                {act.message}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
