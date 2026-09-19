import React from 'react';
import { HospitalEmergencyRequest, EmergencyRequestStatus } from '../types';

interface EmergencyRequestDetailModalProps {
  request: HospitalEmergencyRequest | null;
  onClose: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: EmergencyRequestStatus) => void;
}

export const EmergencyRequestDetailModal: React.FC<EmergencyRequestDetailModalProps> = ({
  request,
  onClose,
  onAccept,
  onReject,
  onUpdateStatus,
}) => {
  if (!request) return null;

  const timelineSteps: { key: EmergencyRequestStatus; label: string }[] = [
    { key: 'REQUEST CREATED', label: 'Request Created' },
    { key: 'HOSPITAL NOTIFIED', label: 'Hospital Notified' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'IN PROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  const getStepIndex = (status: EmergencyRequestStatus) => {
    switch (status) {
      case 'REQUEST CREATED':
        return 0;
      case 'HOSPITAL NOTIFIED':
        return 1;
      case 'ACCEPTED':
        return 2;
      case 'IN PROGRESS':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(request.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 antialiased">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl bg-white border border-[#d2e2d8] rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-[#1b3b32] text-white border-b border-[#2a5448] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#254d41] text-[#7ce7ba]">
                Emergency Intake Inspector
              </span>
              <span className="text-xs font-mono text-[#a0c5b7]">
                Node: HSP-001 (CityCare)
              </span>
            </div>
            <h2 className="text-lg font-bold mt-0.5 tracking-tight flex items-center gap-2">
              <span>Patient Request {request.id}</span>
              <span className="text-xs font-mono font-normal text-[#85dbb4]">
                ({request.patientName} • {request.ageGender})
              </span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#254d41] text-[#a0c5b7] hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6 text-xs text-gray-800 flex-1">
          {/* Status Timeline */}
          <div className="bg-[#fafdfb] border border-[#dce8e1] rounded-xl p-4">
            <div className="text-[11px] font-mono uppercase font-bold text-[#1b3b32] mb-3">
              Care Request Workflow Timeline
            </div>
            <div className="flex items-center justify-between overflow-x-auto gap-2 py-1">
              {timelineSteps.map((step, idx) => {
                const isPassed = idx < currentIndex;
                const isCurrent = idx === currentIndex;

                return (
                  <div key={step.key} className="flex items-center gap-2 min-w-max">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[11px] transition-all ${
                          isPassed
                            ? 'bg-[#1b3b32] text-white'
                            : isCurrent
                            ? 'bg-[#2b8a66] text-white ring-4 ring-[#2b8a66]/20'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isPassed ? '✓' : isCurrent ? '●' : '○'}
                      </div>
                      <span
                        className={`text-[11px] font-mono ${
                          isCurrent
                            ? 'font-bold text-[#142620]'
                            : isPassed
                            ? 'text-gray-700 font-medium'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {idx < timelineSteps.length - 1 && (
                      <div
                        className={`w-6 h-0.5 ${
                          idx < currentIndex ? 'bg-[#1b3b32]' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-mono uppercase text-[#526860] block font-semibold">
                Severity Level
              </span>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                  request.severity === 'EMERGENCY'
                    ? 'bg-[#fce8e8] text-[#c92a2a] border-[#f8c6c6]'
                    : request.severity === 'HIGH'
                    ? 'bg-[#fff4e6] text-[#d9480f] border-[#ffd8a8]'
                    : 'bg-[#fff9db] text-[#f59f00] border-[#ffec99]'
                }`}
              >
                {request.severity}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-mono uppercase text-[#526860] block font-semibold">
                Required Care
              </span>
              <span className="text-xs font-bold text-gray-900 mt-1 block">
                {request.requiredCare}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-mono uppercase text-[#526860] block font-semibold">
                Request Time
              </span>
              <span className="text-xs font-mono font-bold text-gray-900 mt-1 block">
                {request.requestTime} ({request.timestamp})
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-mono uppercase text-[#526860] block font-semibold">
                Bed Allocation
              </span>
              <span className="text-xs font-mono font-bold text-[#1b3b32] mt-1 block">
                {request.allocatedBed || 'Unassigned'}
              </span>
            </div>
          </div>

          {/* Current Complaint */}
          <div>
            <span className="text-[11px] font-mono uppercase font-bold text-[#1b3b32] block mb-1">
              Current Patient Complaint
            </span>
            <div className="p-3.5 rounded-xl bg-[#fafdfb] border border-gray-200 text-xs text-gray-800 leading-relaxed font-medium">
              "{request.complaint}"
            </div>
          </div>

          {/* AI-Assisted Assessment Card */}
          <div className="p-4 rounded-xl bg-[#f0f6f2] border border-[#c4ded3] space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#1b3b32] text-[18px]">
                auto_awesome
              </span>
              <span className="text-xs font-bold text-[#1b3b32] font-mono uppercase tracking-wider">
                AI-Assisted Triage Assessment
              </span>
            </div>

            <div className="text-xs font-bold text-[#142620]">
              {request.aiAssessment}
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-[#526860] font-semibold block">
                Recommended Care Pathway
              </span>
              <span className="text-xs text-gray-800 font-medium">
                {request.aiRecommendation}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-[#526860] font-semibold block">
                AI Clinical Summary
              </span>
              <p className="text-xs text-gray-700 leading-relaxed italic bg-white p-2.5 rounded-lg border border-[#d2e2d8] mt-0.5">
                {request.aiSummary}
              </p>
            </div>

            <div className="text-[10px] text-[#526860] font-mono border-t border-[#d2e2d8] pt-2 mt-2">
              ⚠️ <em>Disclaimer: AI-assisted information provides clinical decision support only. Definitive diagnosis and treatment are determined by attending physicians.</em>
            </div>
          </div>

          {/* Relevant Medical Information */}
          <div>
            <span className="text-[11px] font-mono uppercase font-bold text-[#1b3b32] block mb-1">
              Relevant Medical History & Context
            </span>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 font-mono">
              {request.medicalInfo}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#526860] font-semibold">Update Status:</span>
            <select
              value={request.status}
              onChange={(e) =>
                onUpdateStatus(request.id, e.target.value as EmergencyRequestStatus)
              }
              className="text-xs font-mono rounded-lg border border-gray-300 bg-white py-1.5 px-2.5 font-bold text-[#1b3b32] outline-none"
            >
              <option value="REQUEST CREATED">REQUEST CREATED</option>
              <option value="HOSPITAL NOTIFIED">HOSPITAL NOTIFIED</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="IN PROGRESS">IN PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {request.status !== 'REJECTED' && (
              <button
                onClick={() => onReject(request.id)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-red-50 text-[#c92a2a] border border-[#f8c6c6] text-xs font-bold transition-all cursor-pointer"
              >
                Reject Request
              </button>
            )}

            {request.status !== 'ACCEPTED' && request.status !== 'COMPLETED' && (
              <button
                onClick={() => onAccept(request.id)}
                className="px-4 py-2 rounded-xl bg-[#1b3b32] hover:bg-[#122822] text-white text-xs font-bold tracking-wide transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>ACCEPT REQUEST</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
