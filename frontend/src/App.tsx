import React, { useState } from 'react';
import {
  AppScreen,
  DoctorTab,
  PatientTab,
  Patient,
  Appointment,
  Specialist,
  NotificationItem,
  Hospital,
  ActiveSosState,
  DoctorProfileInfo,
  MedicalRecord,
} from './types';
import {
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  SPECIALISTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_MEDICAL_RECORDS,
} from './data';

// Auth & Landing Components
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { PatientRegistrationWizard } from './components/patient/PatientRegistrationWizard';
import { DoctorRegistrationWizard } from './components/doctor/DoctorRegistrationWizard';

// Doctor & Patient Components
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
import { VideoConsultationRecommendationView } from './components/patient/VideoConsultationRecommendationView';
import { EmergencyAssistanceView } from './components/patient/EmergencyAssistanceView';
import { PatientMedicalRecordsView } from './components/patient/PatientMedicalRecordsView';

export default function App() {
  // Screen state: 'landing' | 'login' | 'patient_register' | 'doctor_register' | 'doctor' | 'patient'
  const getInitialScreen = (): AppScreen => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash.includes('doctor') || search.includes('doctor')) return 'doctor';
      if (hash.includes('patient') || search.includes('patient')) return 'patient';
    }
    return 'landing';
  };

  const [currentScreen, setCurrentScreen] = useState<AppScreen>(getInitialScreen);

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('doctor')) setCurrentScreen('doctor');
      else if (hash.includes('patient')) setCurrentScreen('patient');
      else if (hash.includes('login')) setCurrentScreen('login');
      else if (hash === '' || hash === '#landing') setCurrentScreen('landing');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sub-navigation state
  const [doctorTab, setDoctorTab] = useState<DoctorTab>('home');
  const [patientTab, setPatientTab] = useState<PatientTab>('home');

  // Data states (Doctor & Patient)
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [specialists] = useState<Specialist[]>(SPECIALISTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>(INITIAL_MEDICAL_RECORDS);
  const [urgentAcknowledged, setUrgentAcknowledged] = useState(false);

  // Emergency SOS State for Patient
  const [hospitals, setHospitals] = useState<Hospital[]>([
    {
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
    {
      id: 'hosp-4',
      name: 'Apollo Hospital Emergency & Trauma, Sarita Vihar',
      dist: '8.1 km',
      time: '22 mins',
      traffic: 'Clear',
      address: 'Mathura Road, Sarita Vihar, New Delhi',
      phone: '+91 11 2692 5858',
      vacantBeds: 12,
      totalBeds: 40,
      erStatus: 'NEURO & CARDIAC ER 24/7',
    },
    {
      id: 'hosp-5',
      name: 'Medanta - The Medicity, Gurugram',
      dist: '11.4 km',
      time: '28 mins',
      traffic: 'Moderate',
      address: 'CH Baktawar Singh Road, Sector 38, Gurugram',
      phone: '+91 124 414 1414',
      vacantBeds: 15,
      totalBeds: 50,
      erStatus: 'MULTI-ORGAN TRAUMA CENTER',
    },
  ]);

  const [activeSos, setActiveSos] = useState<ActiveSosState | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Handlers for Emergency SOS
  const handleTriggerPatientSOS = (mode: 'drive-in' | 'ambulance', targetHospitalId?: string) => {
    const chosenHosp = hospitals.find((h) => h.id === targetHospitalId) || hospitals[0];

    setHospitals((prev) =>
      prev.map((h) => (h.id === chosenHosp.id ? { ...h, vacantBeds: Math.max(0, h.vacantBeds - 1) } : h))
    );

    const sosObj: ActiveSosState = {
      active: true,
      mode,
      patientName: 'Ananya Sharma',
      hospitalId: chosenHosp.id,
      hospitalName: chosenHosp.name,
      bedNo: 'ER Bed #04',
      status: 'en-route',
      redirectedHospitalAddress: chosenHosp.address,
    };
    setActiveSos(sosObj);

    const newDoctorNotif: NotificationItem = {
      id: `notif-sos-${Date.now()}`,
      title: `CRITICAL SOS: Severe Patient Arriving (${mode === 'drive-in' ? 'Drive-In' : 'Ambulance'})`,
      desc: `Ananya Sharma (29F) arriving. ER Bed #04 Reserved at ${chosenHosp.name}.`,
      time: 'Just now',
      type: 'URGENT',
      unread: true,
    };
    setNotifications((prev) => [newDoctorNotif, ...prev]);

    setShowEmergencyModal(true);
    showToast(
      mode === 'drive-in'
        ? `Emergency Drive-In Route Active • ${chosenHosp.name} ER Bed #04 Reserved`
        : `Emergency Ambulance Dispatched • ${chosenHosp.name} ER Bed #04 Reserved`
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

  // Doctor Modals state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [aiSummaryPatient, setAiSummaryPatient] = useState<Patient | null>(null);
  const [activeConsultationApt, setActiveConsultationApt] = useState<Appointment | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showEHRModal, setShowEHRModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [cancelApt, setCancelApt] = useState<Appointment | null>(null);

  const [docProfile, setDocProfile] = useState<DoctorProfileInfo>({
    name: 'Dr. Shiv Gupta, MD',
    title: 'Senior Attending Cardiologist',
    hospital: 'Apollo Hospitals, New Delhi',
    license: 'DMC-8948102-DL',
    abhaId: '91-1892-0194-8201',
    room: 'Room 304, Ste 4B, Cardiology Tower',
    hours: '09:00 AM - 04:30 PM IST • Mon-Fri',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
  });


  // Patient Modals state
  const [showSOS, setShowSOS] = useState(false);
  const [showAITriage, setShowAITriage] = useState(false);
  const [showNearbyClinics, setShowNearbyClinics] = useState(false);
  const [showPatientNotifications, setShowPatientNotifications] = useState(false);

  // Health Pathway & Assessment state
  const [assessmentData, setAssessmentData] = useState<{
    assessment: any;
    pathway: any;
    hospitals: Hospital[];
    doctors: Specialist[];
  } | null>(null);
  const [initialDeptFilter, setInitialDeptFilter] = useState<string>('');

  const handleCompleteAssessment = (
    assessment: any,
    pathway: any,
    recommendedHospitals: Hospital[],
    doctors?: Specialist[]
  ) => {
    setAssessmentData({
      assessment,
      pathway,
      hospitals: recommendedHospitals,
      doctors: doctors || [],
    });

    const dept = pathway?.target_department || assessment?.department || '';
    setInitialDeptFilter(dept);

    setShowAITriage(false);

    const nextStep = pathway?.next_step || (assessment?.emergency ? 'EMERGENCY' : 'ROUTINE_CONSULTATION');

    if (nextStep === 'EMERGENCY') {
      if (recommendedHospitals && recommendedHospitals.length > 0) {
        setHospitals((prev) => {
          const top = recommendedHospitals[0];
          const exists = prev.some((h) => h.id === top.id || h.name === top.name);
          if (!exists) {
            return [top, ...prev];
          }
          return prev;
        });
      }
      setShowSOS(true);
      setPatientTab('home');
      showToast('🚨 Automatic Emergency Routing: Critical Emergency SOS Active');
    } else if (nextStep === 'VIDEO_PREFERRED') {
      setPatientTab('video_view');
      showToast('🎥 Automatic Pathway: Video Consultation Recommended');
    } else if (nextStep === 'VIDEO_OR_IN_PERSON') {
      setPatientTab('video_choice');
      showToast('🎥 Automatic Pathway: Choose Video or In-Person Consultation');
    } else {
      setPatientTab('book');
      showToast(`🏥 Automatic Pathway: Doctor List filtered by ${dept || 'Department'}`);
    }
  };

  // Handlers for Login & Role Switch
  const handleLoginSuccess = (role: 'doctor' | 'patient', userName: string) => {
    setCurrentScreen(role);
    showToast(`Authenticated as ${userName}`);
  };

  const handleSignOut = () => {
    setCurrentScreen('landing');
    setDoctorTab('home');
    setPatientTab('home');
    showToast('Signed out to Landing Page');
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
      prev.map((a) => {
        if (a.id === aptId) {
          const isToday = date.toLowerCase().includes('today');
          return {
            ...a,
            date,
            time,
            dateLabel: date,
            status: isToday ? 'TODAY' : 'UPCOMING',
          };
        }
        return a;
      })
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
      {/* 1. Landing Page */}
      {currentScreen === 'landing' && (
        <LandingPage onNavigateScreen={(screen) => setCurrentScreen(screen)} />
      )}

      {/* 2. Login Page */}
      {currentScreen === 'login' && (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onNavigateScreen={(screen) => setCurrentScreen(screen)}
        />
      )}

      {/* 3. Patient Registration Wizard */}
      {currentScreen === 'patient_register' && (
        <PatientRegistrationWizard
          onCompletePatientRegistration={(userName) => {
            setCurrentScreen('patient');
            showToast(`Welcome ${userName}! Health account created.`);
          }}
          onNavigateScreen={(screen) => setCurrentScreen(screen)}
        />
      )}

      {/* 4. Doctor Registration Wizard */}
      {currentScreen === 'doctor_register' && (
        <DoctorRegistrationWizard
          onCompleteDoctorRegistration={(doctorName) => {
            setCurrentScreen('doctor');
            showToast(`Welcome ${doctorName}! Doctor profile registered.`);
          }}
          onNavigateScreen={(screen) => setCurrentScreen(screen)}
        />
      )}

      {/* 5. Doctor Portal */}
      {currentScreen === 'doctor' && (
        <div className="flex flex-col min-h-screen pt-16">
          <DoctorHeader
            onOpenNotifications={() => setDoctorTab('alerts')}
            onOpenProfile={() => setDoctorTab('profile')}
            unreadNotificationsCount={notifications.filter((n) => n.unread).length}
            docProfile={docProfile}
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
                    date: 'Sep 12, 2026',
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
                onReschedule={(apt) => setRescheduleApt(apt)}
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
                    lastVisit: 'Sep 05, 2026',
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
              <DoctorProfileView
                onSignOut={handleSignOut}
                onShowToast={showToast}
                docProfile={docProfile}
                onUpdateDocProfile={(prof) => setDocProfile(prof)}
              />
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
            medicalRecords={medicalRecords}
          />
        </div>
      )}

      {/* 6. Patient Portal */}
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
                specialists={assessmentData?.doctors && assessmentData.doctors.length > 0 ? assessmentData.doctors : specialists}
                appointments={appointments}
                initialDeptFilter={initialDeptFilter}
                onConfirmBooking={handleConfirmPatientBooking}
                onCancelAppointment={handleConfirmCancel}
                onShowToast={showToast}
              />
            )}

            {patientTab === 'emergency_view' && (
              <EmergencyAssistanceView
                assessment={assessmentData?.assessment}
                pathway={assessmentData?.pathway}
                topHospital={assessmentData?.hospitals?.[0]}
                onTriggerSOS={handleTriggerPatientSOS}
                onShowToast={showToast}
                onBackToHome={() => setPatientTab('home')}
              />
            )}

            {(patientTab === 'video_view' || patientTab === 'video_choice') && (
              <VideoConsultationRecommendationView
                assessment={assessmentData?.assessment}
                pathway={assessmentData?.pathway}
                doctors={assessmentData?.doctors && assessmentData.doctors.length > 0 ? assessmentData.doctors : specialists}
                onSelectDoctor={(doc, mode) => {
                  handleConfirmPatientBooking(doc, 'Sep 14, 2026', '10:00 AM', mode, assessmentData?.assessment?.reason || 'Consultation');
                }}
                onShowToast={showToast}
                onBackToHome={() => setPatientTab('home')}
              />
            )}

            {patientTab === 'records' && (
              <PatientMedicalRecordsView
                records={medicalRecords}
                onUploadRecord={(rec) => setMedicalRecords((prev) => [rec, ...prev])}
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
            onCompleteAssessment={handleCompleteAssessment}
          />
        </div>
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
