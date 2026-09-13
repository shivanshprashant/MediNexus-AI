import React from 'react';
import { Hospital, PathwayResult } from '../../types';

interface EmergencyAssistanceViewProps {
  assessment: any;
  pathway?: PathwayResult;
  topHospital?: Hospital;
  onTriggerSOS: (mode: 'drive-in' | 'ambulance', hospitalId?: string) => void;
  onShowToast: (msg: string) => void;
  onBackToHome: () => void;
}

export const EmergencyAssistanceView: React.FC<EmergencyAssistanceViewProps> = ({
  assessment,
  pathway,
  topHospital,
  onTriggerSOS,
  onShowToast,
  onBackToHome,
}) => {
  const hospital: Hospital = topHospital || {
    id: 'hosp-1',
    name: 'CityCare Hospital (HSP-001)',
    dist: '1.8 km',
    time: '6 mins',
    traffic: 'Clear',
    address: 'Plot 14, Sector 44, New Delhi',
    phone: '+91 11 4910 2000',
    vacantBeds: 5,
    totalBeds: 24,
    erStatus: 'LEVEL 1 TRAUMA • OPEN 24/7',
  };

  const guidanceList = assessment?.immediate_guidance || [
    'Contact local emergency services immediately.',
    'Do not leave the person alone.',
    'Follow dispatcher instructions.',
    'Do not give food, drink, or medication to an unconscious person.',
  ];

  return (
    <div className="flex flex-col w-full px-4 pt-2 pb-36 max-w-lg mx-auto animate-in fade-in duration-300">
      {/* High Visibility Emergency Header */}
      <div className="bg-red-600 text-white rounded-2xl p-4 shadow-lg mb-4 space-y-2 border border-red-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] animate-pulse">e911_emergency</span>
            <span className="font-headline-md text-base font-extrabold uppercase tracking-wider">
              Emergency Assistance Needed
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-white/20 font-mono text-[10px] font-bold">
            📍 Location Detected
          </span>
        </div>
        <p className="text-xs leading-relaxed text-red-100 font-medium">
          {assessment?.reason || 'Critical condition detected requiring immediate medical attention.'}
        </p>
      </div>

      {/* Recommended Emergency Hospital Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 border border-red-200 shadow-md mb-4 space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div>
            <span className="font-label-caps text-[10px] uppercase font-bold text-red-600 block">
              Recommended Emergency Facility
            </span>
            <h3 className="font-headline-md text-base font-bold text-on-surface">
              {hospital.name}
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-bold uppercase border border-red-300">
            {hospital.dist} • {hospital.time}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-red-50/50 rounded-xl border border-red-100">
            <span className="text-gray-500 text-[10px] block font-medium">Emergency Beds</span>
            <strong className="text-red-700 font-bold text-sm">
              {hospital.vacantBeds} Vacant / {hospital.totalBeds} Total
            </strong>
          </div>

          <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <span className="text-gray-500 text-[10px] block font-medium">ER Status</span>
            <strong className="text-emerald-800 font-bold text-xs block truncate">
              {hospital.erStatus}
            </strong>
          </div>
        </div>

        <div className="text-xs text-on-surface-variant space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-gray-500">location_on</span>
            <span>{hospital.address}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-gray-500">call</span>
            <span className="font-mono">{hospital.phone}</span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={() => onTriggerSOS('ambulance', hospital.id)}
            className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">ambulance</span>
            <span>🚑 Take ALS Ambulance</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onTriggerSOS('drive-in', hospital.id)}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">directions_car</span>
              <span>🚗 Go By Yourself</span>
            </button>

            <button
              type="button"
              onClick={() => onShowToast(`Calling Emergency Services: ${hospital.phone}`)}
              className="py-2.5 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span>Call ER</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Immediate Safety Guidance Box */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2 mb-4">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
          <span className="material-symbols-outlined text-[18px]">medical_services</span>
          <span>Immediate Safety Instructions (AI First-Aid)</span>
        </div>
        <ul className="space-y-1.5 text-xs text-amber-950">
          {guidanceList.map((step: string, idx: number) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Back Control */}
      <button
        type="button"
        onClick={onBackToHome}
        className="w-full py-2.5 bg-surface-container text-on-surface hover:bg-surface-container-high font-bold text-xs uppercase rounded-xl cursor-pointer text-center"
      >
        ← Back to Patient Dashboard
      </button>
    </div>
  );
};
