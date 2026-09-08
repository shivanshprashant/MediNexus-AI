import React, { useState } from 'react';
import { Specialist, Appointment } from '../../types';

interface BookAppointmentViewProps {
  specialists: Specialist[];
  appointments?: Appointment[];
  onConfirmBooking: (specialist: Specialist, date: string, time: string, modality: string, reason: string) => void;
  onCancelAppointment?: (aptId: string) => void;
  onShowToast: (msg: string) => void;
}

export const BookAppointmentView: React.FC<BookAppointmentViewProps> = ({
  specialists,
  appointments = [],
  onConfirmBooking,
  onCancelAppointment,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'find' | 'schedule'>('find');
  const [scheduleFilter, setScheduleFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [deptFilter, setDeptFilter] = useState('All');
  const [bookingSpecialist, setBookingSpecialist] = useState<Specialist | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM');
  const [selectedDate, setSelectedDate] = useState('Today, Oct 24');
  const [modality, setModality] = useState<'In-Person OPD' | 'Secure Teleconsult'>('In-Person OPD');
  const [patientReason, setPatientReason] = useState('Routine cardiac follow-up & medication review.');

  const depts = ['All', 'Cardiology', 'Neurology', 'Orthopedics', 'Endocrinology'];

  const filteredSpecialists = deptFilter === 'All'
    ? specialists
    : specialists.filter((s) => (s.dept || s.specialty || '').toLowerCase().includes(deptFilter.toLowerCase()));

  // Patient appointments
  const allPatientAppointments = appointments.filter(
    (a) => a.name === 'Ananya Sharma' || a.id.startsWith('apt-new-') || a.mrn === 'MN-PT-4091' || a.id.startsWith('apt-patient-')
  );

  const upcomingAppointments = allPatientAppointments.filter(
    (a) => a.status === 'UPCOMING' || a.status === 'TODAY'
  );

  const pastAppointments = allPatientAppointments.filter(
    (a) => a.status === 'COMPLETED' || a.status === 'CANCELLED'
  );

  const displayedSchedule = scheduleFilter === 'upcoming' ? upcomingAppointments : pastAppointments;

  const handleBook = () => {
    if (!bookingSpecialist) return;
    onConfirmBooking(bookingSpecialist, selectedDate, selectedSlot, modality, patientReason);
    setBookingSpecialist(null);
    onShowToast(`Appointment booked with ${bookingSpecialist.name}`);
    setActiveSubTab('schedule');
    setScheduleFilter('upcoming');
  };

  return (
    <div className="flex flex-col w-full px-4 pt-2 pb-36 max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-2 pb-3 flex items-center justify-between">
        <div>
          <span className="font-label-caps text-[11px] text-primary font-bold uppercase tracking-wider">
            Patient Services
          </span>
          <h1 className="font-headline-md text-2xl font-bold text-on-surface">Book & Schedule</h1>
          <p className="text-xs text-on-surface-variant">Manage your consults & book top certified doctors</p>
        </div>
      </div>

      {/* Segment Switcher (Find Doctors vs My Schedule) */}
      <div className="flex bg-surface-container p-1 rounded-xl mb-4 border border-outline-variant/20 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveSubTab('find')}
          className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'find'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          <span>Find Doctor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('schedule')}
          className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'schedule'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">event_available</span>
          <span>My Schedule</span>
          {upcomingAppointments.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-primary text-white font-bold">
              {upcomingAppointments.length}
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: FIND DOCTORS */}
      {activeSubTab === 'find' && (
        <>
          {/* Dept Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-4">
            {depts.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDeptFilter(d)}
                className={`px-3.5 py-1.5 rounded-full font-label-caps text-xs uppercase cursor-pointer transition-all ${
                  deptFilter === d
                    ? 'bg-primary text-white font-bold shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Specialist Cards */}
          <div className="flex flex-col gap-3">
            {filteredSpecialists.map((spec) => (
              <div
                key={spec.id}
                className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    alt={spec.name}
                    className="w-14 h-14 rounded-xl object-cover border border-outline-variant/20 shrink-0"
                    src={spec.image || spec.photo || 'https://images.unsplash.com/photo-1594824813511-1376d2994eb6?auto=format&fit=crop&w=400&q=80'}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline-md text-base font-bold text-on-surface truncate">{spec.name}</h3>
                      <span className="font-bold text-xs text-primary">{spec.fee || spec.copay || '₹800 Fee'}</span>
                    </div>
                    <div className="text-xs text-primary font-medium">
                      {spec.dept || spec.specialty} • {spec.experience || 'Senior Specialist'}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-1">
                      <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                        <span className="material-symbols-outlined text-[14px]">star</span> {spec.rating}
                      </span>
                      <span>•</span>
                      <span>{spec.hospital || spec.facility || 'Apollo / Max Hospital'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-surface-container-low rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[16px]">event_available</span>
                    <span>Next slot: <strong>{spec.availableSlot || spec.earliest || 'Tomorrow'}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookingSpecialist(spec)}
                    className="py-1.5 px-3 bg-primary text-white font-bold text-xs uppercase rounded-lg shadow-sm cursor-pointer hover:bg-primary-container transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* VIEW 2: MY SCHEDULE (UPCOMING VS PAST) */}
      {activeSubTab === 'schedule' && (
        <div className="flex flex-col gap-3">
          {/* Sub-Filter Pills (Upcoming vs Past) */}
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setScheduleFilter('upcoming')}
              className={`px-4 py-1.5 rounded-full font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                scheduleFilter === 'upcoming'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span>Upcoming</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/20 text-white font-bold">
                {upcomingAppointments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setScheduleFilter('past')}
              className={`px-4 py-1.5 rounded-full font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                scheduleFilter === 'past'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span>Past Bookings</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/20 text-white font-bold">
                {pastAppointments.length}
              </span>
            </button>
          </div>

          {displayedSchedule.length === 0 ? (
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/30 text-center flex flex-col items-center gap-3 my-2">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[32px]">
                  {scheduleFilter === 'upcoming' ? 'calendar_today' : 'history'}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-base text-on-surface">
                  {scheduleFilter === 'upcoming' ? 'No Upcoming Appointments' : 'No Past Bookings Found'}
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  {scheduleFilter === 'upcoming'
                    ? 'You have no pending scheduled consultations. Book a slot with a doctor.'
                    : 'Your completed or past appointment history will appear here.'}
                </p>
              </div>
              {scheduleFilter === 'upcoming' && (
                <button
                  type="button"
                  onClick={() => setActiveSubTab('find')}
                  className="mt-2 py-2.5 px-5 bg-primary text-white font-bold text-xs uppercase rounded-xl shadow-sm cursor-pointer hover:bg-primary-container"
                >
                  Browse Specialists
                </button>
              )}
            </div>
          ) : (
            displayedSchedule.map((apt) => (
              <div
                key={apt.id}
                className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <span className="font-data-mono text-[11px] font-bold text-primary">
                    {apt.bookingId || `#MNX-IN-90${apt.id.slice(-2)}`}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      apt.status === 'CANCELLED'
                        ? 'bg-error/10 text-error'
                        : apt.status === 'COMPLETED'
                        ? 'bg-surface-container-high text-on-surface-variant'
                        : 'bg-primary-container text-on-primary-container'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <img
                    alt={apt.doctor?.name || apt.name || 'Doctor'}
                    className="w-12 h-12 rounded-xl object-cover border border-outline-variant/20 shrink-0"
                    src={apt.doctor?.photo || 'https://images.unsplash.com/photo-1594824813511-1376d2994eb6?auto=format&fit=crop&w=400&q=80'}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-headline-md text-sm font-bold text-on-surface">
                      {apt.doctor?.name || 'Dr. Shiv Gupta, MD'}
                    </h3>
                    <div className="text-xs text-primary font-medium">
                      {apt.department} • {apt.modality}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span>{apt.date || apt.dateLabel} at <strong>{apt.time}</strong></span>
                    </div>
                  </div>
                </div>

                {apt.reason && (
                  <div className="p-2.5 bg-surface-container-low rounded-lg text-xs text-on-surface-variant">
                    <strong className="text-on-surface block text-[10px] uppercase font-bold mb-0.5">Chief Complaint / Reason</strong>
                    <p>{apt.reason}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  {apt.status === 'UPCOMING' || apt.status === 'TODAY' ? (
                    <>
                      {apt.modality.toLowerCase().includes('teleconsult') && (
                        <button
                          type="button"
                          onClick={() => onShowToast('Connecting to Virtual Teleconsult Room...')}
                          className="py-1.5 px-3 bg-secondary text-white font-bold text-xs uppercase rounded-lg shadow-sm cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">videocam</span> Join Call
                        </button>
                      )}
                      {onCancelAppointment && (
                        <button
                          type="button"
                          onClick={() => {
                            onCancelAppointment(apt.id);
                            onShowToast('Appointment cancelled');
                          }}
                          className="py-1.5 px-3 bg-surface-container hover:bg-error/10 hover:text-error text-on-surface-variant font-bold text-xs uppercase rounded-lg cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onShowToast(`Viewing Consultation Summary for ${apt.bookingId}`)}
                      className="py-1.5 px-3 bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs uppercase rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">description</span> Summary
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Booking Slot Modal */}
      {bookingSpecialist && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end p-0 sm:p-4">
          <div className="w-full max-w-md mx-auto bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div>
                <span className="font-label-caps text-[10px] uppercase font-bold text-primary">Schedule Consultation</span>
                <h3 className="font-headline-md text-base font-bold text-on-surface">{bookingSpecialist.name}</h3>
              </div>
              <button onClick={() => setBookingSpecialist(null)} className="p-1 rounded-full text-gray-500 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="py-3 space-y-3 text-xs">
              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Consultation Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['In-Person OPD', 'Secure Teleconsult'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModality(m)}
                      className={`p-2 rounded-xl text-center font-bold text-xs cursor-pointer ${
                        modality === m ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Select Date</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Today, Oct 24', 'Fri, Oct 25', 'Mon, Oct 28'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`py-2 rounded-xl text-[11px] font-bold cursor-pointer ${
                        selectedDate === d ? 'bg-primary text-white' : 'bg-surface-container'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Available Slots</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['10:00 AM', '02:00 PM', '04:30 PM'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedSlot(t)}
                      className={`py-2 rounded-xl font-mono text-[11px] cursor-pointer ${
                        selectedSlot === t ? 'bg-primary text-white font-bold' : 'bg-surface-container'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-[10px] text-gray-500 block mb-1">Chief Reason for Consultation</label>
                <textarea
                  value={patientReason}
                  onChange={(e) => setPatientReason(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-gray-200 outline-none text-xs"
                />
              </div>

              <div className="p-2.5 bg-surface-container rounded-lg flex justify-between items-center text-xs">
                <span className="font-bold text-on-surface-variant">Consultation Fee</span>
                <span className="font-bold text-sm text-primary">{bookingSpecialist.fee || bookingSpecialist.copay || '₹800 Fee'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBook}
              className="w-full py-3 bg-primary text-white font-bold text-xs uppercase rounded-xl shadow-sm cursor-pointer hover:bg-primary-container"
            >
              Confirm & Book Slot
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
