import React, { useState } from 'react';
import { AppScreen, DoctorTab, PatientTab, Patient, Appointment, Specialist, NotificationItem, Hospital, ActiveSosState } from './types';
import { INITIAL_PATIENTS, INITIAL_APPOINTMENTS, SPECIALISTS, INITIAL_NOTIFICATIONS } from './data';
import { LoginScreen } from './components/LoginScreen';
import { DoctorHeader } from './components/doctor/DoctorHeader';
import { DoctorNav } from './components/doctor/DoctorNav';
import { DoctorDashboardView } from './components/doctor/DoctorDashboardView';
import { PatientRostersView } from './components/doctor/PatientRostersView';
import { ConsultationScheduleView } from './components/doctor/ConsultationScheduleView';
import { TriageAlertsView } from './components/doctor/TriageAlertsView';
import { DoctorProfileView } from './components/doctor/DoctorProfileView';
import { DoctorModals } from './components/doctor/DoctorModals';
import { PatientHeader, PatientNav } from './components/patient/PatientNavHeader';
import { PatientDashboardView } from './components/patient/PatientDashboardView';
import { BookAppointmentView } from './components/patient/BookAppointmentView';
import { PatientProfileView } from './components/patient/PatientProfileView';
import { PatientModals } from './components/patient/PatientModals';

export default function App() {
  // Screen state: 'login' | 'doctor' | 'patient'
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('login');

  // Sub-navigation state
  const [doctorTab, setDoctorTab] = useState<DoctorTab>('home');
  const [patientTab, setPatientTab] = useState<PatientTab>('home');

  // Data states
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [specialists] = useState<Specialist[]>(SPECIALISTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [urgentAcknowledged, setUrgentAcknowledged] = useState(false);

  // Hospital Beds & Emergency SOS State
  const [hospitals, setHospitals] = useState<Hospital[]>([
    {
      id: 'hosp-1',
      name: 'Apollo Hospitals, New Delhi',
      dist: '1.8 km',
      time: '6 mins',
      traffic: 'Clear',
      address: 'Sarita Vihar, Mathura Road, New Delhi',
      phone: '+91 11 2692 5858',
      vacantBeds: 5,
      totalBeds: 24,
      erStatus: 'LEVEL 1 TRAUMA • OPEN 24/7',
    },
    {
      id: 'hosp-2',
      name: 'Max Super Speciality Hospital, Gurgaon',
      dist: '4.2 km',
      time: '12 mins',
      traffic: 'Moderate',
      address: 'Phase II, Sector 19, Gurugram',
      phone: '+91 124 662 3000',
      vacantBeds: 8,
      totalBeds: 30,
      erStatus: 'CARDIAC & TRAUMA ER',
    },
    {
      id: 'hosp-3',
      name: 'Fortis Healthcare Emergency, Vasant Kunj',
      dist: '6.5 km',
      time: '18 mins',
      traffic: 'Clear',
      address: 'Sector B, Pocket 1, Vasant Kunj, New Delhi',
      phone: '+91 11 4277 6222',
      vacantBeds: 4,
      totalBeds: 20,
      erStatus: 'EMERGENCY BAY OPEN',
    },
  ]);

  const [activeSos, setActiveSos] = useState<ActiveSosState | null>(null);

  // Handlers for Emergency SOS
  const handleTriggerPatientSOS = (mode: 'drive-in' | 'ambulance') => {
    // 1. Allot ER Bed at Apollo Hospitals (hosp-1) & decrement vacant bed count
    setHospitals((prev) =>
      prev.map((h) => (h.id === 'hosp-1' ? { ...h, vacantBeds: Math.max(0, h.vacantBeds - 1) } : h))
    );

    const sosObj: ActiveSosState = {
      active: true,
      mode,
      patientName: 'Ananya Sharma',
      hospitalId: 'hosp-1',
      hospitalName: 'Apollo Hospitals, New Delhi',
      bedNo: 'ER Bed #04',
      status: 'en-route',
    };
    setActiveSos(sosObj);

    // 2. Alert Doctor Station with Urgent Notification
    const newNotif: NotificationItem = {
      id: `notif-sos-${Date.now()}`,
      title: `CRITICAL SOS: Severe Patient Arriving (${mode === 'drive-in' ? 'Drive-In' : 'Ambulance'})`,
      desc: `Ananya Sharma (29F) is arriving via ${mode === 'drive-in' ? 'Self/Family Transport Drive-In' : 'ALS Ambulance'}. ER Bed #04 Reserved at Apollo Hospitals.`,
      time: 'Just now',
      type: 'URGENT',
      unread: true,
      patient: {
        id: 'p-ananya-sos',
        name: 'Ananya Sharma',
        mrn: 'ABHA-MN-4091',
        dept: 'Cardiology / Emergency',
        age: 29,
        gender: 'Female',
        blood: 'O+',
        priority: 'HIGH',
        status: 'WAITING',
        history: 'Severe chest tightness & acute distress',
        allergies: 'Penicillin',
        meds: 'None',
        reason: 'CRITICAL SOS - Severe retrosternal discomfort on arrival',
        recommendation: 'Prepare Trauma Bay 1. Stat ECG & Troponin I team ready.',
        lastVisit: 'Today',
        nextAppointment: 'Immediate ER Intake',
      },
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setShowEmergencyModal(true); // Pop up Doctor Emergency Modal immediately!
    showToast(
      mode === 'drive-in'
        ? 'Emergency Drive-In Route Active • ER Bed #04 Reserved'
        : 'Emergency Ambulance Dispatched • ER Bed #04 Reserved'
    );
  };

  const handleAcceptEmergencyIntake = () => {
    if (activeSos) {
      setActiveSos((prev) => (prev ? { ...prev, status: 'accepted' } : null));
      showToast('Intake Confirmed! Trauma Bay 1 & ER Bed #04 Prepared for Patient.');
    }
    setShowEmergencyModal(false);
  };

  const handleRedirectPatientEmergency = (targetHospitalId: string) => {
    const targetHosp = hospitals.find((h) => h.id === targetHospitalId) || hospitals[1];
    
    // Transfer bed reservation: restore Apollo bed count (+1) and decrement target hospital bed count (-1)
    setHospitals((prev) =>
      prev.map((h) => {
        if (h.id === 'hosp-1') return { ...h, vacantBeds: h.vacantBeds + 1 };
        if (h.id === targetHosp.id) return { ...h, vacantBeds: Math.max(0, h.vacantBeds - 1) };
        return h;
      })
    );

    setActiveSos((prev) =>
      prev
        ? {
            ...prev,
            hospitalId: targetHosp.id,
            hospitalName: targetHosp.name,
            status: 'redirected',
            redirectedHospitalName: targetHosp.name,
            redirectedHospitalAddress: targetHosp.address,
            bedNo: 'ER Bed #08',
          }
        : null
    );

    showToast(`Patient rerouted to ${targetHosp.name}. ER Bed #08 Allotted!`);
    setShowEmergencyModal(false);
  };

  const handleResetSOS = () => {
    setActiveSos(null);
    setShowSOS(false);
    showToast('Emergency SOS session ended');
  };

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Doctor Modals state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [aiSummaryPatient, setAiSummaryPatient] = useState<Patient | null>(null);
  const [activeConsultationApt, setActiveConsultationApt] = useState<Appointment | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showEHRModal, setShowEHRModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [cancelApt, setCancelApt] = useState<Appointment | null>(null);

  // Patient Modals state
  const [showSOS, setShowSOS] = useState(false);
  const [showAITriage, setShowAITriage] = useState(false);
  const [showNearbyClinics, setShowNearbyClinics] = useState(false);
  const [showPatientNotifications, setShowPatientNotifications] = useState(false);

  // Handlers
  const handleLoginSuccess = (role: 'doctor' | 'patient') => {
    setCurrentScreen(role);
    showToast(`Welcome back, ${role === 'doctor' ? 'Dr. Shiv Gupta' : 'Ananya Sharma'}`);
  };

  const handleSignOut = () => {
    setCurrentScreen('login');
    setDoctorTab('home');
    setPatientTab('home');
    showToast('Signed out securely');
  };

  const handleSaveConsultation = (aptId: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === aptId ? { ...a, status: 'COMPLETED' } : a))
    );
    setActiveConsultationApt(null);
    showToast('Encounter signed & clinical notes archived');
  };

  const handleConfirmReschedule = (aptId: string, date: string, time: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === aptId ? { ...a, date, time, dateLabel: date } : a))
    );
    setRescheduleApt(null);
    showToast(`Appointment rescheduled to ${date}, ${time}`);
  };

  const handleConfirmCancel = (aptId: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === aptId ? { ...a, status: 'CANCELLED' } : a))
    );
    setCancelApt(null);
    showToast('Appointment cancelled');
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast('All notifications marked as read');
  };

  const handleConfirmPatientBooking = (
    specialist: Specialist,
    date: string,
    time: string,
    modality: string,
    reason: string
  ) => {
    const newApt: Appointment = {
      id: `apt-new-${Date.now()}`,
      bookingId: `#MNX-${Math.floor(10000 + Math.random() * 90000)}`,
      name: 'Ananya Sharma',
      initials: 'AS',
      ageGender: '29y • Female',
      mrn: 'MN-PT-4091',
      date,
      dateLabel: date,
      time,
      department: specialist.dept || specialist.specialty,
      reason,
      status: 'UPCOMING',
      modality,
      doctor: {
        name: specialist.name,
        specialty: specialist.specialty,
        facility: specialist.facility,
        photo: specialist.photo || specialist.image,
      } as any,
    };
    setAppointments((prev) => [newApt, ...prev]);
    setPatientTab('book');
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body selection:bg-primary-container selection:text-on-primary-container">
      {/* 1. Login Screen */}
      {currentScreen === 'login' && (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}

      {/* 2. Doctor Portal */}
      {currentScreen === 'doctor' && (
        <div className="flex flex-col min-h-screen pt-16">
          <DoctorHeader
            onOpenNotifications={() => setDoctorTab('alerts')}
            onOpenProfile={() => setDoctorTab('profile')}
            unreadNotificationsCount={notifications.filter((n) => n.unread).length}
          />

          <main className="flex-1 w-full animate-in fade-in duration-200">
            {doctorTab === 'home' && (
              <DoctorDashboardView
                onNavigateTab={(tab) => setDoctorTab(tab)}
                onOpenPatientModal={(p) => setSelectedPatient(p)}
                onOpenAISummary={(p) => setAiSummaryPatient(p)}
                onOpenEmergencyModal={() => setShowEmergencyModal(true)}
                onStartConsultation={(p) => {
                  const apt = appointments.find((a) => a.name.includes(p.name)) || {
                    id: `apt-${p.id}`,
                    name: p.name,
                    initials: p.name.substring(0, 2).toUpperCase(),
                    ageGender: `${p.age}y • ${p.gender}`,
                    mrn: p.mrn,
                    date: 'Oct 24, 2026',
                    time: '10:00 AM',
                    department: p.dept,
                    reason: p.reason,
                    status: 'TODAY',
                    modality: 'Room 304 Consult',
                  };
                  setActiveConsultationApt(apt);
                }}
                onShowToast={showToast}
                urgentAcknowledged={urgentAcknowledged}
              />
            )}

            {doctorTab === 'patients' && (
              <PatientRostersView
                patients={patients}
                onOpenPatientModal={(p) => setSelectedPatient(p)}
                onShowToast={showToast}
              />
            )}

            {doctorTab === 'schedule' && (
              <ConsultationScheduleView
                appointments={appointments}
                onStartConsult={(apt) => setActiveConsultationApt(apt)}
                onOpenDetails={(apt) => {
                  const foundPatient = patients.find((p) => p.name === apt.name) || {
                    id: apt.id,
                    name: apt.name,
                    mrn: apt.mrn,
                    dept: apt.department || 'Cardiology',
                    age: parseInt(apt.ageGender) || 45,
                    gender: apt.ageGender.includes('Female') ? 'Female' : 'Male',
                    blood: 'O+',
                    priority: 'NORMAL',
                    status: apt.status === 'COMPLETED' ? 'COMPLETED' : 'WAITING',
                    lastVisit: 'Oct 10, 2026',
                    nextAppointment: `${apt.date}, ${apt.time}`,
                    allergies: 'None recorded',
                    meds: 'Standard clinical dosage',
                    history: 'Under regular follow-up.',
                    reason: apt.reason,
                    recommendation: 'Monitor vitals and review in 12 weeks.',
                  };
                  setSelectedPatient(foundPatient);
                }}
                onReschedule={(apt) => setRescheduleApt(apt)}
                onCancel={(apt) => setCancelApt(apt)}
              />
            )}

            {doctorTab === 'alerts' && (
              <TriageAlertsView
                notifications={notifications}
                onMarkAllRead={handleMarkAllNotificationsRead}
                onSelectNotification={(n) => {
                  setSelectedNotification(n);
                  setNotifications((prev) =>
                    prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item))
                  );
                }}
                urgentAcknowledged={urgentAcknowledged}
                onAcknowledgeEmergency={() => {
                  setUrgentAcknowledged(true);
                  showToast('Emergency Case Acknowledged • Rapid Protocol Active');
                }}
                onOpenEmergencyIntake={() => setShowEmergencyModal(true)}
                onOpenEHR={() => setShowEHRModal(true)}
              />
            )}

            {doctorTab === 'profile' && (
              <DoctorProfileView onSignOut={handleSignOut} onShowToast={showToast} />
            )}
          </main>

          <DoctorNav
            activeTab={doctorTab}
            onTabChange={(tab) => setDoctorTab(tab)}
            hasAlerts={notifications.some((n) => n.unread)}
          />

          <DoctorModals
            selectedPatient={selectedPatient}
            onClosePatient={() => setSelectedPatient(null)}
            aiSummaryPatient={aiSummaryPatient}
            onCloseAISummary={() => setAiSummaryPatient(null)}
            activeConsultationApt={activeConsultationApt}
            onCloseConsultation={() => setActiveConsultationApt(null)}
            onSaveConsultation={handleSaveConsultation}
            showEmergencyModal={showEmergencyModal}
            onCloseEmergency={() => setShowEmergencyModal(false)}
            onAcceptEmergency={handleAcceptEmergencyIntake}
            activeSos={activeSos}
            hospitals={hospitals}
            onAcceptEmergencyIntake={handleAcceptEmergencyIntake}
            onRedirectEmergencyPatient={handleRedirectPatientEmergency}
            showEHRModal={showEHRModal}
            onCloseEHR={() => setShowEHRModal(false)}
            selectedNotification={selectedNotification}
            onCloseNotification={() => setSelectedNotification(null)}
            rescheduleApt={rescheduleApt}
            onCloseReschedule={() => setRescheduleApt(null)}
            onConfirmReschedule={handleConfirmReschedule}
            cancelApt={cancelApt}
            onCloseCancel={() => setCancelApt(null)}
            onConfirmCancel={handleConfirmCancel}
            onOpenAISummaryFromPatient={(p) => {
              setSelectedPatient(null);
              setAiSummaryPatient(p);
            }}
            onStartConsultFromPatient={(p) => {
              setSelectedPatient(null);
              const apt: Appointment = {
                id: `apt-${p.id}`,
                name: p.name,
                initials: p.name.substring(0, 2).toUpperCase(),
                ageGender: `${p.age}y • ${p.gender}`,
                mrn: p.mrn,
                date: 'Today',
                time: 'Now',
                department: p.dept,
                reason: p.reason,
                status: 'TODAY',
                modality: 'Room 304 Consult',
              };
              setActiveConsultationApt(apt);
            }}
          />
        </div>
      )}

      {/* 3. Patient Portal */}
      {currentScreen === 'patient' && (
        <div className="flex flex-col min-h-screen pt-16">
          <PatientHeader
            onOpenNotifications={() => setShowPatientNotifications(true)}
            onOpenProfile={() => setPatientTab('profile')}
            unreadCount={1}
          />

          <main className="flex-1 w-full animate-in fade-in duration-200">
            {patientTab === 'home' && (
              <PatientDashboardView
                onNavigateTab={(tab) => setPatientTab(tab)}
                onOpenSOS={() => setShowSOS(true)}
                onOpenAITriage={() => setShowAITriage(true)}
                onOpenNearbyClinics={() => setShowNearbyClinics(true)}
                onShowToast={showToast}
              />
            )}

            {patientTab === 'book' && (
              <BookAppointmentView
                specialists={specialists}
                appointments={appointments}
                onConfirmBooking={handleConfirmPatientBooking}
                onCancelAppointment={handleConfirmCancel}
                onShowToast={showToast}
              />
            )}

            {patientTab === 'profile' && (
              <PatientProfileView onSignOut={handleSignOut} onShowToast={showToast} />
            )}
          </main>

          <PatientNav activeTab={patientTab} onTabChange={(tab) => setPatientTab(tab)} />

          <PatientModals
            showSOS={showSOS}
            onCloseSOS={() => setShowSOS(false)}
            showAITriage={showAITriage}
            onCloseAITriage={() => setShowAITriage(false)}
            showNearbyClinics={showNearbyClinics}
            onCloseNearbyClinics={() => setShowNearbyClinics(false)}
            showNotifications={showPatientNotifications}
            onCloseNotifications={() => setShowPatientNotifications(false)}
            onShowToast={showToast}
            hospitals={hospitals}
            activeSos={activeSos}
            onTriggerSOS={handleTriggerPatientSOS}
            onResetSOS={handleResetSOS}
          />
        </div>
      )}

      {/* Floating Demo Quick-Switch Badge */}
      {currentScreen !== 'login' && (
        <aside aria-label="Portal Switcher" className="fixed top-18 right-3 z-30 flex items-center gap-1.5 bg-surface-container-highest/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-outline-variant/30 text-xs">
          <span className="font-label-caps text-[10px] uppercase font-bold text-on-surface-variant">Switch:</span>
          <button
            onClick={() => {
              const nextRole = currentScreen === 'doctor' ? 'patient' : 'doctor';
              setCurrentScreen(nextRole);
              showToast(`Switched to ${nextRole === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}`);
            }}
            className="text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>{currentScreen === 'doctor' ? 'Patient Portal' : 'Doctor Portal'}</span>
            <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
          </button>
        </aside>
      )}

      {/* Global Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-inverse-surface text-inverse-on-surface rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="material-symbols-outlined text-primary text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
