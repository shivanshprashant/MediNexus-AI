import React from 'react';
import { Specialist, PathwayResult } from '../../types';

interface VideoConsultationRecommendationViewProps {
  assessment: any;
  pathway?: PathwayResult;
  doctors: Specialist[];
  onSelectDoctor: (doc: Specialist, mode: 'In-Person OPD' | 'Secure Teleconsult') => void;
  onShowToast: (msg: string) => void;
  onBackToHome: () => void;
}

export const VideoConsultationRecommendationView: React.FC<VideoConsultationRecommendationViewProps> = ({
  assessment,
  pathway,
  doctors,
  onSelectDoctor,
  onShowToast,
  onBackToHome,
}) => {
  const targetDepartment = pathway?.target_department || assessment?.department || 'General Medicine';
  const isChoiceMode = pathway?.next_step === 'VIDEO_OR_IN_PERSON';

  const displayedDoctors = doctors && doctors.length > 0
    ? doctors
    : [
        {
          id: 'telehealth',
          name: 'Dr. Sunita Deshmukh, MD',
          specialty: `${targetDepartment} & Tele-Health`,
          title: 'Lead Teleconsultant • 12 yrs exp.',
          facility: 'Fortis Teleconsult Wing',
          rating: '4.95',
          reviews: '(215 reviews)',
          copay: '₹500 Fee',
          earliest: 'Available Now',
          photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
        },
      ];

  return (
    <div className="flex flex-col w-full px-4 pt-2 pb-36 max-w-lg mx-auto animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-4 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[24px]">videocam</span>
          <h2 className="font-headline-md text-base font-bold text-on-surface">
            {isChoiceMode ? 'Select Consultation Mode' : '🎥 Video Consultation Recommended'}
          </h2>
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Based on your symptom assessment, an initial consultation for{' '}
          <strong className="text-primary">{targetDepartment}</strong> may be suitable through secure video teleconsultation.
        </p>
      </div>

      {/* Available Doctors List */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-[11px] text-gray-500 uppercase font-bold">
            Available Specialists ({targetDepartment})
          </span>
          <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
            Available Today
          </span>
        </div>

        {displayedDoctors.map((doc) => (
          <div
            key={doc.id}
            className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs space-y-3"
          >
            <div className="flex gap-3 items-center">
              <img
                src={doc.photo || doc.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150'}
                alt={doc.name}
                className="w-13 h-13 rounded-xl object-cover border border-gray-200"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-on-surface truncate">{doc.name}</h4>
                <p className="text-xs text-primary font-medium truncate">{doc.title || doc.specialty}</p>
                <span className="text-[11px] text-gray-500 block truncate">{doc.facility}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {doc.earliest || 'Available Today'}
              </span>
              <strong className="text-on-surface">{doc.copay || doc.fee || '₹500 Fee'}</strong>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => onSelectDoctor(doc, 'Secure Teleconsult')}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">videocam</span>
                <span>Start Video Consult</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectDoctor(doc, 'In-Person OPD')}
                className="py-2.5 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs uppercase rounded-xl cursor-pointer"
              >
                🏥 In-Person
              </button>
            </div>
          </div>
        ))}
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
