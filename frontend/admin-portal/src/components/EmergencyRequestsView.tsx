import React, { useState } from 'react';
import { HospitalEmergencyRequest, EmergencyRequestSeverity, EmergencyRequestStatus } from '../types';

interface EmergencyRequestsViewProps {
  requests: HospitalEmergencyRequest[];
  onOpenDetail: (request: HospitalEmergencyRequest) => void;
}

export const EmergencyRequestsView: React.FC<EmergencyRequestsViewProps> = ({
  requests,
  onOpenDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requiredCare.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || req.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityBadgeClass = (severity: EmergencyRequestSeverity) => {
    switch (severity) {
      case 'EMERGENCY':
        return 'bg-[#fce8e8] text-[#c92a2a] border-[#f8c6c6] font-bold';
      case 'HIGH':
        return 'bg-[#fff4e6] text-[#d9480f] border-[#ffd8a8] font-bold';
      case 'MODERATE':
        return 'bg-[#fff9db] text-[#f59f00] border-[#ffec99] font-bold';
      case 'LOW':
      default:
        return 'bg-[#f1f3f5] text-[#495057] border-[#dee2e6] font-medium';
    }
  };

  const getStatusBadgeClass = (status: EmergencyRequestStatus) => {
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
      case 'REJECTED':
        return 'bg-[#f8f9fa] text-[#868e96] border-[#dee2e6] line-through';
      default:
        return 'bg-[#f8f9fa] text-[#6c757d] border-[#e9ecef]';
    }
  };

  return (
    <div className="space-y-6 antialiased pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-[#d2e2d8] rounded-2xl p-5 md:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#b92c2c] px-2 py-0.5 bg-[#fce8e8] rounded border border-[#f8c6c6]">
              Emergency Triage Queue
            </span>
            <span className="text-xs text-[#526860] font-mono">
              Node HSP-001 (CityCare Hospital)
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-1 tracking-tight font-headline-md">
            Emergency Requests Management
          </h2>
          <p className="text-xs text-[#526860] mt-0.5">
            Monitor, inspect AI clinical summaries, and accept/route incoming emergency intakes.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#1b3b32] bg-[#f0f6f2] px-3.5 py-2 rounded-xl border border-[#d2e2d8]">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{requests.length} Total Requests Loaded</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#d2e2d8] rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Patient ID, Name, or Care Department..."
            className="w-full text-xs rounded-xl border border-gray-300 focus:border-[#1b3b32] focus:ring-1 focus:ring-[#1b3b32] pl-9 pr-3 py-2.5 bg-[#fafdfb] text-gray-900 outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs font-mono rounded-xl border border-gray-300 bg-[#fafdfb] px-3 py-2.5 text-gray-800 outline-none focus:border-[#1b3b32]"
          >
            <option value="ALL">Severity: All</option>
            <option value="EMERGENCY">EMERGENCY</option>
            <option value="HIGH">HIGH</option>
            <option value="MODERATE">MODERATE</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-mono rounded-xl border border-gray-300 bg-[#fafdfb] px-3 py-2.5 text-gray-800 outline-none focus:border-[#1b3b32]"
          >
            <option value="ALL">Status: All</option>
            <option value="REQUEST CREATED">REQUEST CREATED</option>
            <option value="HOSPITAL NOTIFIED">HOSPITAL NOTIFIED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="IN PROGRESS">IN PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-[#d2e2d8] rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-mono uppercase text-[#526860] bg-[#fafdfb]">
                <th className="py-3 px-4 font-semibold">Patient ID</th>
                <th className="py-3 px-4 font-semibold">Patient Name</th>
                <th className="py-3 px-4 font-semibold">Severity</th>
                <th className="py-3 px-4 font-semibold">Required Care</th>
                <th className="py-3 px-4 font-semibold">Request Time</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#f6faf7] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#142620]">
                      {req.id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      <div>{req.patientName}</div>
                      <div className="text-[11px] text-[#526860] font-mono">{req.ageGender}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono border ${getSeverityBadgeClass(
                          req.severity
                        )}`}
                      >
                        {req.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{req.requiredCare}</td>
                    <td className="py-3.5 px-4 text-[#526860] font-mono text-[11px]">
                      <div>{req.requestTime}</div>
                      <div className="text-[10px] text-gray-400">{req.timestamp}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono border ${getStatusBadgeClass(
                          req.status
                        )}`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onOpenDetail(req)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#1b3b32] hover:bg-[#122822] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                      >
                        View Request
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#526860] font-mono">
                    No emergency requests matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
